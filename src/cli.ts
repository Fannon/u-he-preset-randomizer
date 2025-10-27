#!/usr/bin/env node
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import searchPrompt from '@inquirer/search';
import boxen from 'boxen';
import chalk from 'chalk';
import Table from 'cli-table3';
import fg from 'fast-glob';
import fs from 'fs-extra';
import gradient from 'gradient-string';
import inquirer from 'inquirer';
import ora from 'ora';
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
  const title = gradient.pastel.multiline(
    `u-he Preset Randomizer v${packageJson.version}`,
  );

  const welcomeMessage = boxen(
    `${title}\n\n` +
      `${chalk.bold('Welcome!')} This tool helps you create new synth presets through:\n\n` +
      `  ${chalk.cyan('1.')} Fully random generation ${chalk.dim('(great for discovery)')}\n` +
      `  ${chalk.cyan('2.')} Variations of existing presets ${chalk.dim('(similar but different)')}\n` +
      `  ${chalk.cyan('3.')} Merging multiple presets ${chalk.dim('(combine your favorites)')}\n\n` +
      `${chalk.dim('Documentation: https://github.com/Fannon/u-he-preset-randomizer#readme')}`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      textAlignment: 'left',
    },
  );

  console.log(welcomeMessage);
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
    const errorMessage = boxen(
      `${chalk.red.bold('⚠ No u-he synths found on your system')}\n\n` +
        `${chalk.bold('Please make sure:')}\n` +
        `  ${chalk.dim('•')} You have at least one u-he synth installed\n` +
        `  ${chalk.dim('•')} The synth is installed in the standard location\n` +
        `  ${chalk.dim('•')} You have created or loaded some presets\n\n` +
        `${chalk.dim('If your u-he folder is in a custom location, use:')}\n` +
        `  ${chalk.cyan('npx u-he-preset-randomizer --custom-folder "path/to/u-he"')}`,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'red',
        textAlignment: 'left',
      },
    );

    console.log(errorMessage);
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

  const spinner = ora({
    text: 'Loading your preset library...',
    color: 'cyan',
  }).start();

  const presetLibrary = loadPresetLibrary(config.synth, config);

  spinner.succeed(
    chalk.green(`Loaded ${presetLibrary.presets.length} presets`),
  );

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
  const table = new Table({
    head: [chalk.bold.cyan('Setting'), chalk.bold.cyan('Value')],
    colWidths: [20, 50],
    style: {
      head: [],
      border: ['cyan'],
    },
  });

  table.push(
    [chalk.bold('Synth'), config.synth],
    [chalk.bold('Mode'), mode.value],
    [chalk.bold('Amount'), `${config.amount} presets`],
  );

  if (config.randomness) {
    table.push([chalk.bold('Randomness'), `${config.randomness}%`]);
  }
  if (config.preset && typeof config.preset === 'string') {
    table.push([chalk.bold('Base Preset'), config.preset]);
  }
  if (config.category && typeof config.category === 'string') {
    table.push([chalk.bold('Category'), config.category]);
  }
  if (config.author && typeof config.author === 'string') {
    table.push([chalk.bold('Author'), config.author]);
  }
  if (config.folder && typeof config.folder === 'string') {
    table.push([chalk.bold('Folder'), config.folder]);
  }
  if (config.stable) {
    table.push([
      chalk.bold('Stable Mode'),
      chalk.green('Enabled') + chalk.dim(' (safer randomization)'),
    ]);
  }
  if (config.binary) {
    table.push([
      chalk.bold('Binary Mode'),
      chalk.yellow('Enabled') + chalk.dim(' (may cause issues)'),
    ]);
  }
  if (config.dictionary) {
    table.push([
      chalk.bold('Dictionary'),
      chalk.green('Enabled') + chalk.dim(' (realistic names)'),
    ]);
  }

  console.log(table.toString());
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
  const generationSpinner = ora({
    text: 'Generating your presets...',
    color: 'cyan',
  }).start();

  try {
    generatePresets(config);
    generationSpinner.stop();
  } catch (error) {
    generationSpinner.fail('Failed to generate presets');
    throw error;
  }

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

  const repeatBox = boxen(
    `${chalk.bold('💡 To run with the same configuration again:')}\n\n${chalk.cyan(cliCommand)}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'blue',
      textAlignment: 'left',
    },
  );

  console.log(repeatBox);
}
