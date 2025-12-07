#!/usr/bin/env node

/**
 * @file CLI entry point for u-he preset randomizer tool.
 * Handles argument parsing, interactive mode, and preset generation orchestration.
 */

import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import checkbox from '@inquirer/checkbox';
import confirm from '@inquirer/confirm';
import number from '@inquirer/number';
import searchPrompt from '@inquirer/search';
import select from '@inquirer/select';

import chalk from 'chalk';
import fg from 'fast-glob';
import fs from 'fs-extra';

import { type Config, getConfigFromParameters } from './config.js';
import { type GenerationResult, generatePresets } from './generatePresets.js';
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
  console.log('');
  console.log(
    chalk.cyan.bold(`u-he Preset Randomizer v${packageJson.version}`),
  );
  console.log('');
  console.log('Create new synth presets through:');
  console.log(chalk.dim('  •') + ' Fully random generation');
  console.log(chalk.dim('  •') + ' Variations of existing presets');
  console.log(chalk.dim('  •') + ' Merging multiple presets');
  console.log('');
  console.log(chalk.dim('https://github.com/Fannon/u-he-preset-randomizer'));
  console.log('');
  console.log(
    chalk.dim('Tip: Use ↑↓ to navigate, Space to select, Enter to confirm'),
  );
  console.log('');
}

export async function startCli() {
  logCliBanner();
  if (!config.synth) {
    await runInteractiveMode();
    return;
  }
  try {
    const result = generatePresets(config);
    logGenerationSuccess(result);
  } catch (error) {
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    process.exit(1);
  }
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
    console.log(chalk.red.bold('⚠ No u-he synths found on your system'));
    console.log('');
    console.log(chalk.bold('Please make sure:'));
    console.log(
      chalk.dim('  •') + ' You have at least one u-he synth installed',
    );
    console.log(
      chalk.dim('  •') + ' The synth is installed in the standard location',
    );
    console.log(chalk.dim('  •') + ' You have created or loaded some presets');
    console.log('');
    console.log(chalk.dim('If your u-he folder is in a custom location, use:'));
    console.log(
      '  ' +
        chalk.cyan('npx u-he-preset-randomizer --custom-folder "path/to/u-he"'),
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
  if (config.synth === 'Zebralette3' && config.binaryTemplate === undefined) {
    config.binaryTemplate = true;
  }
  const detectedLocation = locations.find((el) => el.synthName === synth);

  // 2) Choose random generation mode
  // 2) Choose random generation mode
  const mode = await select({
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
  });

  // 2.5) Choose optional modifiers for randomization
  if (!config.stable || !config.binary) {
    const binaryEnabled = ['Repro-1', 'Repro-5'].includes(config.synth);

    // First: Basic filtering options
    // First: Basic filtering options
    // First: Options & Filters
    const basicOptions = await checkbox({
      message:
        'Select filters and configuration (optional, press ENTER to continue, select with SPACE):',
      choices: [
        {
          value: 'folder',
          name: 'Filter by specific folder',
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
          name: 'Filter by favorited presets',
        },
        {
          value: 'advanced',
          name: 'Customize randomization (Style, Binary support, Naming)',
        },
      ],
    });

    // Apply basic options
    if (basicOptions.includes('folder')) {
      config.folder = true;
    }
    if (basicOptions.includes('category')) {
      config.category = true;
    }
    if (basicOptions.includes('author')) {
      config.author = true;
    }
    if (basicOptions.includes('favorites')) {
      config.favorites = true;
    }

    if (basicOptions.includes('advanced')) {
      // First: Choose randomization mode
      const randomizationMode = await select({
        message: 'Randomization approach:',
        choices: [
          {
            value: 'stable',
            name: '[Stable] Safer randomization, stays close to library character (recommended)',
          },
          {
            value: 'balanced',
            name: '[Balanced] More randomization, balance between stability and creativity',
          },
          {
            value: 'creative',
            name: '[Creative] Experimental, explores unusual combinations',
          },
        ],
        default: 'stable',
      });

      // Set mode flags
      if (randomizationMode === 'stable') {
        config.stable = true;
        config.creative = false;
      } else if (randomizationMode === 'creative') {
        config.stable = false;
        config.creative = true;
      } else {
        // balanced mode
        config.stable = false;
        config.creative = false;
      }

      // Then: Other advanced options
      const advancedOptions = await checkbox({
        message: 'Additional advanced settings:',
        choices: [
          {
            value: 'binary',
            name: '[Binary] Include binary encoded preset data like curves (may cause crashes)',
            checked: binaryEnabled,
          },
          {
            value: 'binaryTemplate',
            name: '[Binary Templates] Use safe binary templates (Recommended for Z3)',
            checked: config.binaryTemplate,
          },
          {
            value: 'dictionary',
            name: '[Dictionary] Generate realistic preset names',
          },
        ],
      });

      if (advancedOptions.includes('binary')) {
        config.binary = true;
      }
      if (advancedOptions.includes('binaryTemplate')) {
        config.binaryTemplate = true;
      }
      if (advancedOptions.includes('dictionary')) {
        config.dictionary = true;
      }
    } else {
      // Default: stable mode enabled
      config.stable = true;
      config.creative = false;
    }
  }

  // Narrow down by folder selection
  if (config.folder === true) {
    // Detect correct Preset Library Location
    const location =
      detectedLocation ??
      detectPresetLibraryLocations(config).find(
        (el) =>
          el.synthName.toLowerCase() === (config.synth ?? '').toLowerCase(),
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

  console.log(chalk.dim('Loading preset library...'));

  const presetLibrary = loadPresetLibrary(
    config.synth,
    config,
    detectedLocation,
  );

  console.log(chalk.green(`✓ Loaded ${presetLibrary.presets.length} presets`));

  // Optionally: Narrow down by u-he favorites
  if (config.favorites === true && presetLibrary.favorites.length) {
    const allChoices = presetLibrary.favorites.map((el) => {
      return {
        value: el.fileName,
        name: `${el.fileName} (${el.presets.length})`,
      };
    });

    const favoritesPrompt = await checkbox({
      message: 'Which favorite file(s) to use as a selection?',
      choices: allChoices,
    });
    config.favorites = favoritesPrompt;
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

  if (mode === 'Fully randomized presets') {
    //////////////////////////////////////////////////
    // MODE 1: Generate fully randomized presets    //
    //////////////////////////////////////////////////

    config.amount ??= await chooseAmountOfPresets(32);
  } else if (mode === 'Randomize existing preset') {
    //////////////////////////////////////////////////
    // MODE 2: Randomize existing preset            //
    //////////////////////////////////////////////////

    console.log('');
    console.log(
      chalk.dim('Select presets one by one. Choose "no choice" when done.'),
    );
    console.log('');

    const presetSelections: string[] = [];
    const foundPresets = presetLibrary.presets.map((el) => el.filePath);
    while (true) {
      const presetChoice = await choosePreset(foundPresets, false);
      if (presetChoice) {
        presetSelections.push(presetChoice);
        const displayName = presetChoice === '?' ? 'random' : presetChoice;
        console.log(chalk.green(`✓ Added ${displayName}`));
      } else {
        break;
      }
    }

    if (presetSelections.length === 0) {
      console.log(chalk.yellow('No presets selected. Exiting.'));
      process.exit(0);
    }

    console.log(chalk.dim(`Selected ${presetSelections.length} preset(s)`));
    console.log('');

    config.preset =
      presetSelections.length === 1 ? presetSelections[0] : presetSelections;

    config.randomness ??= await chooseRandomness(20);
    config.amount ??= await chooseAmountOfPresets(16);
  } else if (mode === 'Merge existing presets') {
    //////////////////////////////////////////////////
    // MODE 3: Merge Random Presets                 //
    //////////////////////////////////////////////////

    console.log('');
    console.log(
      chalk.dim('Select presets one by one. Choose "no choice" when done.'),
    );
    console.log('');

    config.merge = [];
    const foundPresets = presetLibrary.presets.map((el) => el.filePath);
    while (true) {
      const presetChoice = await choosePreset(foundPresets, true);
      if (presetChoice) {
        config.merge.push(presetChoice);
        const displayName =
          presetChoice === '?'
            ? 'random'
            : presetChoice.startsWith('*') || presetChoice === '*'
              ? 'all matching'
              : presetChoice;
        console.log(chalk.green(`✓ Added ${displayName}`));
        if (presetChoice === '*' || presetChoice.startsWith('*')) {
          break;
        }
      } else {
        break;
      }
    }
    console.log(chalk.dim(`Selected ${config.merge.length} preset(s)`));
    console.log('');

    // Choose amount of randomness
    config.randomness ??= await chooseRandomness(10);
    config.amount ??= await chooseAmountOfPresets(16);
  }

  // Show summary before generating
  console.log('');
  console.log(chalk.bold('Summary:'));
  console.log(chalk.dim('  • ') + `Synth: ${chalk.cyan(config.synth)}`);
  console.log(chalk.dim('  • ') + `Mode: ${chalk.cyan(mode)}`);
  console.log(
    chalk.dim('  • ') + `Amount: ${chalk.cyan(`${config.amount} presets`)}`,
  );

  if (config.randomness) {
    console.log(
      chalk.dim('  • ') + `Randomness: ${chalk.cyan(`${config.randomness}%`)}`,
    );
  }
  if (config.preset) {
    if (Array.isArray(config.preset)) {
      console.log(
        chalk.dim('  • ') +
          `Base Presets: ${chalk.cyan(`${config.preset.length} selected`)}`,
      );
    } else {
      console.log(
        chalk.dim('  • ') + `Base Preset: ${chalk.cyan(config.preset)}`,
      );
    }
  }
  if (config.category && typeof config.category === 'string') {
    console.log(chalk.dim('  • ') + `Category: ${chalk.cyan(config.category)}`);
  }
  if (config.author && typeof config.author === 'string') {
    console.log(chalk.dim('  • ') + `Author: ${chalk.cyan(config.author)}`);
  }
  if (config.folder && typeof config.folder === 'string') {
    console.log(chalk.dim('  • ') + `Folder: ${chalk.cyan(config.folder)}`);
  }

  // Show randomization mode
  if (config.stable) {
    console.log(
      chalk.dim('  • ') +
        `Randomization: ${chalk.green('Stable')} ${chalk.dim('(safer, stays close to library)')}`,
    );
  } else if (config.creative) {
    console.log(
      chalk.dim('  • ') +
        `Randomization: ${chalk.yellow('Creative')} ${chalk.dim('(experimental, explores edges)')}`,
    );
  } else {
    console.log(
      chalk.dim('  • ') +
        `Randomization: ${chalk.blue('Balanced')} ${chalk.dim('(default behavior)')}`,
    );
  }

  if (config.binary) {
    console.log(
      chalk.dim('  • ') +
        `Binary Mode: ${chalk.yellow('Enabled')} ${chalk.dim('(may cause issues)')}`,
    );
  }
  if (config.binaryTemplate) {
    console.log(
      chalk.dim('  • ') +
        `Binary Templates: ${chalk.green('Enabled')} ${chalk.dim('(weighted random selection)')}`,
    );
  }
  if (config.dictionary) {
    console.log(
      chalk.dim('  • ') +
        `Dictionary: ${chalk.green('Enabled')} ${chalk.dim('(realistic names)')}`,
    );
  }

  console.log('');

  const proceed = await confirm({
    message: 'Generate presets with these settings?',
    default: true,
  });

  if (!proceed) {
    console.log(
      chalk.yellow('Cancelled. Run the command again to start over.'),
    );
    process.exit(0);
  }

  console.log('');
  console.log(chalk.dim('Generating presets...'));

  let result: GenerationResult;
  try {
    // If binary mode is enabled but the current library lacks binary data,
    // force a reload by passing undefined.
    const needsReload =
      config.binary &&
      presetLibrary.presets.length > 0 &&
      presetLibrary.presets[0]?.binary === undefined;

    result = generatePresets(config, needsReload ? undefined : presetLibrary);
  } catch (error) {
    console.error(chalk.red('✗ Failed to generate presets'));
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    process.exit(1);
  }

  logGenerationSuccess(result);
  logRepeatCommand(config);
}

//////////////////////////////////////////
// HELPER FUNCTIONS                     //
//////////////////////////////////////////

function logGenerationSuccess(result: GenerationResult) {
  console.log('');
  console.log(
    chalk.green(
      '✓ Successfully generated ' +
        result.presetCount +
        ' ' +
        (result.presetCount === 1 ? 'preset' : 'presets'),
    ),
  );
  console.log('');

  // Show list of generated presets
  if (result.writtenFiles.length > 0) {
    console.log(chalk.bold('Generated presets:'));
    for (const file of result.writtenFiles) {
      // Extract just the preset name from the full path
      const fileName = file.split('/').pop() || file;
      console.log(chalk.dim('  • ') + fileName);
    }
    console.log('');
  }

  console.log(chalk.bold('Output folder:'));
  console.log(chalk.cyan(`  ${result.outputFolder}`));
  console.log('');
  console.log(
    chalk.dim(
      'Open your synth and look for the RANDOM folder in your user presets.',
    ),
  );
  console.log('');
}

/** Choose number of presets to generate */
async function chooseAmountOfPresets(initial = 8): Promise<number> {
  console.log('');
  const amount = await number({
    message: 'How many presets would you like to generate?',
    default: initial,
    validate: (input: number | undefined) => {
      if (typeof input !== 'number' || Number.isNaN(input))
        return 'Please enter a number';
      if (input < 1) return 'Please enter at least 1';
      return true;
    },
  });
  return amount ?? initial;
}
/** Choose randomness amount */
async function chooseRandomness(initial = 20): Promise<number> {
  console.log('');
  console.log(chalk.dim('Randomness guide:'));
  console.log(chalk.dim('   0-20%   = Subtle variations'));
  console.log(chalk.dim('   20-50%  = Noticeable differences'));
  console.log(chalk.dim('   50-100% = Dramatically different'));
  const amount = await number({
    message: 'How much variation? (0-100)',
    default: initial,
    validate: (input: number | undefined) => {
      if (typeof input !== 'number' || Number.isNaN(input))
        return 'Please enter a number';
      if (input < 0 || input > 100)
        return 'Please enter a value between 0 and 100';
      return true;
    },
  });
  return amount ?? initial;
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
  if (config.preset) {
    const presets = Array.isArray(config.preset)
      ? config.preset
      : [config.preset];
    for (const preset of presets) {
      if (typeof preset === 'string') {
        cliCommand += ` --preset "${preset}"`;
      }
    }
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
  if (config.creative) {
    cliCommand += ` --creative`;
  }
  if (config.debug) {
    cliCommand += ` --debug`;
  }
  if (config.binary) {
    cliCommand += ` --binary`;
  }
  if (config.binaryTemplate) {
    cliCommand += ` --binary-template`;
  }

  console.log(chalk.dim('To repeat with same settings:'));
  console.log(chalk.cyan(cliCommand));
  console.log('');
}
