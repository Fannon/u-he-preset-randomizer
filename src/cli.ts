#!/usr/bin/env node
import { analyzeParamsTypeAndRange, convertParamsModelBySection } from "./analyzer.js";
import { PresetLibrary, loadPresetLibrary, writePresetLibrary } from "./presetLibrary.js";
import fs from "fs-extra";
import { getConfigFromParameters } from "./config.js";
import { generateFullyRandomPresets, generateMergedPresets, generateRandomizedPresets } from "./randomizer.js";
import { DetectedPresetLibrary, detectPresetLibraryLocations } from "./utils/detector.js";
import inquirer from "inquirer"
import inquirerPrompt from "inquirer-autocomplete-prompt"
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = fs.readJSONSync(__dirname + '/../package.json')

console.log('======================================================================')
console.log('u-he Preset Randomizer CLI v' + packageJson.version)
console.log('======================================================================')

const config = getConfigFromParameters();

(async () => {
  
  if (!config.synth) {
    // If no synth is given, we'll go into fully interactive CLI mode
    await runInteractiveMode()
  } else {
    runWithoutInteractivity()
  }

})().catch((err) => {
  console.error(err)
  process.exit(1)
});

function runWithoutInteractivity() {
  const presetLibrary = loadPresetLibrary(config.synth, config.pattern, config.binary)

  // Filter out presets by category (if given)
  if (config.category && config.category !== true) {
    presetLibrary.presets = narrowDownByCategory(presetLibrary, config.category)
  }
  
  const paramsModel = analyzeParamsTypeAndRange(presetLibrary)
  
  if (config.debug) {
    // Write a cleaned up parameter model to ./tmp/paramsModel.json
    const outputParamsModel = JSON.parse(JSON.stringify(paramsModel))
    // Remove values from debug paramsModel, as it would blow up the result too much.
    for (const paramKey in outputParamsModel) {
      delete outputParamsModel[paramKey].values;
    }
    fs.outputFileSync(
      "./tmp/paramsModel.json",
      JSON.stringify(convertParamsModelBySection(outputParamsModel), null, 2)
    );
  }
  
  if (config.merge) {
    // Merge multiple presets together, with additional randomness
    const generatedPresets = generateMergedPresets(presetLibrary, paramsModel, config)
    writePresetLibrary(generatedPresets)
  } else if (config.preset) {
    // Randomize a particular preset
    const generatedPresets = generateRandomizedPresets(presetLibrary, paramsModel, config)
    writePresetLibrary(generatedPresets)
  } else {
    // Generate fully randomized presets
    const generatedPresets = generateFullyRandomPresets(presetLibrary, paramsModel, config)
    writePresetLibrary(generatedPresets)
  }

  console.log('======================================================================')
  console.log('Successfully completed.')
}

async function runInteractiveMode() {

  // Detect correct Preset Library Location
  const locations = detectPresetLibraryLocations()

  // 1) Detect available u-he synths and offer user choice
  inquirer.registerPrompt('autocomplete', inquirerPrompt);
  const synthChoices = locations.map((el: DetectedPresetLibrary) => {
    return {
      value: el.synthName
    }
  })
  const synth = await inquirer.prompt([{
    name: 'value',
    type: 'autocomplete',
    message: 'Which u-he synth to generate presets for?',
    pageSize: synthChoices.length,
    source: async (_answersSoFar, input: string) => {
      if (!input) {
        return synthChoices
      } else {
        return synthChoices.filter((el) => {
          return el.value.toLowerCase().startsWith(input.toLowerCase())
        })
      }
    }
  }])
  config.synth = synth.value

  // 2) Choose random generation mode
  const mode = await inquirer.prompt([{
    name: 'value',
    type: 'list',
    message: 'Which random mode?',
    choices: [
      { value: "Fully randomized presets", checked: true },
      { value: "Randomize existing preset" },
      { value: "Merge existing presets" },
    ]
  }])

  // 2.5) Choose optional modifiers for randomization
  if (!config.stable || !config.binary) {
    const modifiers = await inquirer.prompt([{
      name: 'value',
      type: 'checkbox',
      message: 'Any randomization modifiers?',
      choices: [
        { value: "category", name: '[Category]   Narrow down by category' },
        { value: "stable",   name: '[Stable]     More stable randomization approach' },
        { value: "binary",   name: '[Binary]     Include binary section (WARNING: Very unstable!)' },
      ]
    }])
    if (modifiers.value.includes('category')) {
      config.category = true;
    }
    if (modifiers.value.includes('stable')) {
      config.stable = true;
    }
    if (modifiers.value.includes('binary')) {
      config.binary = true;
    }
  }

  // 3) Pattern to load presets
  if (!config.pattern) {
    const p3 = await inquirer.prompt([{
      name: 'pattern',
      type: 'input',
      message: 'Which presets should be loaded for randomization (glob pattern)?',
      suffix: '\n "**/*"              will load all presets in all folders (default).\n "Some Folder/**/*"  will load all presets in Some Folder\n "**/PD *"           will load all presets starting with "PD ".\n',
      default: '**/*'
    }])
    config.pattern = p3.pattern
  }

  console.log('Loading and analyzing preset library...')
  const presetLibrary = loadPresetLibrary(config.synth, config.pattern, config.binary)
  const foundPresets = presetLibrary.presets.map((el) =>  el.filePath)

  if (config.category === true) {

    const availableCategories = {};

    for (const preset of presetLibrary.presets) {
      for (const category of preset.categories) {
        const parentCategory = category.split(':')[0]
        if (!availableCategories[parentCategory]) {
          availableCategories[parentCategory] = 0
        }
        availableCategories[parentCategory]++;
        if (!availableCategories[category]) {
          availableCategories[category] = 0
        }
        availableCategories[category]++;
      }
    }

    const allChoices = []
    for (const category in availableCategories) {
      allChoices.push({
        value: category,
        name: `${category} (${availableCategories[category]})`
      })
    }
    allChoices.sort()

    const p4 = await inquirer.prompt([{
      name: 'value',
      type: 'autocomplete',
      message: 'Which category to narrow down to?',
      pageSize: 12,
      source: async (_answersSoFar, input) => {
        if (!input) {
          return allChoices
        } else {
          return allChoices.filter((el) => {
            return el.name.toLowerCase().includes(input.toLowerCase())
          })
        }
      }
    }])
    config.category = p4.value
  }

  // Filter out presets by category (if given)
  if (config.category && config.category !== true) {
    presetLibrary.presets = narrowDownByCategory(presetLibrary, config.category)
  }

  const paramsModel = analyzeParamsTypeAndRange(presetLibrary)

  if (mode.value === "Fully randomized presets") {

    //////////////////////////////////////////////////
    // MODE 1: Generate fully randomized presets    //
    //////////////////////////////////////////////////

    if (!config.amount) {
      config.amount = await chooseAmountOfPresets(16)
    }
    const generatedPresets = generateFullyRandomPresets(presetLibrary, paramsModel, config)
    writePresetLibrary(generatedPresets)

  } else if (mode.value === "Randomize existing preset") {
   
    //////////////////////////////////////////////////
    // MODE 2: Randomize existing preset            //
    //////////////////////////////////////////////////

    config.preset = await choosePreset(foundPresets)
    if (!config.preset) {
      process.exit(0)
    }

    if (!config.randomness) {
      config.randomness = await chooseRandomness(20)
    }
    if (!config.amount) {
      config.amount = await chooseAmountOfPresets(8)
    }

    const generatedPresets = generateRandomizedPresets(presetLibrary, paramsModel, config)
    writePresetLibrary(generatedPresets)

  } else if (mode.value === "Merge existing presets") {

    //////////////////////////////////////////////////
    // MODE 3: Merge Random Presets                 //
    //////////////////////////////////////////////////

    config.merge = []
    while (true) {
      const presetChoice = await choosePreset(foundPresets, true)
      if (presetChoice) {
        config.merge.push(presetChoice)
        if (presetChoice === "*") {
          break;
        }
      } else {
        break;
      }
    }

    // Choose amount of randomness
    if (!config.randomness) {
      config.randomness = await chooseRandomness(0)
    }
    if (!config.amount) {
      config.amount = await chooseAmountOfPresets(8)
    }
    const generatedPresets = generateMergedPresets(presetLibrary, paramsModel, config)
    writePresetLibrary(generatedPresets)
  }

  console.log('======================================================================')
  console.log('Successfully completed.')
  console.log('')
  console.log('To run it with the same configuration again, execute:')

  let cliCommand = `npx u-he-preset-randomizer@latest --synth ${config.synth} --amount ${config.amount}`
  if (config.preset) {
    cliCommand += ` --preset "${config.preset}" --random ${config.randomness}`
  } else if (config.merge) {
    for (const merge of config.merge) {
      cliCommand += ` --merge "${merge}"`
    }
  }
  if (config.pattern && config.pattern !== '**/*') {
    cliCommand += ` --pattern "${config.pattern}"`
  }
  if (config.category) {
    cliCommand += ` --category "${config.category}"`
  }
  if (config.debug) {
    cliCommand += ` --debug`
  }
  if (config.stable) {
    cliCommand += ` --stable`
  }
  console.log(cliCommand)
}

//////////////////////////////////////////
// HELPER FUNCTIONS                     //
//////////////////////////////////////////

/** Choose number of presets to generate */
async function chooseAmountOfPresets(initial: number = 8): Promise<number> {
  const amount = await inquirer.prompt([{
    name: 'value',
    type: 'number',
    message: 'How many presets to generate?',
    default: initial
  }])
  return amount.value
}
/** Choose randomness amount */
async function chooseRandomness(initial: number = 20): Promise<number> {
  const amount = await inquirer.prompt([{
    name: 'value',
    type: 'number',
    message: 'How much randomness to apply (0-100)',
    default: initial,
    validate: (input: number) => {
      return input >= 0 && input <= 100
    }
  }])
  return amount.value
}

async function choosePreset(foundPresets: string[], allowSelectAll: boolean = false): Promise<string> {
  const controlChoices = [
    { value: '', name: '  (no choice / complete)' },
    { value: '?', name: '? (random pick)' },
  ]
  if (allowSelectAll) {
    controlChoices.push({ value: '*', name: '* (select all)' })
  }

  const allChoices = controlChoices.concat(foundPresets.map((el) => {
    return {
      value: el,
      name: el,
    }
  }))
  
  const presetChoice = await inquirer.prompt([{
    name: 'value',
    type: 'autocomplete',
    message: 'Which preset to randomize?',
    pageSize: 12,
    source: async (_answersSoFar, input) => {
      if (!input) {
        return allChoices
      } else {
        return allChoices.filter((el) => {
          return el.name.toLowerCase().includes(input.toLowerCase())
        })
      }
    }
  }])
  return presetChoice.value
}

function narrowDownByCategory(presetLibrary: PresetLibrary, category: string) {
  console.log(category)
  const filteredPresets = presetLibrary.presets.filter((el) => {
    if (!el.categories.length) {
      return false;
    }
    for (const ownCategory of el.categories) {
      if (ownCategory.startsWith(category as string)) {
        return true;
      }
    }
    return false;
  })
  console.log(`Narrowed down by category "${category}" to ${filteredPresets.length} presets`)
  return filteredPresets;
}
