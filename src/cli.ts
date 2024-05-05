#!/usr/bin/env node
import { analyzeParamsTypeAndRange } from "./analyzer";
import { loadPresetLibrary, writePresetLibrary } from "./presetLibrary";
import * as fs from "fs-extra";
import * as path from "path";
import * as os from "os";
import * as fg from "fast-glob";
import { log } from "./utils/log";
import { getConfigFromParameters } from "./config";
import { generateFullyRandomPresets, generateMergedPresets, generateRandomizedPresets } from "./randomizer";
import { prompt } from "enquirer"

const packageJson = fs.readJSONSync(__dirname + '/../package.json')

log.info('======================================================================')
log.info('u-he Preset Randomizer CLI v' + packageJson.version)
log.info('======================================================================')

const config = getConfigFromParameters();

(async () => {
  
  if (!config.synthName) {
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
  const presetLibrary = loadPresetLibrary(config.synthName)
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

}

async function runInteractiveMode() {

  // 1) Detect available u-he synths and offer user choice
  const uheDocuments = path.join(
    os.homedir(),
    `/Documents/u-he/`
  );
  const synthFolders = fg.sync(["*.data"], { cwd: uheDocuments, deep: 1, onlyDirectories: true });
  const availableSynths = synthFolders.map((el) => {
    return el.replace('.data', '')
  })
  const synthName = await prompt<{value: string}>({
    type: 'autocomplete',
    name: 'value',
    message: 'Which u-he synth to generate presets for?',
    choices: availableSynths
  })
  config.synthName = synthName.value

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

  log.info('Loading and analyzing preset library...')
  const presetLibrary = loadPresetLibrary(config.synthName)
  const foundPresets = presetLibrary.presets.map((el) =>  el.filePath)
  const paramsModel = analyzeParamsTypeAndRange(presetLibrary)

  if (mode.value === "Fully randomized presets") {
    // MODE 1: Generate fully randomized presets

    // Choose number of presets to generate
    const amount = await prompt<{value: number}>({
      type: 'number',
      name: 'value',
      message: 'How many presets to generate?',
      initial: 16
    })
    config.amount = amount.value

    const generatedPresets = generateFullyRandomPresets(presetLibrary, paramsModel, config.amount)
    writePresetLibrary(generatedPresets)

  } else if (mode.value === "Randomize existing preset") {

    // MODE 2: Randomize existing preset

    log.info('Now choose one presets to merge. Type for autocomplete, enter to select.')
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
      choices: foundPresets
    })
    config.preset = presetChoice.value

    // Choose number of presets to generate
    const amount = await prompt<{value: number}>({
      type: 'number',
      name: 'value',
      message: 'How many presets to generate?',
      initial: 8
    })
    config.amount = amount.value

    const generatedPresets = generateRandomizedPresets(presetLibrary, paramsModel, config)
    writePresetLibrary(generatedPresets)
  } else if (mode.value === "Merge existing presets") {

    // MODE 3: Merge Random Presets

    log.info('Now choose at least two presets to merge. Type for autocomplete, enter to select.')
    log.info('Complete selection by pressing enter without a selection.')
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
        choices: [""].concat(foundPresets)
      })
      console.log(presetChoice)
      if (presetChoice.value) {
        config.merge.push(presetChoice.value)
      } else {
        break;
      }
    }

    log.info(`Selection: ${config.merge.join(', ')}`)

    if (config.merge.length < 2) {
      log.error(`At least two presets need to be chosen. Will abort.`)
      process.exit(1)
    }

    // Choose number of presets to generate
    const amount = await prompt<{value: number}>({
      type: 'number',
      name: 'value',
      message: 'How many presets to generate?',
      initial: 8
    })
    config.amount = amount.value

    const generatedPresets = generateMergedPresets(presetLibrary, config)
    writePresetLibrary(generatedPresets)
  }

}

