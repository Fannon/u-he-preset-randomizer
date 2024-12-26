import { ParamsModel, getDictionaryOfNames } from "./analyzer.js";
import { Preset } from "./parser.js";
import { PresetLibrary } from "./presetLibrary.js";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  names,
} from "unique-names-generator";
import { Config } from "./config.js";
import chalk from "chalk";

/**
 * Fully randomized presets, with real values from library
 */
export function generateFullyRandomPresets(
  presetLibrary: PresetLibrary,
  paramModel: ParamsModel,
  config: Config
): PresetLibrary {
  console.log('----------------------------------------------------------------------')
  console.log(`Fully random presets with modes: stable=${config.stable || false}, binary=${config.binary || false}`)

  if (presetLibrary.presets.length === 0) {
    console.error(chalk.red('Error: No presets available for randomization.'))
    process.exit(1)
  }

  const newPresetLibrary: PresetLibrary = {
    ...presetLibrary,
    userPresetsFolder: presetLibrary.userPresetsFolder + "/RANDOM",
    presets: [],
  };
  for (let i = 0; i < (config.amount || 16); i++) {
    const randomPreset: Preset = JSON.parse(
      JSON.stringify(getRandomArrayItem(presetLibrary.presets))
    ) as Preset;

    if (config.stable) {
      const presetPerSectionMap: {[section: string]: Preset} = {}
      
      for (const param of randomPreset.params) {

        if (!paramModel[param.id]) {
          console.error(chalk.red(`Error: Unknown parameter ${param.id} in preset ${randomPreset.filePath}, missing in analyzed parameter model`))
        }

        if (!presetPerSectionMap[param.section]) {
          presetPerSectionMap[param.section] = getRandomArrayItem(presetLibrary.presets)
        }

        if (paramModel[param.id].type === 'string' || paramModel[param.id].distinctValues.length <= 2) {
          // Do not randomize string type values or values that only have 1 or 2 distinct values
          continue;
        }

        if (paramModel[param.id].keepStable) {
          // Do not randomize if parameter is marked as to be kept stable
          continue;
        }

        const randomNewParam = presetPerSectionMap[param.section].params.find(el => el.id === param.id);

        if (randomNewParam) {
          param.value = randomNewParam.value
        } else {
          // If the preset doesn't have the particular param, fall back to a fully random value
          param.value = getRandomArrayItem(paramModel[param.id]!.values);
        }
      }
    } else {
      for (const param of randomPreset.params) {
        if (!paramModel[param.id]) {
          console.error(chalk.red(`Error: Unknown parameter ${param.id} in preset ${randomPreset.filePath}, missing in analyzed parameter model`))
        }
        if (paramModel[param.id].keepStable === 'always') {
          continue;
        }
        param.value = getRandomArrayItem(paramModel[param.id]!.values);
      }
    }

    let randomName = uniqueNamesGenerator({
      dictionaries: [adjectives, colors, names],
      separator: " ",
      style: "capital",
    });

    if (config.dictionary) {
      const names = getDictionaryOfNames(presetLibrary)
      randomName = `${getRandomArrayItem(names)} ${getRandomArrayItem(names)} ${getRandomArrayItem(names)}`
    }

    randomPreset.filePath = `/Fully Random/RND ${randomName}.h2p`;
    if (config.category && config.category !== true) {
      randomPreset.filePath = `/Fully Random/${config.category.split(':').join(' ')}/RND ${randomName}.h2p`;
    }
    randomPreset.presetName = `RND ${randomName}`;
    (randomPreset.meta = [
      {
        key: "Author",
        value: "Random Generator",
      },
      {
        key: "Description",
        value:
          `Fully random preset. ${getPresetDescriptionSuffix(config)}`,
      },
    ])
    if (config.category) {
      randomPreset.meta.push({
        key: "Categories",
        value: [config.category as string]
      })
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
  config: Config
): PresetLibrary {
  console.log('----------------------------------------------------------------------')
  console.log(`Randomizing preset with modes: stable=${config.stable || false}, binary=${config.binary || false}`)

  const newPresetLibrary: PresetLibrary = {
    ...presetLibrary,
    userPresetsFolder: presetLibrary.userPresetsFolder + "/RANDOM",
    presets: [],
  };

  let basePreset: Preset;

  // If no preset given or "?" is passed, choose a random preset
  if (config.preset === "?" || !config.preset) {
    basePreset = getRandomArrayItem(presetLibrary.presets);
  } else if (config.preset.startsWith("?")) {
    basePreset = getRandomArrayItem(presetLibrary.presets.filter((el) => {
      const searchString = config.preset.split('?').join('').toLowerCase();
      return el && el.filePath && el.filePath.toLowerCase().includes(searchString);
    }));
  } else {
    basePreset = presetLibrary.presets.find((el) => {
      return el.filePath.includes(config.preset);
    });
    if (!basePreset) {
      console.error(chalk.red(`Error: No preset with name ${config.preset} found!`))
      process.exit(1);
    }
  }

  console.log('Randomizing base preset: ' + basePreset.filePath);

  for (let i = 0; i < (config.amount || 8); i++) {
    const randomPreset = randomizePreset(basePreset, paramModel, config)
    let randomName = uniqueNamesGenerator({
      dictionaries: [adjectives, colors],
      separator: " ",
      style: "capital",
    });
    if (config.dictionary) {
      const names = getDictionaryOfNames(presetLibrary)
      randomName = `${getRandomArrayItem(names)} ${getRandomArrayItem(names)}`
    }

    randomPreset.filePath = `/Randomized Preset/${randomPreset.presetName}/RND ${randomName} ${randomPreset.presetName}.h2p`;
    randomPreset.presetName = `RND ${randomName} ${randomPreset.presetName}`;

    const descriptionMeta = randomPreset.meta.find(el => el.key === 'Description')
    if (descriptionMeta) {
      descriptionMeta.value += `. Randomized existing preset: ${randomPreset.presetName}. ${getPresetDescriptionSuffix(config)}`
    }

    newPresetLibrary.presets.push(randomPreset);
  }
  return newPresetLibrary;
}

/**
 * Merge multiple presets together, with randomization amount
 */
export function generateMergedPresets(
  presetLibrary: PresetLibrary,
  paramModel: ParamsModel,
  config: Config,
): PresetLibrary {
  console.log('----------------------------------------------------------------------')
  console.log(`Merging presets with modes: stable=${config.stable || false}, binary=${config.binary || false}`)

  const newPresetLibrary: PresetLibrary = {
    ...presetLibrary,
    userPresetsFolder: presetLibrary.userPresetsFolder + "/RANDOM",
    presets: [],
  };

  let mergePresets: Preset[] = [];

  if (!Array.isArray(config.merge)) {
    config.merge = [config.merge];
  }

  for (const presetTitle of config.merge) {
    let mergePreset: Preset;

    // If no preset given or "?" is passed, choose a random preset
    if (presetTitle === "?") {
      mergePresets.push(getRandomArrayItem(presetLibrary.presets));
    } else if (presetTitle === "*") {
      mergePresets = presetLibrary.presets.filter((el) => {
        return el && el.presetName;
      });
      break;
    } else if (presetTitle.startsWith("*")) {
      mergePresets.push(...presetLibrary.presets.filter((el) => {
        const searchString = presetTitle.split('*').join('').toLowerCase();
        return el && el.filePath && el.filePath.toLowerCase().includes(searchString);
      }));
    } else if (presetTitle.startsWith("?")) {
      mergePresets.push(getRandomArrayItem(presetLibrary.presets.filter((el) => {
        const searchString = presetTitle.split('?').join('').toLowerCase();
        return el && el.filePath && el.filePath.toLowerCase().includes(searchString);
      })));
    } else {
      mergePreset = presetLibrary.presets.find((el) => {
        return el.filePath.includes(presetTitle);
      });
      if (!mergePreset) {
        console.error(chalk.red(`Error: No preset with name "${presetTitle}" found!`));
        process.exit(1);
      }
      mergePresets.push(mergePreset);
    }
  }

  console.log(
    `Merging ${mergePresets.length} presets:\n * ${mergePresets.map((el) => el.presetName).join("\n * ")}\n`
  );

  if (mergePresets.length < 2) {
    console.error(chalk.red("Error: Merge presets only works when at least two presets have been chosen"));
    process.exit(1);
  }

  for (let i = 0; i < (config.amount || 8); i++) {
    let newPreset: Preset = JSON.parse(
      JSON.stringify(getRandomArrayItem<Preset>(mergePresets))
    ) as Preset;

    // Create random ratios, that still add up to 1 total
    const mergeRatios = calculateRandomMergeRatios(mergePresets.length);

    for (const param of newPreset.params) {

      if (!paramModel[param.id]) {
        console.error(chalk.red(`Error: Unknown parameter ${param.id} in preset ${newPreset.filePath}, missing in analyzed parameter model`))
      }
      
      if (config.stable) {
        if (paramModel[param.id].type === 'string' || paramModel[param.id].distinctValues.length <= 2) {
          // Do not randomize string type values or values that only have 1 or 2 distinct values
          continue;
        }
        if (paramModel[param.id].keepStable) {
          // Do not randomize if parameter is marked as to be kept stable
          continue;
        }
      }
      if (paramModel[param.id].keepStable === 'always') {
        continue;
      }
      
      const oldParamValue = JSON.parse(JSON.stringify(param.value)) as string | number;
      let newParamValue = oldParamValue;
      if (param.type === "string") {
        // Randomly pick a string enum value from one of the merge patches
        const pick = getRandomArrayItem<Preset>(mergePresets);
        const findParam = pick.params.find((el) => el.id === param.id);
        if (findParam && findParam.value) {
          newParamValue = findParam.value;
        }
      } else {
        let newParamValue = 0;

        for (const [i, preset] of mergePresets.entries()) {
          const findParam = preset.params.find((el) => el.id === param.id);
          if (findParam && findParam.value) {
            newParamValue += (findParam.value as number) * mergeRatios[i];
          } else {
            newParamValue += oldParamValue as number * mergeRatios[i];
          }
        }

        if (param.type === "integer") {
          newParamValue = Math.round(newParamValue);
        } else if (param.type === "float") {
          newParamValue = Math.trunc(newParamValue * 100) / 100;
        }
      }

      if (typeof newParamValue === 'object') {
        console.error(chalk.red('Error: New param value is object, but should not be.'), newPreset.filePath, newParamValue)
      }

      param.value = newParamValue;
    }

    if (config.randomness) {
      newPreset = randomizePreset(newPreset, paramModel, config)
    }

    let randomName = uniqueNamesGenerator({
      dictionaries: [adjectives, colors, names],
      separator: " ",
      style: "capital",
    });
    if (config.dictionary) {
      const names = getDictionaryOfNames(presetLibrary)
      randomName = `${getRandomArrayItem(names)} ${getRandomArrayItem(names)} ${getRandomArrayItem(names)}`
    }

    newPreset.filePath = `/Merged Preset/RND ${randomName}.h2p`;
    newPreset.presetName = `RND ${randomName}`;
    newPreset.meta = [
      {
        key: "Author",
        value: "Random Generator",
      },
      {
        key: "Description",
        value: `Merged preset, based on ${mergePresets
          .map((el) => el.presetName)
          .join(
            ", "
          )}. ${getPresetDescriptionSuffix(config)}`,
      },
    ]
    if (config.category) {
      newPreset.meta.push({
        key: "Categories",
        value: [config.category as string]
      })
    }
    newPresetLibrary.presets.push(newPreset);
  }
  return newPresetLibrary;
}

//////////////////////////////////////////
// HELPER FUNCTIONS                     //
//////////////////////////////////////////

export function getRandomArrayItem<T>(list: T[]) {
  return list[Math.floor(Math.random() * list.length)];
}

function calculateRandomMergeRatios(amount: number) {
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
  config: Config
): Preset {
  const randomness = config.randomness || 20;
  const randomRatio = Math.min(Math.max(0, randomness / 100), 100);
  const stableRatio = 1 - randomRatio;

  const randomPreset: Preset = JSON.parse(JSON.stringify(basePreset)) as Preset;

  for (const param of randomPreset.params) {

    if (!paramModel[param.id]) {
      console.error(chalk.red(`Error: Unknown parameter ${param.id} in preset ${randomPreset.filePath}, missing in analyzed parameter model`))
    }

    if (config.stable) {
      if (paramModel[param.id].type === 'string' || paramModel[param.id].distinctValues.length <= 2) {
        // Do not randomize string type values or values that only have 1 or 2 distinct values
        continue;
      }
      if (paramModel[param.id]?.keepStable) {
        // Do not randomize if parameter is marked as to be kept stable
        continue;
      }
    }
    if (paramModel[param.id]?.keepStable === 'always') {
      continue;
    }

    let randomParamValue = getRandomArrayItem(paramModel[param.id]!.values);
    const oldParamValue = param.value;

    if (randomParamValue !== oldParamValue) {
      if (param.type !== "string") {
        randomParamValue = (oldParamValue as number) * stableRatio + (randomParamValue as number) * randomRatio;

        if (param.type === "integer") {
          randomParamValue = Math.round(randomParamValue as number);
        } else if (param.type === "float") {
          randomParamValue = Math.trunc(randomParamValue as number * 100) / 100;
        }
      } else {
        // Randomly decide between the two values by randomness ratio
        if (Math.random() > randomRatio) {
          randomParamValue = oldParamValue; // Revert to old value if random threshold is not met
        }
      }
      param.value = randomParamValue;
    }
  }
  return randomPreset;
}

function getPresetDescriptionSuffix(config: Config): string {
  const niceDate = new Date().toISOString().split('T')[0]
  let suffix = `Generated by https://github.com/Fannon/u-he-preset-randomizer on ${niceDate} .`
  if (config.category) {
    suffix += ` Based on presets of category: ${config.category}.`;
  }
  return suffix;
}
