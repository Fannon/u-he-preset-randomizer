#!/usr/bin/env node
import { analyzeParamsTypeAndRange } from "./analyzer";
import { loadPresetLibrary, writePresetLibrary } from "./presetLibrary";
import * as fs from "fs-extra";
import { log } from "./utils/log";
import { getConfigFromParameters } from "./config";
import { generateFullyRandomPresets, generateMergedPresets, generateRandomizedPresets } from "./randomizer";
import { prompt } from "enquirer"
import { detectPresetLibraryLocations } from "./utils/detector";

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
  log.error(err)
  process.exit(1)
});

function runWithoutInteractivity() {
  const presetLibrary = loadPresetLibrary(config.synth, config.pattern, config.binary)
  if (config.debug) {
    fs.outputFileSync(
      "./tmp/presetLibrary.json",
      JSON.stringify(presetLibrary, null, 2)
    );
  }
  
  const paramsModel = analyzeParamsTypeAndRange(presetLibrary)
  if (config.debug) {
    fs.outputFileSync(
      "./tmp/paramsModel.json",
      JSON.stringify(paramsModel, null, 2)
    );
  }
  
  if (config.merge) {
    // Merge multiple presets together, with additional randomness
    const generatedPresets = generateMergedPresets(presetLibrary, config)
    writePresetLibrary(generatedPresets)
  } else if (config.preset) {
    // Randomize a particular preset
    const generatedPresets = generateRandomizedPresets(presetLibrary, paramsModel, config)
    writePresetLibrary(generatedPresets)
  } else {
    // Generate fully randomized presets
    const generatedPresets = generateFullyRandomPresets(presetLibrary, paramsModel, config.amount)
    writePresetLibrary(generatedPresets)
  }

  console.log('======================================================================')
  console.log('Successfully completed.')
}

async function runInteractiveMode() {

  // 1) Detect available u-he synths and offer user choice
  
  // Detect correct Preset Library Location
  const locations = detectPresetLibraryLocations()
  const synth = await prompt<{value: string}>({
    type: 'autocomplete',
    name: 'value',
    message: 'Which u-he synth to generate presets for?',
    choices: Object.keys(locations)
  })
  config.synth = synth.value

  // 2) Choose random generation mode
  const mode = await prompt<{value: string}>({
    type: 'autocomplete',
    name: 'value',
    message: 'Which random mode?',
    choices: [
      "Fully randomized presets",
      "Randomize existing preset",
      "Merge existing presets",
    ]
  })

  const pattern = await prompt<{value: string}>({
    type: 'text',
    name: 'value',
    message: 'Which presets should be loaded for randomization? Choose glob-pattern (ask Google).\n "**/*" (default) will load all presets in all folders.\n "Some Folder/**/*" will load all presets in Some Folder\n "**/PD *" will load all presets starting with "PD ".',
    initial: '**/*'
  })
  config.pattern = pattern.value

  console.log('Loading and analyzing preset library...')
  const presetLibrary = loadPresetLibrary(config.synth, config.pattern, config.binary)
  const foundPresets = presetLibrary.presets.map((el) =>  el.filePath)
  const paramsModel = analyzeParamsTypeAndRange(presetLibrary)

  if (mode.value === "Fully randomized presets") {
    // MODE 1: Generate fully randomized presets

    config.amount = await chooseAmountOfPresets(16)
    const generatedPresets = generateFullyRandomPresets(presetLibrary, paramsModel, config.amount)
    writePresetLibrary(generatedPresets)

  } else if (mode.value === "Randomize existing preset") {

    // MODE 2: Randomize existing preset

    console.log('Which preset to randomize?')
    console.log(' Type for autocomplete, enter to select.')
    console.log(' Enter ? to choose a random preset.')
    const confirm = await prompt<{value: boolean}>({
      type: 'confirm',
      name: 'value',
      message: 'Ready? (Y/n)',
      initial: true,
    })

    if (!confirm.value) {
      process.exit(0)
    }

    const presetChoice = await prompt<{value: string}>({
      type: 'autocomplete',
      name: 'value',
      message: 'Choose a preset to randomize. Type for autocomplete.',
      choices: ["?"].concat(foundPresets),
    })
    config.preset = presetChoice.value

    // Choose amount of randomness
    const randomness = await prompt<{value: number}>({
      type: 'number',
      name: 'value',
      message: 'How much randomness to apply (0-100)?',
      initial: 20
    })
    config.randomness = randomness.value

    config.amount = await chooseAmountOfPresets(8)

    const generatedPresets = generateRandomizedPresets(presetLibrary, paramsModel, config)
    writePresetLibrary(generatedPresets)
  } else if (mode.value === "Merge existing presets") {

    // MODE 3: Merge Random Presets

    console.log('Now choose at least two presets to merge:')
    console.log(' Type for autocomplete, enter to select.')
    console.log(' Enter ? to select a random preset')
    console.log(' Enter * to select all presets (use with care!)')
    console.log(' Enter without selection to complete your selection')
    const confirm = await prompt<{value: boolean}>({
      type: 'confirm',
      name: 'value',
      message: 'Ready? (Y/n)',
      initial: true,
    })

    if (!confirm.value) {
      process.exit(0)
    }

    config.merge = []
    while (true) {
      const presetChoice = await prompt<{value: string}>({
        type: 'autocomplete',
        name: 'value',
        message: 'Choose multiple presets to merge.',
        choices: ["", "?", "*"].concat(foundPresets)
      })
      if (presetChoice.value) {
        config.merge.push(presetChoice.value)
        if (presetChoice.value === "*") {
          break;
        }
      } else {
        break;
      }
    }

    console.log(`Selected Presets: \n > ${config.merge.join('\n > ')}`)

    config.amount = await chooseAmountOfPresets(8)
    const generatedPresets = generateMergedPresets(presetLibrary, config)
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
  console.log(cliCommand)
}

//////////////////////////////////////////
// HELPER FUNCTIONS                     //
//////////////////////////////////////////

/** Choose number of presets to generate */
async function chooseAmountOfPresets(initial: number = 8): Promise<number> {
  const amount = await prompt<{value: number}>({
    type: 'number',
    name: 'value',
    message: 'How many presets to generate?',
    initial: initial
  })
  return amount.value
}
