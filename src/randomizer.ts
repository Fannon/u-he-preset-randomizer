import { ParamsModel } from "./analyzer.js";
import { Preset } from "./parser.js";
import { PresetLibrary } from "./presetLibrary.js";
import { log } from "./utils/log.js";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  names,
} from "unique-names-generator";
import { Config } from "./config.js";

/**
 * Fully randomized presets, with real values from library
 */
export function generateFullyRandomPresets(
  presetLibrary: PresetLibrary,
  paramModel: ParamsModel,
  config: Config
): PresetLibrary {
  console.log('----------------------------------------------------------------------')
  console.log(`Fully random presets with modes: stable=${config.stable}, binary=${config.binary}, category=${config.category}`)

  const newPresetLibrary: PresetLibrary = {
    synth: presetLibrary.synth,
    userPresetsFolder: presetLibrary.userPresetsFolder + "/RANDOM",
    presets: [],
  };
  for (let i = 0; i < (config.amount || 16); i++) {
    const randomPreset: Preset = JSON.parse(
      JSON.stringify(getRandomArrayItem(presetLibrary.presets))
    );

    if (config.stable) {
      const presetPerSectionMap: {[section: string]: Preset} = {}
      
      for (const param of randomPreset.params) {

        if (paramModel[param.id].type === 'string' || paramModel[param.id].distinctValues.length <= 2) {
          // Do not randomize string type values or values that only have 1 or 2 distinct values
          continue;
        }

        if (!presetPerSectionMap[param.section]) {
          presetPerSectionMap[param.section] = getRandomArrayItem(presetLibrary.presets)
        }

        let randomNewParam = presetPerSectionMap[param.section].params.find((el) => {
          return el.id === param.id
        });

        if (randomNewParam) {
          param.value = randomNewParam.value
        } else {
          param.value = getRandomArrayItem(paramModel[param.id]!.values);
        }
      }
    } else {
      for (const param of randomPreset.params) {
        param.value = getRandomArrayItem(paramModel[param.id]!.values);
      }
    }

    const randomName = uniqueNamesGenerator({
      dictionaries: [adjectives, colors, names],
      separator: " ",
      style: "capital",
    });

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
    ]),
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
  console.log(`Randomizing preset with modes: stable=${config.stable}, binary=${config.binary}, category=${config.category}`)

  const newPresetLibrary: PresetLibrary = {
    synth: presetLibrary.synth,
    userPresetsFolder: presetLibrary.userPresetsFolder + "/RANDOM",
    presets: [],
  };

  let basePreset: Preset;

  // If no preset given or "?" is passed, choose a random preset
  if (config.preset === "?" || !config.preset) {
    basePreset = getRandomArrayItem(presetLibrary.presets);
  } else {
    basePreset = presetLibrary.presets.find((el) => {
      return el.filePath.includes(config.preset);
    });
    if (!basePreset) {
      log.error(`No preset with name ${config.preset} found!`);
      process.exit(1);
    }
  }

  for (let i = 0; i < (config.amount || 8); i++) {
    const randomPreset = randomizePreset(basePreset, paramModel, config)
    const randomName = uniqueNamesGenerator({
      dictionaries: [adjectives, colors],
      separator: " ",
      style: "capital",
    });

    randomPreset.filePath = `/Randomized Preset/${randomPreset.presetName}/RND ${randomName} ${randomPreset.presetName}.h2p`;
    randomPreset.presetName = `RND ${randomName} ${randomPreset.presetName}`;

    let descriptionMeta = randomPreset.meta.find(el => el.key === 'Description')
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
  console.log(`Merging presets with modes: stable=${config.stable}, binary=${config.binary}, category=${config.category}`)

  const newPresetLibrary: PresetLibrary = {
    synth: presetLibrary.synth,
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
    } else {
      mergePreset = presetLibrary.presets.find((el) => {
        return el.filePath.includes(presetTitle);
      });
      if (!mergePreset) {
        log.error(`No preset with name ${presetTitle} found!`);
        process.exit(1);
      }
      mergePresets.push(mergePreset);
    }
  }

  if (mergePresets.length < 2) {
    log.error(
      "Merge presets only works when at least two presets have been chosen"
    );
    process.exit(1);
  }

  console.log(
    `Merging presets:\n * ${mergePresets.map((el) => el.presetName).join("\n * ")}\n`
  );

  for (let i = 0; i < (config.amount || 8); i++) {
    let newPreset: Preset = JSON.parse(
      JSON.stringify(getRandomArrayItem<Preset>(mergePresets))
    );

    // Create random ratios, that still add up to 1 total
    const mergeRatios = calculateRandomMergeRatios(mergePresets.length);

    for (const param of newPreset.params) {
      const oldParamValue = JSON.parse(JSON.stringify(param.value));
      let newParamValue = oldParamValue;

      if (param.type === "string") {
        // Randomly pick a string enum value from one of the merge patches
        const pick = getRandomArrayItem<Preset>(mergePresets);
        newParamValue = pick.params.find((el) => el.id === param.id);
      } else {
        let newParamValue = 0;

        for (const [i, preset] of mergePresets.entries()) {
          const findParam = preset.params.find((el) => el.id === param.id);
          if (findParam) {
            newParamValue += (findParam.value as number) * mergeRatios[i];
          } else {
            newParamValue += oldParamValue * mergeRatios[i];
          }
        }

        if (param.type === "integer") {
          newParamValue = Math.round(newParamValue);
        } else if (param.type === "float") {
          newParamValue = Math.trunc(newParamValue * 100) / 100;
        }
      }
      param.value = newParamValue;
    }

    if (config.randomness) {
      newPreset = randomizePreset(newPreset, paramModel, config)
    }

    const randomName = uniqueNamesGenerator({
      dictionaries: [adjectives, colors, names],
      separator: " ",
      style: "capital",
    });

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
    ],
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

  const randomPreset: Preset = JSON.parse(JSON.stringify(basePreset));

  for (const param of randomPreset.params) {

    if (config.stable) {
      if (paramModel[param.id].type === 'string' || paramModel[param.id].distinctValues.length <= 2) {
        // Do not randomize string type values or values that only have 1 or 2 distinct values
        continue;
      }
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
  const niceDate = new Date().toISOString().split('.')[0].replace('T', ' ')
  let suffix = `Generated on ${niceDate} by https://github.com/Fannon/u-he-preset-randomizer.`
  if (config.category) {
    suffix += ` Based on presets of category: ${config.category}.`;
  }
  if (config.stable) {
    suffix += ` Randomization mode=stable.`;
  }
  if (config.binary) {
    suffix += ` Randomization mode=binary.`;
  }
  return suffix;
}
