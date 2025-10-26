#!/usr/bin/env node
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import searchPrompt from '@inquirer/search';
import chalk from 'chalk';
import fg from 'fast-glob';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { type Config, getConfigFromParameters } from './config.js';
import { generatePresets } from './generatePresets.js';
import {
  narrowDownByAuthor,
  narrowDownByCategory,
  narrowDownByFavoritesFile,
} from './libraryFilters.js';
import { loadPresetLibrary } from './presetLibrary.js';
import {
  type DetectedPresetLibrary,
  detectPresetLibraryLocations,
  type SynthNames,
} from './utils/detector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = fs.readJSONSync(`${__dirname}/../package.json`) as {
  version: string;
};

interface ChoiceOptions {
  name: string;
  value: string;
}

const config = getConfigFromParameters();

function logCliBanner() {
  console.log(
    '======================================================================',
  );
  console.log(`u-he Preset Randomizer CLI v${packageJson.version}`);
  console.log(
    '======================================================================',
  );
  console.log('');
  console.log(
    chalk.bold(
      'Welcome! This tool helps you create new synth presets through:',
    ),
  );
  console.log('  1. Fully random generation (great for discovery)');
  console.log('  2. Variations of existing presets (similar but different)');
  console.log('  3. Merging multiple presets (combine your favorites)');
  console.log('');
  console.log(
    chalk.dim(
      'Documentation: https://github.com/Fannon/u-he-preset-randomizer#readme',
    ),
  );
  console.log('');
}

export async function startCli() {
  logCliBanner();
  if (!config.synth) {
    await runInteractiveMode();
    return;
  }
  generatePresets(config);
}

const executionArg = process.argv[1];
const wasInvokedDirectly =
  executionArg !== undefined &&
  import.meta.url === pathToFileURL(executionArg).href;

if (wasInvokedDirectly) {
  startCli().catch((err) => {
    console.error(err);
    process.exit(1);
  });
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
    console.log('');
    console.error(chalk.red('No u-he synths found on your system.'));
    console.log('');
    console.log('Please make sure:');
    console.log('  - You have at least one u-he synth installed');
    console.log('  - The synth is installed in the standard location');
    console.log('  - You have created or loaded some presets');
    console.log('');
    console.log(chalk.dim('If your u-he folder is in a custom location, use:'));
    console.log(
      chalk.dim('  npx u-he-preset-randomizer --custom-folder "path/to/u-he"'),
    );
    console.log('');
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
        }),
      );
    },
  });
  config.synth = synth;

  // 2) Choose random generation mode
  const mode = await inquirer.prompt<{ value: string }>([
    {
      name: 'value',
      type: 'list',
      message: 'What would you like to do?',
      default: 'Fully randomized presets',
      choices: [
        {
          value: 'Fully randomized presets',
          name: 'Create fully random presets (best for discovering new sounds)',
        },
        {
          value: 'Randomize existing preset',
          name: 'Create variations of a specific preset (keep the character, add variation)',
        },
        {
          value: 'Merge existing presets',
          name: 'Blend multiple presets together (combine your favorites)',
        },
      ],
    },
  ]);

  // 2.5) Choose optional modifiers for randomization
  if (!config.stable || !config.binary) {
    const binaryEnabled = ['Repro-1', 'Repro-5'].includes(config.synth);

    // First: Basic filtering options
    const basicOptions = await inquirer.prompt<{ value: string[] }>([
      {
        name: 'value',
        type: 'checkbox',
        message: 'Narrow down which presets to use as inspiration (optional):',
        choices: [
          {
            value: 'folder',
            name: 'Select a specific folder',
          },
          {
            value: 'category',
            name: 'Filter by category (e.g., Bass, Lead, Pad)',
          },
          {
            value: 'author',
            name: 'Filter by preset creator',
          },
          {
            value: 'favorites',
            name: 'Use only your favorited presets',
          },
        ],
      },
    ]);

    // Apply basic options
    if (basicOptions.value.includes('folder')) {
      config.folder = true;
    }
    if (basicOptions.value.includes('category')) {
      config.category = true;
    }
    if (basicOptions.value.includes('author')) {
      config.author = true;
    }
    if (basicOptions.value.includes('favorites')) {
      config.favorites = true;
    }

    // Then: Ask if they want advanced options
    const wantsAdvanced = await inquirer.prompt<{ value: boolean }>([
      {
        name: 'value',
        type: 'confirm',
        message: 'Show advanced options?',
        default: false,
      },
    ]);

    if (wantsAdvanced.value) {
      const advancedOptions = await inquirer.prompt<{ value: string[] }>([
        {
          name: 'value',
          type: 'checkbox',
          message: 'Advanced settings:',
          choices: [
            {
              value: 'stable',
              name: '[Stable] Use safer randomization (recommended for most synths)',
              checked: true,
            },
            {
              value: 'binary',
              name: '[Binary] Include advanced modulation data (may cause crashes)',
              checked: binaryEnabled,
            },
            {
              value: 'dictionary',
              name: '[Dictionary] Generate realistic preset names',
            },
          ],
        },
      ]);

      if (advancedOptions.value.includes('stable')) {
        config.stable = true;
      }
      if (advancedOptions.value.includes('binary')) {
        config.binary = true;
      }
      if (advancedOptions.value.includes('dictionary')) {
        config.dictionary = true;
      }
    } else {
      // Default: stable mode enabled
      config.stable = true;
    }
  }

  // Narrow down by folder selection
  if (config.folder === true) {
    // Detect correct Preset Library Location
    const location = detectPresetLibraryLocations(config).find(
      (el) => el.synthName.toLowerCase() === (config.synth ?? '').toLowerCase(),
    );

    if (!location) {
      throw new Error(
        `Could not find preset library location for synth: ${config.synth ?? ''}`,
      );
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

    const folders = [
      '/',
      '/User/',
      '/Local/',
      ...userFolders,
      ...presetFolders,
    ].sort();

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
          }),
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

  console.log('');
  console.log(chalk.cyan('Loading your preset library...'));
  const presetLibrary = loadPresetLibrary(config.synth, config);
  console.log(chalk.green(`Loaded ${presetLibrary.presets.length} presets`));
  console.log('');

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
  if (
    config.favorites &&
    config.favorites !== true &&
    config.favorites.length > 0
  ) {
    presetLibrary.presets = narrowDownByFavoritesFile(
      presetLibrary,
      config.favorites,
    );
  } else {
    console.log(chalk.dim('No selection made, skipping this step.'));
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
            }),
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
            }),
          );
        },
      });
      config.category = category;
    }
  }

  // Filter out presets by category (if given)
  if (config.category && config.category !== true) {
    presetLibrary.presets = narrowDownByCategory(
      presetLibrary,
      config.category,
    );
  }

  if (mode.value === 'Fully randomized presets') {
    //////////////////////////////////////////////////
    // MODE 1: Generate fully randomized presets    //
    //////////////////////////////////////////////////

    config.amount ??= await chooseAmountOfPresets(32);
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
  }

  // Show summary before generating
  console.log('');
  console.log(chalk.bold.cyan('Summary:'));
  console.log(chalk.dim('─────────────────────────────────────'));
  console.log(`  Synth:      ${config.synth}`);
  console.log(`  Mode:       ${mode.value}`);
  console.log(`  Amount:     ${config.amount} presets`);
  if (config.randomness) {
    console.log(`  Randomness: ${config.randomness}%`);
  }
  if (config.preset && typeof config.preset === 'string') {
    console.log(`  Base:       ${config.preset}`);
  }
  if (config.category && typeof config.category === 'string') {
    console.log(`  Category:   ${config.category}`);
  }
  if (config.author && typeof config.author === 'string') {
    console.log(`  Author:     ${config.author}`);
  }
  if (config.folder && typeof config.folder === 'string') {
    console.log(`  Folder:     ${config.folder}`);
  }
  console.log(chalk.dim('─────────────────────────────────────'));
  console.log('');

  const proceed = await inquirer.prompt<{ value: boolean }>([
    {
      name: 'value',
      type: 'confirm',
      message: 'Generate presets with these settings?',
      default: true,
    },
  ]);

  if (!proceed.value) {
    console.log(
      chalk.yellow('Cancelled. Run the command again to start over.'),
    );
    process.exit(0);
  }

  console.log('');
  console.log(chalk.cyan('Generating your presets...'));
  generatePresets(config);
  logRepeatCommand(config);
}

//////////////////////////////////////////
// HELPER FUNCTIONS                     //
//////////////////////////////////////////

/** Choose number of presets to generate */
async function chooseAmountOfPresets(initial = 8): Promise<number> {
  console.log('');
  console.log(
    chalk.dim(
      'Tip: Start with 8-16 presets to review. You can always generate more!',
    ),
  );
  const amount = await inquirer.prompt<{ value: number }>([
    {
      name: 'value',
      type: 'number',
      message: 'How many presets would you like to generate?',
      default: initial,
    },
  ]);
  return amount.value;
}
/** Choose randomness amount */
async function chooseRandomness(initial = 20): Promise<number> {
  console.log('');
  console.log(chalk.dim('Randomness guide:'));
  console.log(chalk.dim('   0-20%   = Subtle variations'));
  console.log(chalk.dim('   20-50%  = Noticeable differences'));
  console.log(chalk.dim('   50-100% = Dramatically different'));
  const amount = await inquirer.prompt<{ value: number }>({
    name: 'value',
    type: 'number',
    message: 'How much variation? (0-100)',
    default: initial,
    validate: (input: number | undefined) => {
      if (typeof input !== 'number') return 'Please enter a number';
      if (input < 0 || input > 100)
        return 'Please enter a value between 0 and 100';
      return true;
    },
  });
  return amount.value;
}

async function choosePreset(
  foundPresets: string[],
  allowSelectAll = false,
): Promise<string> {
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
    }),
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
          }),
        ),
      );
    },
  });
  return presetChoice;
}

function logRepeatCommand(config: Config) {
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
