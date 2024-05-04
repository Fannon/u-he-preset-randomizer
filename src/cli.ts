#!/usr/bin/env node
import { analyzeParamsTypeAndRange } from "./analyzer";
import { loadPresetLibrary, writePresetLibrary } from "./presetLibrary";
import * as fs from "fs-extra";
import { log } from "./utils/log";
import { getConfig } from "./config";
import { generateFullyRandomPresets, generateMergedPresets, generateRandomizedPresets } from "./randomizer";

const packageJson = fs.readJSONSync(__dirname + '/../package.json')

log.info('======================================================================')
log.info('u-he Preset Randomizer CLI v' + packageJson.version)
log.info('======================================================================')

const config = getConfig();

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

