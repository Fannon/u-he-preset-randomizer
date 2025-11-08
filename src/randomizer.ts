/**
 * @file Core randomization logic for preset generation.
 * Provides functions to generate fully random presets, randomize existing presets,
 * and merge multiple presets with statistical weighting.
 */

import chalk from 'chalk';
import {
  adjectives,
  colors,
  names,
  uniqueNamesGenerator,
} from 'unique-names-generator';
import { getDictionaryOfNames, type ParamsModel } from './analyzer.js';
import type { Config } from './config.js';
import type { Preset } from './parser.js';
import type { PresetLibrary } from './presetLibrary.js';

/**
 * Generates fully randomized presets based on statistical distributions from the preset library.
 */
export function generateFullyRandomPresets(
  presetLibrary: PresetLibrary,
  paramModel: ParamsModel,
  config: Config,
): PresetLibrary {
  if (presetLibrary.presets.length === 0) {
    throw new Error('No presets available for randomization.');
  }

  const newPresetLibrary: PresetLibrary = {
    ...presetLibrary,
    userPresetsFolder: `${presetLibrary.userPresetsFolder}/RANDOM`,
    presets: [],
  };
  for (let i = 0; i < (config.amount ?? 16); i++) {
    const basePreset = getRandomArrayItem(presetLibrary.presets);
    if (!basePreset) {
      console.error(
        chalk.red('Error: Could not get random preset from library'),
      );
      continue;
    }
    const randomPreset: Preset = structuredClone(basePreset);

    if (config.stable) {
      const presetPerSectionMap: Record<string, Preset> = {};

      for (const param of randomPreset.params) {
        const paramModelEntry = paramModel[param.id];
        if (!paramModelEntry) {
          console.error(
            chalk.red(
              `Error: Unknown parameter ${param.id} in preset ${randomPreset.filePath}, missing in analyzed parameter model`,
            ),
          );
          continue;
        }

        if (!presetPerSectionMap[param.section]) {
          const randomSectionPreset = getRandomArrayItem(presetLibrary.presets);
          if (randomSectionPreset) {
            presetPerSectionMap[param.section] = randomSectionPreset;
          } else {
            continue;
          }
        }

        if (
          paramModelEntry.type === 'string' ||
          paramModelEntry.distinctValues.length <= 2
        ) {
          // Do not randomize string type values or values that only have 1 or 2 distinct values
          continue;
        }

        if (paramModelEntry.keepStable) {
          // Do not randomize if parameter is marked as to be kept stable
          continue;
        }

        const sectionPreset = presetPerSectionMap[param.section];
        const randomNewParam = sectionPreset?.params.find(
          (el) => el.id === param.id,
        );

        if (randomNewParam) {
          param.value = randomNewParam.value;
        } else {
          // If the preset doesn't have the particular param, fall back to a fully random value
          const randomValue = getRandomValue(paramModelEntry, !config.creative);
          if (randomValue !== undefined) {
            param.value = randomValue;
          }
        }
      }
    } else {
      for (const param of randomPreset.params) {
        const paramModelEntry = paramModel[param.id];
        if (!paramModelEntry) {
          console.error(
            chalk.red(
              `Error: Unknown parameter ${param.id} in preset ${randomPreset.filePath}, missing in analyzed parameter model`,
            ),
          );
          continue;
        }
        if (paramModelEntry.keepStable === 'always') {
          continue;
        }
        const randomValue = getRandomValue(paramModelEntry, !config.creative);
        if (randomValue !== undefined) {
          param.value = randomValue;
        }
      }
    }

    let randomName = uniqueNamesGenerator({
      dictionaries: [adjectives, colors, names],
      separator: ' ',
      style: 'capital',
    });

    if (config.dictionary) {
      const names = getDictionaryOfNames(presetLibrary);
      randomName = `${getRandomArrayItem(names)} ${getRandomArrayItem(names)} ${getRandomArrayItem(names)}`;
    }

    randomPreset.filePath = `/Fully Random/RND ${randomName}.h2p`;
    if (config.category && config.category !== true) {
      randomPreset.filePath = `/Fully Random/${config.category.split(':').join(' ')}/RND ${randomName}.h2p`;
    }
    randomPreset.presetName = `RND ${randomName}`;
    randomPreset.meta = [
      {
        key: 'Author',
        value: 'Random Generator',
      },
      {
        key: 'Description',
        value: `Fully random preset. ${getPresetDescriptionSuffix(config)}`,
      },
    ];
    if (config.category) {
      randomPreset.meta.push({
        key: 'Categories',
        value: [config.category as string],
      });
    }
    newPresetLibrary.presets.push(randomPreset);
  }
  return newPresetLibrary;
}

/**
 * Randomize a given preset, with specific randomization ratio
 */
export function generateRandomizedPresets(
  presetLibrary: PresetLibrary,
  paramModel: ParamsModel,
  config: Config,
): PresetLibrary {
  const newPresetLibrary: PresetLibrary = {
    ...presetLibrary,
    userPresetsFolder: `${presetLibrary.userPresetsFolder}/RANDOM`,
    presets: [],
  };

  // Handle multiple presets
  if (Array.isArray(config.preset)) {
    const totalAmount = config.amount ?? 8;
    const amountPerPreset = Math.ceil(totalAmount / config.preset.length);

    for (const presetString of config.preset) {
      const basePreset = findBasePreset(presetLibrary, presetString);
      if (!basePreset) {
        throw new Error(`No preset with name ${presetString} found!`);
      }

      generateVariationsForPreset(
        basePreset,
        amountPerPreset,
        newPresetLibrary,
        paramModel,
        config,
        presetLibrary,
      );
    }

    // Trim to exact amount if we generated too many
    if (newPresetLibrary.presets.length > totalAmount) {
      newPresetLibrary.presets = newPresetLibrary.presets.slice(0, totalAmount);
    }
  } else {
    // Handle single preset (existing behavior)
    const basePreset = findBasePreset(presetLibrary, config.preset);
    if (!basePreset) {
      throw new Error(`No preset with name ${config.preset ?? ''} found!`);
    }

    generateVariationsForPreset(
      basePreset,
      config.amount ?? 8,
      newPresetLibrary,
      paramModel,
      config,
      presetLibrary,
    );
  }

  return newPresetLibrary;
}

function findBasePreset(
  presetLibrary: PresetLibrary,
  presetString?: string,
): Preset | undefined {
  // If no preset given or "?" is passed, choose a random preset
  if (presetString === '?' || !presetString) {
    return getRandomArrayItem(presetLibrary.presets);
  } else if (presetString.startsWith('?')) {
    return getRandomArrayItem(
      presetLibrary.presets.filter((el) => {
        const searchString = presetString.split('?').join('').toLowerCase();
        return el?.filePath?.toLowerCase().includes(searchString);
      }),
    );
  } else {
    return presetLibrary.presets.find((el) => {
      return el.filePath.includes(presetString);
    });
  }
}

function generateVariationsForPreset(
  basePreset: Preset,
  amount: number,
  newPresetLibrary: PresetLibrary,
  paramModel: ParamsModel,
  config: Config,
  presetLibrary: PresetLibrary,
): void {
  for (let i = 0; i < amount; i++) {
    const randomPreset = randomizePreset(basePreset, paramModel, config);
    let randomName = uniqueNamesGenerator({
      dictionaries: [adjectives, colors],
      separator: ' ',
      style: 'capital',
    });
    if (config.dictionary) {
      const names = getDictionaryOfNames(presetLibrary);
      randomName = `${getRandomArrayItem(names)} ${getRandomArrayItem(names)}`;
    }

    randomPreset.filePath = `/Randomized Preset/${randomPreset.presetName}/RND ${randomName} ${randomPreset.presetName}.h2p`;
    randomPreset.presetName = `RND ${randomName} ${randomPreset.presetName}`;

    const descriptionMeta = randomPreset.meta.find(
      (el) => el.key === 'Description',
    );
    if (descriptionMeta && typeof descriptionMeta.value === 'string') {
      descriptionMeta.value += `. Randomized existing preset: ${randomPreset.presetName}. ${getPresetDescriptionSuffix(config)}`;
    }

    newPresetLibrary.presets.push(randomPreset);
  }
}

/**
 * Merge multiple presets together, with randomization amount
 */
export function generateMergedPresets(
  presetLibrary: PresetLibrary,
  paramModel: ParamsModel,
  config: Config,
): PresetLibrary {
  const newPresetLibrary: PresetLibrary = {
    ...presetLibrary,
    userPresetsFolder: `${presetLibrary.userPresetsFolder}/RANDOM`,
    presets: [],
  };

  let mergePresets: Preset[] = [];

  const mergeConfig = config.merge ?? [];
  const mergeArray = Array.isArray(mergeConfig) ? mergeConfig : [mergeConfig];

  for (const presetTitle of mergeArray) {
    // If no preset given or "?" is passed, choose a random preset
    if (presetTitle === '?') {
      const randomPreset = getRandomArrayItem(presetLibrary.presets);
      if (randomPreset) {
        mergePresets.push(randomPreset);
      }
    } else if (presetTitle === '*') {
      mergePresets = presetLibrary.presets.filter((el) => {
        return el?.presetName;
      });
      break;
    } else if (presetTitle.startsWith('*')) {
      mergePresets.push(
        ...presetLibrary.presets.filter((el) => {
          const searchString = presetTitle.split('*').join('').toLowerCase();
          return el?.filePath?.toLowerCase().includes(searchString);
        }),
      );
    } else if (presetTitle.startsWith('?')) {
      const randomPreset = getRandomArrayItem(
        presetLibrary.presets.filter((el) => {
          const searchString = presetTitle.split('?').join('').toLowerCase();
          return el?.filePath?.toLowerCase().includes(searchString);
        }),
      );
      if (randomPreset) {
        mergePresets.push(randomPreset);
      }
    } else {
      const mergePreset = presetLibrary.presets.find((el) => {
        return el.filePath.includes(presetTitle);
      });
      if (!mergePreset) {
        throw new Error(`No preset with name "${presetTitle}" found!`);
      }
      mergePresets.push(mergePreset);
    }
  }

  if (mergePresets.length < 2) {
    throw new Error(
      'Merge presets only works when at least two presets have been chosen',
    );
  }

  // Validate preset compatibility
  validateMergeCompatibility(mergePresets);

  for (let i = 0; i < (config.amount ?? 8); i++) {
    const basePreset = getRandomArrayItem<Preset>(mergePresets);
    if (!basePreset) {
      console.error(
        chalk.red('Error: Could not get random preset from merge list'),
      );
      continue;
    }
    let newPreset: Preset = structuredClone(basePreset);

    // Create random ratios, that still add up to 1 total
    const mergeRatios = calculateRandomMergeRatios(mergePresets.length);

    for (const param of newPreset.params) {
      const paramModelEntry = paramModel[param.id];
      if (!paramModelEntry) {
        console.error(
          chalk.red(
            `Error: Unknown parameter ${param.id} in preset ${newPreset.filePath}, missing in analyzed parameter model`,
          ),
        );
        continue;
      }

      if (config.stable) {
        if (
          paramModelEntry.type === 'string' ||
          paramModelEntry.distinctValues.length <= 2
        ) {
          // Do not randomize string type values or values that only have 1 or 2 distinct values
          continue;
        }
        if (paramModelEntry.keepStable) {
          // Do not randomize if parameter is marked as to be kept stable
          continue;
        }
      }
      if (paramModelEntry.keepStable === 'always') {
        continue;
      }

      const oldParamValue = param.value as string | number;
      let newParamValue = oldParamValue;
      if (param.type === 'string') {
        // Randomly pick a string enum value from one of the merge patches
        const pick = getRandomArrayItem<Preset>(mergePresets);
        const findParam = pick?.params.find((el) => el.id === param.id);
        if (findParam?.value) {
          newParamValue = findParam.value;
        }
      } else {
        newParamValue = 0;

        for (const [i, preset] of mergePresets.entries()) {
          const findParam = preset.params.find((el) => el.id === param.id);
          const ratio = mergeRatios[i] ?? 0;
          if (findParam?.value) {
            newParamValue += (findParam.value as number) * ratio;
          } else {
            newParamValue += (oldParamValue as number) * ratio;
          }
        }

        if (param.type === 'integer') {
          newParamValue = Math.round(newParamValue);
        } else if (param.type === 'float') {
          newParamValue = Math.trunc(newParamValue * 100) / 100;
        }
      }

      if (typeof newParamValue === 'object') {
        console.error(
          chalk.red('Error: New param value is object, but should not be.'),
          newPreset.filePath,
          newParamValue,
        );
      }

      param.value = newParamValue;
    }

    if (config.randomness) {
      newPreset = randomizePreset(newPreset, paramModel, config);
    }

    let randomName = uniqueNamesGenerator({
      dictionaries: [adjectives, colors, names],
      separator: ' ',
      style: 'capital',
    });
    if (config.dictionary) {
      const names = getDictionaryOfNames(presetLibrary);
      randomName = `${getRandomArrayItem(names)} ${getRandomArrayItem(names)} ${getRandomArrayItem(names)}`;
    }

    newPreset.filePath = `/Merged Preset/RND ${randomName}.h2p`;
    newPreset.presetName = `RND ${randomName}`;
    newPreset.meta = [
      {
        key: 'Author',
        value: 'Random Generator',
      },
      {
        key: 'Description',
        value: `Merged preset, based on ${mergePresets
          .map((el) => el.presetName)
          .join(', ')}. ${getPresetDescriptionSuffix(config)}`,
      },
    ];
    if (config.category) {
      newPreset.meta.push({
        key: 'Categories',
        value: [config.category as string],
      });
    }
    newPresetLibrary.presets.push(newPreset);
  }
  return newPresetLibrary;
}

//////////////////////////////////////////
// HELPER FUNCTIONS                     //
//////////////////////////////////////////

export function getRandomArrayItem<T>(list: T[]): T | undefined {
  if (list.length === 0) return undefined;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Validates that presets are compatible for merging by checking parameter structure
 * @param presets Array of presets to validate for merge compatibility
 * @throws Error if presets are incompatible
 */
export function validateMergeCompatibility(presets: Preset[]): void {
  if (presets.length < 2) return;

  const basePreset = presets[0];
  if (!basePreset) return;

  // Build a set of parameter IDs from the base preset
  const baseParamIds = new Set(basePreset.params.map((p) => p.id));
  const baseParamCount = basePreset.params.length;

  // Check each preset for compatibility
  for (let i = 1; i < presets.length; i++) {
    const preset = presets[i];
    if (!preset) continue;

    const presetParamIds = new Set(preset.params.map((p) => p.id));
    const presetParamCount = preset.params.length;

    // Calculate overlap
    const intersection = new Set(
      [...baseParamIds].filter((id) => presetParamIds.has(id)),
    );
    const overlapPercent = (intersection.size / baseParamCount) * 100;

    // Warn if low overlap (< 80%)
    if (overlapPercent < 80) {
      console.warn(
        chalk.yellow(
          `Warning: Presets may be incompatible for merging.\n` +
            `  Base: "${basePreset.presetName}" (${baseParamCount} params)\n` +
            `  Comparing: "${preset.presetName}" (${presetParamCount} params)\n` +
            `  Overlap: ${intersection.size} parameters (${overlapPercent.toFixed(1)}%)\n` +
            `  This may produce unexpected results. Consider using presets from the same synth/version.`,
        ),
      );
    }

    // Error if very low overlap (< 50%)
    if (overlapPercent < 50) {
      console.error(
        chalk.red(
          `Error: Presets are incompatible for merging (< 50% parameter overlap).\n` +
            `  "${basePreset.presetName}" vs "${preset.presetName}"\n` +
            `  These presets appear to be from different synths or versions.`,
        ),
      );
      process.exit(1);
    }
  }
}

/**
 * Get a random value from the parameter model, with optional frequency weighting
 * @param paramModelEntry The parameter model entry containing values and frequencies
 * @param useFrequencyWeighting If true, values that appear more often in presets are more likely to be selected
 * @returns A random value, or undefined if no values available
 */
export function getRandomValue(
  paramModelEntry: ParamsModel[string],
  useFrequencyWeighting: boolean,
): string | number | undefined {
  if (!paramModelEntry || paramModelEntry.values.length === 0) {
    return undefined;
  }

  // Creative mode: uniform distribution (all distinct values equally likely)
  if (!useFrequencyWeighting) {
    return getRandomArrayItem(paramModelEntry.values);
  }

  // Non-creative mode: frequency-weighted distribution
  // Values that appear more often in the library are more likely to be selected
  if (!paramModelEntry.frequencies) {
    // Fallback to uniform if frequencies not available
    return getRandomArrayItem(paramModelEntry.values);
  }

  // Build cumulative frequency array for weighted selection
  const values = paramModelEntry.values;
  const frequencies = paramModelEntry.frequencies;
  let totalFrequency = 0;
  const cumulativeFrequencies: number[] = [];

  for (const value of values) {
    const freq = frequencies[String(value)] ?? 1;
    totalFrequency += freq;
    cumulativeFrequencies.push(totalFrequency);
  }

  // Select based on weighted random
  const random = Math.random() * totalFrequency;
  for (let i = 0; i < cumulativeFrequencies.length; i++) {
    if (random < cumulativeFrequencies[i]!) {
      return values[i];
    }
  }

  // Fallback (shouldn't happen)
  return values[values.length - 1];
}

export function calculateRandomMergeRatios(amount: number) {
  const randomNumbers: number[] = [];
  let randomTotal = 0;
  for (let i = 0; i < amount; i++) {
    const rnd = Math.random();
    randomNumbers.push(rnd);
    randomTotal += rnd;
  }
  const mergeRatios = randomNumbers.map((el) => {
    return el / randomTotal;
  });

  return mergeRatios;
}

export function randomizePreset(
  basePreset: Preset,
  paramModel: ParamsModel,
  config: Config,
): Preset {
  const randomness = config.randomness ?? 20;
  const randomRatio = Math.min(Math.max(0, randomness / 100), 100);
  const stableRatio = 1 - randomRatio;

  const randomPreset: Preset = structuredClone(basePreset);

  for (const param of randomPreset.params) {
    const paramModelEntry = paramModel[param.id];
    if (!paramModelEntry) {
      console.error(
        chalk.red(
          `Error: Unknown parameter ${param.id} in preset ${randomPreset.filePath}, missing in analyzed parameter model`,
        ),
      );
      continue;
    }

    if (config.stable) {
      if (
        paramModelEntry.type === 'string' ||
        paramModelEntry.distinctValues.length <= 2
      ) {
        // Do not randomize string type values or values that only have 1 or 2 distinct values
        continue;
      }
      if (paramModelEntry.keepStable) {
        // Do not randomize if parameter is marked as to be kept stable
        continue;
      }
    }
    if (paramModelEntry.keepStable === 'always') {
      continue;
    }

    const randomParamValue = getRandomValue(paramModelEntry, !config.creative);
    if (randomParamValue === undefined) {
      continue;
    }
    const oldParamValue = param.value;

    if (randomParamValue !== oldParamValue) {
      let newValue: string | number = randomParamValue;
      if (param.type !== 'string') {
        newValue =
          (oldParamValue as number) * stableRatio +
          (randomParamValue as number) * randomRatio;

        if (param.type === 'integer') {
          newValue = Math.round(newValue);
        } else if (param.type === 'float') {
          newValue = Math.trunc(newValue * 100) / 100;
        }
      } else {
        // Randomly decide between the two values by randomness ratio
        if (Math.random() > randomRatio) {
          newValue = oldParamValue; // Revert to old value if random threshold is not met
        }
      }
      param.value = newValue;
    }
  }
  return randomPreset;
}

export function getPresetDescriptionSuffix(config: Config): string {
  const niceDate = new Date().toISOString().split('T')[0];
  let suffix = `Generated by https://github.com/Fannon/u-he-preset-randomizer on ${niceDate} .`;
  if (config.category) {
    suffix += ` Based on presets of category: ${config.category}.`;
  }
  return suffix;
}
