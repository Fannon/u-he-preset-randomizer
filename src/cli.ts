#!/usr/bin/env node
import { ParamsModel, analyzeParamsTypeAndRange, convertParamsModelBySection } from './analyzer.js';
import { PresetLibrary, loadPresetLibrary, writePresetLibrary } from './presetLibrary.js';
import fs from 'fs-extra';
import fg from 'fast-glob';
import { Config, getConfigFromParameters } from './config.js';
import {
  generateFullyRandomPresets,
  generateMergedPresets,
  generateRandomizedPresets,
} from './randomizer.js';
import {
  DetectedPresetLibrary,
  SynthNames,
  detectPresetLibraryLocations,
} from './utils/detector.js';
import inquirer from 'inquirer';
import searchPrompt from '@inquirer/search';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { dirname } from 'path';
import { Preset } from './parser.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = fs.readJSONSync(__dirname + '/../package.json') as { version: string };

interface ChoiceOptions {
  name: string;
  value: string;
}

console.log('======================================================================');
console.log('u-he Preset Randomizer CLI v' + packageJson.version);
console.log('======================================================================');
console.log('Documentation: https://github.com/Fannon/u-he-preset-randomizer#readme');
console.log('');

let config = getConfigFromParameters();

(async () => {
  if (!config.synth) {
    // If no --synth argument is given, we'll go into fully interactive CLI mode
    await runInteractiveMode();
  } else {
    runWithoutInteractivity();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

export function runWithoutInteractivity(overrideConfig?: Config) {
  if (overrideConfig) {
    config = {
      ...overrideConfig,
      ...config,
    };
  }

  if (!config.synth) {
    throw new Error('Synth not specified in config');
  }

  const presetLibrary = loadPresetLibrary(config.synth, config);

  // Narrow down by folder
  if (config.folder && config.folder !== true) {
    config.pattern = `${config.folder}${config.pattern ?? '**/*'}`;
  }

  // Filter out presets by favorite file (if given)
  if (config.favorites && config.favorites !== true) {
    presetLibrary.presets = narrowDownByFavoritesFile(presetLibrary, config.favorites);
  }
  // Filter out presets by author (if given)
  if (config.author && config.author !== true) {
    presetLibrary.presets = narrowDownByAuthor(presetLibrary, config.author);
  }
  // Filter out presets by category (if given)
  if (config.category && config.category !== true) {
    presetLibrary.presets = narrowDownByCategory(presetLibrary, config.category);
  }

  const paramsModel = analyzeParamsTypeAndRange(presetLibrary);

  if (config.debug) {
    // Write a cleaned up parameter model to ./tmp/paramsModel.json
    const outputParamsModel = JSON.parse(JSON.stringify(paramsModel)) as ParamsModel;
    // Remove values from debug paramsModel, as it would blow up the result too much.
    for (const paramKey in outputParamsModel) {
      const param = outputParamsModel[paramKey];
      if (param && 'values' in param) {
        param.values = [];
      }
    }
    fs.outputFileSync(
      './tmp/paramsModel.json',
      JSON.stringify(convertParamsModelBySection(outputParamsModel), null, 2)
    );

    console.debug(chalk.gray(JSON.stringify(config, null, 2)));
  }

  if (config.merge) {
    // Merge multiple presets together, with additional randomness
    const generatedPresets = generateMergedPresets(presetLibrary, paramsModel, config);
    writePresetLibrary(generatedPresets);
  } else if (config.preset) {
    // Randomize a particular preset
    const generatedPresets = generateRandomizedPresets(presetLibrary, paramsModel, config);
    writePresetLibrary(generatedPresets);
  } else {
    // Generate fully randomized presets
    const generatedPresets = generateFullyRandomPresets(presetLibrary, paramsModel, config);
    writePresetLibrary(generatedPresets);
  }

  console.log('======================================================================');
  console.log('Successfully completed.');
}

async function runInteractiveMode() {
  // Detect correct Preset Library Location
  const locations = detectPresetLibraryLocations(config);

  // 1) Detect available u-he synths and offer user choice
  const synthChoices = locations.map((el: DetectedPresetLibrary) => {
    return {
      value: el.synthName,
      name: el.synthName,
    };
  });
  if (!synthChoices.length) {
    console.error(chalk.red('Error: No u-he synths detected. Exiting.'));
    process.exit(1);
  }
  const synth = await searchPrompt<SynthNames>({
    message: 'Which u-he synth to generate presets for?',
    pageSize: synthChoices.length,
    source: (input) => {
      if (!input) {
        return Promise.resolve(synthChoices);
      }
      const normalized = input.toLowerCase();
      return Promise.resolve(
        synthChoices.filter((el) => {
          return el.value.toLowerCase().startsWith(normalized);
        })
      );
    },
  });
  config.synth = synth;

  // 2) Choose random generation mode
  const mode = await inquirer.prompt<{ value: string }>([
    {
      name: 'value',
      type: 'list',
      message: 'Which random mode?',
      default: 'Fully randomized presets',
      choices: [
        { value: 'Fully randomized presets' },
        { value: 'Randomize existing preset' },
        { value: 'Merge existing presets' },
      ],
    },
  ]);

  // 2.5) Choose optional modifiers for randomization
  if (!config.stable || !config.binary) {
    const binaryEnabled = ['Repro-1', 'Repro-5'].includes(config.synth);
    const modifiers = await inquirer.prompt<{ value: string }>([
      {
        name: 'value',
        type: 'checkbox',
        message: 'Set optional flags / modifiers (multi-choice):',
        choices: [
          { value: 'folder', name: '[Folder]     Narrow down presets by folder' },
          { value: 'category', name: '[Category]   Narrow down presets by category' },
          { value: 'author', name: '[Author]     Narrow down presets by author' },
          {
            value: 'favorites',
            name: '[Favorites]  Narrow down presets by favorites from .uhe-fav file',
          },
          {
            value: 'stable',
            name: '[Stable]     More stable randomization approach',
            checked: true,
          },
          {
            value: 'binary',
            name: '[Binary]     Include binary section (WARNING: unstable with some synths!)',
            checked: binaryEnabled,
          },
          {
            value: 'dictionary',
            name: '[Dictionary] Use real preset names to generate random preset names',
          },
        ],
      },
    ]);
    if (modifiers.value.includes('folder')) {
      config.folder = true;
    }
    if (modifiers.value.includes('category')) {
      config.category = true;
    }
    if (modifiers.value.includes('author')) {
      config.author = true;
    }
    if (modifiers.value.includes('favorites')) {
      config.favorites = true;
    }
    if (modifiers.value.includes('stable')) {
      config.stable = true;
    }
    if (modifiers.value.includes('binary')) {
      config.binary = true;
    }
    if (modifiers.value.includes('dictionary')) {
      config.dictionary = true;
    }
  }

  // Narrow down by folder selection
  if (config.folder === true) {
    // Detect correct Preset Library Location
    const location = detectPresetLibraryLocations(config).find(
      (el) => el.synthName.toLowerCase() === (config.synth ?? '').toLowerCase()
    );

    if (!location) {
      throw new Error(`Could not find preset library location for synth: ${config.synth ?? ''}`);
    }

    const userFolders = fg
      .sync('**/*', {
        cwd: location.userPresets,
        onlyDirectories: true,
      })
      .map((el) => {
        return `/User/${el}/`;
      });
    const presetFolders = fg
      .sync('**/*', {
        cwd: location.presets ?? '',
        onlyDirectories: true,
      })
      .map((el) => {
        return `/Local/${el}/`;
      });

    const folders = ['/', '/User/', '/Local/', ...userFolders, ...presetFolders].sort();

    const folderChoice = await searchPrompt<string>({
      message: 'Which folder to narrow down to?',
      pageSize: 12,
      source: (input) => {
        if (!input) {
          return Promise.resolve(folders);
        }
        const normalized = input.toLowerCase();
        return Promise.resolve(
          folders.filter((el) => {
            return el.toLowerCase().includes(normalized);
          })
        );
      },
    });
    if (folderChoice && folderChoice !== '/') {
      config.folder = folderChoice;
      config.pattern = `${config.folder}${config.pattern ?? '**/*'}`;
    }
  }

  if (!config.synth) {
    throw new Error('Synth not specified in config');
  }

  console.log(`> Loading and analyzing preset library...`);
  const presetLibrary = loadPresetLibrary(config.synth, config);

  // Optionally: Narrow down by u-he favorites
  if (config.favorites === true && presetLibrary.favorites.length) {
    const allChoices = presetLibrary.favorites.map((el) => {
      return {
        value: el.fileName,
        name: `${el.fileName} (${el.presets.length})`,
      };
    });

    const favoritesPrompt = await inquirer.prompt<{ value: string }>([
      {
        name: 'value',
        type: 'checkbox',
        message: 'Which favorite file(s) to use as a selection?',
        choices: allChoices,
      },
    ]);
    config.favorites = favoritesPrompt.value;
  }
  // Filter out presets by favorite file (if given)
  if (config.favorites && config.favorites !== true && config.favorites.length > 0) {
    presetLibrary.presets = narrowDownByFavoritesFile(presetLibrary, config.favorites);
  } else {
    console.log('> No selection made, skipping this step.');
  }

  // Optionally: Narrow down by author
  if (config.author === true) {
    const availableAuthors: Record<string, number> = {};

    for (const preset of presetLibrary.presets) {
      const authorMeta = preset.meta.find((el) => el.key === 'Author');
      if (authorMeta && typeof authorMeta.value === 'string') {
        const author = authorMeta.value;
        availableAuthors[author] = (availableAuthors[author] ?? 0) + 1;
      }
    }

    const allChoices: ChoiceOptions[] = [];
    for (const author in availableAuthors) {
      const count = availableAuthors[author];
      if (count !== undefined) {
        allChoices.push({
          value: author,
          name: `${author} (${count})`,
        });
      }
    }
    allChoices.sort((a, b) => a.value.localeCompare(b.value));

    if (allChoices.length) {
      const author = await searchPrompt<string>({
        message: 'Which author to narrow down to?',
        pageSize: 12,
        source: (input) => {
          if (!input) {
            return Promise.resolve(allChoices);
          }
          const normalized = input.toLowerCase();
          return Promise.resolve(
            allChoices.filter((el) => {
              return el.name.toLowerCase().includes(normalized);
            })
          );
        },
      });
      config.author = author;
    }
  }
  // Filter out presets by author (if given)
  if (config.author && config.author !== true) {
    presetLibrary.presets = narrowDownByAuthor(presetLibrary, config.author);
  }

  // Optionally: Narrow down by category
  if (config.category === true) {
    const availableCategories: Record<string, number> = {};

    for (const preset of presetLibrary.presets) {
      for (const category of preset.categories) {
        const parentCategory = category.split(':')[0];
        if (parentCategory) {
          availableCategories[parentCategory] ??= 0;
          availableCategories[parentCategory]++;
        }
        availableCategories[category] ??= 0;
        availableCategories[category]++;
      }
    }

    const allChoices: ChoiceOptions[] = [];
    for (const category in availableCategories) {
      const count = availableCategories[category];
      if (count !== undefined) {
        allChoices.push({
          value: category,
          name: `${category} (${count})`,
        });
      }
    }
    allChoices.sort((a, b) => a.value.localeCompare(b.value));

    if (allChoices.length) {
      const category = await searchPrompt<string>({
        message: 'Which category to narrow down to?',
        pageSize: 12,
        source: (input) => {
          if (!input) {
            return Promise.resolve(allChoices);
          }
          const normalized = input.toLowerCase();
          return Promise.resolve(
            allChoices.filter((el) => {
              return el.name.toLowerCase().includes(normalized);
            })
          );
        },
      });
      config.category = category;
    }
  }

  // Filter out presets by category (if given)
  if (config.category && config.category !== true) {
    presetLibrary.presets = narrowDownByCategory(presetLibrary, config.category);
  }

  const paramsModel = analyzeParamsTypeAndRange(presetLibrary);

  if (mode.value === 'Fully randomized presets') {
    //////////////////////////////////////////////////
    // MODE 1: Generate fully randomized presets    //
    //////////////////////////////////////////////////

    config.amount ??= await chooseAmountOfPresets(32);
    const generatedPresets = generateFullyRandomPresets(presetLibrary, paramsModel, config);
    writePresetLibrary(generatedPresets);
  } else if (mode.value === 'Randomize existing preset') {
    //////////////////////////////////////////////////
    // MODE 2: Randomize existing preset            //
    //////////////////////////////////////////////////

    const foundPresets = presetLibrary.presets.map((el) => el.filePath);
    config.preset = await choosePreset(foundPresets);
    if (!config.preset) {
      process.exit(0);
    }

    config.randomness ??= await chooseRandomness(20);
    config.amount ??= await chooseAmountOfPresets(16);

    const generatedPresets = generateRandomizedPresets(presetLibrary, paramsModel, config);
    writePresetLibrary(generatedPresets);
  } else if (mode.value === 'Merge existing presets') {
    //////////////////////////////////////////////////
    // MODE 3: Merge Random Presets                 //
    //////////////////////////////////////////////////

    config.merge = [];
    const foundPresets = presetLibrary.presets.map((el) => el.filePath);
    while (true) {
      const presetChoice = await choosePreset(foundPresets, true);
      if (presetChoice) {
        config.merge.push(presetChoice);
        if (presetChoice === '*') {
          break;
        }
      } else {
        break;
      }
    }

    // Choose amount of randomness
    config.randomness ??= await chooseRandomness(0);
    config.amount ??= await chooseAmountOfPresets(16);
    const generatedPresets = generateMergedPresets(presetLibrary, paramsModel, config);
    writePresetLibrary(generatedPresets);
  }

  console.log('======================================================================');
  console.log(chalk.green('Successfully completed.'));
  console.log('');
  console.log('To run it with the same configuration again, execute:');

  let cliCommand = `npx u-he-preset-randomizer@latest --synth ${config.synth ?? ''} --amount ${config.amount ?? 8}`;
  if (config.preset && typeof config.preset === 'string') {
    cliCommand += ` --preset "${config.preset}"`;
  } else if (config.merge) {
    const merges = Array.isArray(config.merge) ? config.merge : [config.merge];
    for (const merge of merges) {
      if (typeof merge === 'string') {
        cliCommand += ` --merge "${merge}"`;
      }
    }
  }
  if (config.randomness) {
    cliCommand += ` --randomness ${config.randomness}`;
  }
  if (config.pattern && config.pattern !== '**/*') {
    cliCommand += ` --pattern "${config.pattern}"`;
  }
  if (config.folder && typeof config.folder === 'string') {
    cliCommand += ` --folder "${config.folder}"`;
  }
  if (config.favorites) {
    const favs = Array.isArray(config.favorites)
      ? config.favorites.join(',')
      : String(config.favorites);
    if (favs !== 'true') {
      cliCommand += ` --favorites "${favs}"`;
    }
  }
  if (config.category && typeof config.category === 'string') {
    cliCommand += ` --category "${config.category}"`;
  }
  if (config.author && typeof config.author === 'string') {
    cliCommand += ` --author "${config.author}"`;
  }
  if (config.dictionary) {
    cliCommand += ` --dictionary`;
  }
  if (config.stable) {
    cliCommand += ` --stable`;
  }
  if (config.debug) {
    cliCommand += ` --debug`;
  }
  console.log(chalk.bgGray(chalk.black(cliCommand)));
}

//////////////////////////////////////////
// HELPER FUNCTIONS                     //
//////////////////////////////////////////

/** Choose number of presets to generate */
async function chooseAmountOfPresets(initial = 8): Promise<number> {
  const amount = await inquirer.prompt<{ value: number }>([
    {
      name: 'value',
      type: 'number',
      message: 'How many presets to generate?',
      default: initial,
    },
  ]);
  return amount.value;
}
/** Choose randomness amount */
async function chooseRandomness(initial = 20): Promise<number> {
  const amount = await inquirer.prompt<{ value: number }>({
    name: 'value',
    type: 'number',
    message: 'How much randomness to apply (0-100)',
    default: initial,
    validate: (input: number | undefined) => {
      if (typeof input !== 'number') return false;
      return input >= 0 && input <= 100;
    },
  });
  return amount.value;
}

async function choosePreset(foundPresets: string[], allowSelectAll = false): Promise<string> {
  const controlChoices = [
    { value: '', name: '  (no choice / complete)' },
    { value: '?', name: '? (random pick)' },
  ];
  if (allowSelectAll) {
    controlChoices.push({ value: '*', name: '* (select all)' });
  }

  const allChoices = controlChoices.concat(
    foundPresets.map((el) => {
      return {
        value: el,
        name: el,
      };
    })
  );

  const presetChoice = await searchPrompt<string>({
    message: 'Select preset(s):',
    pageSize: 12,
    source: (input) => {
      if (!input) {
        return Promise.resolve(allChoices);
      }
      const normalized = input.toLowerCase();
      const staticChoices: ChoiceOptions[] = [];
      if (allowSelectAll) {
        staticChoices.push({
          value: `*${input}*`,
          name: `*${input}* (all presets including search string)`,
        });
      }
      staticChoices.push({
        value: `?${input}?`,
        name: `?${input}? (random pick of presets including search string)`,
      });
      return Promise.resolve(
        staticChoices.concat(
          allChoices.filter((el) => {
            return el.name.toLowerCase().includes(normalized);
          })
        )
      );
    },
  });
  return presetChoice;
}

function narrowDownByCategory(presetLibrary: PresetLibrary, category: string) {
  const filteredPresets = presetLibrary.presets.filter((el) => {
    if (!el.categories.length) {
      return false;
    }
    for (const ownCategory of el.categories) {
      if (ownCategory.startsWith(category)) {
        return true;
      }
    }
    return false;
  });
  console.log(`Narrowed down by category "${category}" to ${filteredPresets.length} presets`);
  return filteredPresets;
}

function narrowDownByAuthor(presetLibrary: PresetLibrary, author: string) {
  const filteredPresets = presetLibrary.presets.filter((el) => {
    if (!el.categories.length) {
      return false;
    }
    const authorMeta = el.meta.find((el) => el.key === 'Author');
    return authorMeta?.value === author;
  });
  console.log(`Narrowed down by author "${author}" to ${filteredPresets.length} presets`);
  return filteredPresets;
}
function narrowDownByFavoritesFile(presetLibrary: PresetLibrary, favorites: string | string[]) {
  if (!Array.isArray(favorites)) {
    favorites = [favorites];
  }

  const favPresets: { path: string; name: string }[] = [];
  const filteredPresets: Preset[] = [];

  for (const favoriteFilePath of favorites) {
    const favoriteFile = presetLibrary.favorites.find((el) => el.fileName === favoriteFilePath);

    if (favoriteFile) {
      favPresets.push(...favoriteFile.presets);
    } else {
      console.error(chalk.red(`Error: Could not find favorites file: ${favoriteFilePath}`));
      return presetLibrary.presets;
    }
  }

  console.log(favPresets.length);

  // Now filter it out
  for (const preset of presetLibrary.presets) {
    for (const fav of favPresets) {
      if (
        preset.filePath.toLowerCase() ===
        fav.path.toLowerCase() + '/' + fav.name.toLowerCase() + '.h2p'
      ) {
        filteredPresets.push(preset);
        break;
      }
    }
  }

  const favoritesLabel = Array.isArray(favorites) ? favorites.join(', ') : favorites;
  console.log(
    `Narrowed down via favorite file "${favoritesLabel}" to ${filteredPresets.length} presets`
  );
  return filteredPresets;
}
