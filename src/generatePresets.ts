import chalk from 'chalk';
import fs from 'fs-extra';
import {
  analyzeParamsTypeAndRange,
  convertParamsModelBySection,
  type ParamsModel,
} from './analyzer.js';
import type { Config } from './config.js';
import {
  narrowDownByAuthor,
  narrowDownByCategory,
  narrowDownByFavoritesFile,
} from './libraryFilters.js';
import {
  loadPresetLibrary,
  type PresetLibrary,
  writePresetLibrary,
} from './presetLibrary.js';
import {
  generateFullyRandomPresets,
  generateMergedPresets,
  generateRandomizedPresets,
} from './randomizer.js';

/**
 * Main function to generate presets based on the provided configuration.
 * @param inputConfig Configuration options for preset generation.
 */
export function generatePresets(inputConfig: Config) {
  const config: Config = {
    ...inputConfig,
  };

  if (!config.synth) {
    throw new Error('Synth not specified in config');
  }

  if (config.folder && config.folder !== true) {
    config.pattern = `${config.folder}${config.pattern ?? '**/*'}`;
  }

  const presetLibrary = loadPresetLibrary(config.synth, config);
  const filteredLibrary = applyPresetFilters(presetLibrary, config);

  const paramsModel = analyzeParamsTypeAndRange(filteredLibrary);

  if (config.debug) {
    dumpParamsModel(paramsModel);
    console.debug(chalk.gray(JSON.stringify(config, null, 2)));
  }

  let generatedPresets: PresetLibrary;
  if (config.merge) {
    generatedPresets = generateMergedPresets(
      filteredLibrary,
      paramsModel,
      config,
    );
    writePresetLibrary(generatedPresets);
  } else if (config.preset) {
    generatedPresets = generateRandomizedPresets(
      filteredLibrary,
      paramsModel,
      config,
    );
    writePresetLibrary(generatedPresets);
  } else {
    generatedPresets = generateFullyRandomPresets(
      filteredLibrary,
      paramsModel,
      config,
    );
    writePresetLibrary(generatedPresets);
  }

  console.log('');
  console.log(chalk.green('Successfully generated presets!'));
  console.log('');
  console.log(chalk.bold('Where to find them:'));
  console.log(`   ${generatedPresets.userPresetsFolder}`);
  console.log('');
  console.log(chalk.bold('Next steps:'));
  console.log('   1. Open your DAW and load the synth');
  console.log('   2. Look in the "RANDOM" folder in your user presets');
  console.log('   3. Browse and audition the generated sounds');
  console.log(
    '======================================================================',
  );
}

function applyPresetFilters(
  presetLibrary: PresetLibrary,
  config: Config,
): PresetLibrary {
  const filteredLibrary: PresetLibrary = {
    ...presetLibrary,
    presets: [...presetLibrary.presets],
  };

  if (config.favorites && config.favorites !== true) {
    filteredLibrary.presets = narrowDownByFavoritesFile(
      filteredLibrary,
      config.favorites,
    );
  }

  if (config.author && config.author !== true) {
    filteredLibrary.presets = narrowDownByAuthor(
      filteredLibrary,
      config.author,
    );
  }

  if (config.category && config.category !== true) {
    filteredLibrary.presets = narrowDownByCategory(
      filteredLibrary,
      config.category,
    );
  }

  return filteredLibrary;
}

function dumpParamsModel(paramsModel: ParamsModel) {
  const outputParamsModel = JSON.parse(
    JSON.stringify(paramsModel),
  ) as ParamsModel;
  for (const paramKey in outputParamsModel) {
    const param = outputParamsModel[paramKey];
    if (param && 'values' in param) {
      param.values = [];
    }
  }
  fs.outputFileSync(
    './tmp/paramsModel.json',
    JSON.stringify(convertParamsModelBySection(outputParamsModel), null, 2),
  );
}
