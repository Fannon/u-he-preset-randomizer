/**
 * @file Configuration management and CLI argument parsing.
 * Handles CLI argument parsing with yargs and provides configuration defaults.
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import type { SynthNames } from './utils/detector.js';

export interface Config {
  debug: boolean;
  synth?: SynthNames;
  amount?: number;
  preset?: string | string[];
  randomness?: number;
  merge?: string | string[];
  /** Pattern to narrow down presets to load from library */
  pattern?: string;
  /** Binary part of the preset, if enabled that its read and written back again */
  binary?: boolean;
  stable?: boolean;
  /** Creative mode: use uniform distribution instead of frequency-weighted sampling */
  creative?: boolean;
  category?: boolean | string;
  dictionary?: boolean;
  author?: boolean | string;
  folder?: boolean | string;
  favorites?: boolean | string | string[];
  customFolder?: string;
  /** Use a weighted random binary template for the binary section */
  binaryTemplate?: boolean;
}

export function getDefaultConfig(): Config {
  return {
    debug: false,
  };
}

let config = getDefaultConfig();

export function buildCliArgParser(argv = hideBin(process.argv)) {
  return yargs(argv)
    .scriptName('u-he-preset-randomizer')
    .usage('$0 [options]')
    .example(
      '$0 --synth Diva --amount 3',
      'Generate 3 fully random Diva presets',
    )
    .example(
      '$0 --synth Diva --preset "HS Greek Horn" --randomness 20 --amount 5',
      'Create 5 randomized variants of an existing preset',
    )
    .example(
      '$0 --synth Diva --merge "HS Greek Horn" --merge "HS Strumpet" --amount 5',
      'Merge existing presets into 5 new variants',
    )
    .epilogue('Run without --synth to start interactive mode.')
    .option('synth', {
      type: 'string',
      describe: 'Choose the u-he synth, for example Diva or Repro-1.',
    })
    .option('amount', {
      type: 'number',
      describe: 'How many presets to generate.',
    })
    .option('randomness', {
      type: 'number',
      describe: 'Randomness percentage for preset variation or merge output.',
    })
    .option('preset', {
      type: 'string',
      array: true,
      describe: 'Base preset name to randomize. Repeat to randomize multiple.',
    })
    .option('merge', {
      type: 'string',
      array: true,
      describe: 'Preset name to merge. Repeat the flag to add more presets.',
    })
    .option('pattern', {
      type: 'string',
      describe: 'Glob pattern used to narrow the preset library.',
    })
    .option('binary', {
      type: 'boolean',
      describe: 'Keep binary preset sections when generating new presets.',
    })
    .option('stable', {
      type: 'boolean',
      describe: 'Use the safer, more stable randomization mode.',
    })
    .option('creative', {
      type: 'boolean',
      describe: 'Use the more experimental randomization mode.',
    })
    .option('category', {
      type: 'string',
      describe: 'Filter presets by category metadata.',
    })
    .option('dictionary', {
      type: 'boolean',
      describe: 'Generate preset names from the existing library dictionary.',
    })
    .option('author', {
      type: 'string',
      describe: 'Filter presets by author metadata.',
    })
    .option('folder', {
      type: 'string',
      describe: 'Filter presets by folder. Use /Local/ or /User/ as a base.',
    })
    .option('favorites', {
      type: 'string',
      array: true,
      describe: 'Filter presets by .uhe-fav favorites file. Repeat if needed.',
    })
    .option('custom-folder', {
      type: 'string',
      describe: 'Custom base folder for the u-he installation or presets.',
    })
    .option('binary-template', {
      type: 'boolean',
      describe: 'Use curated binary templates instead of random binary data.',
    })
    .option('debug', {
      type: 'boolean',
      describe: 'Print debug output and dump the analyzed params model.',
    })
    .alias('h', 'help')
    .alias('v', 'version')
    .help()
    .version();
}

function parseCliArgs(): Record<string, unknown> {
  return buildCliArgParser().parse() as Record<string, unknown>;
}

function parseOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return Number.parseInt(value, 10);
  }
  return undefined;
}

export function getConfigFromParameters(
  overrides?: Record<string, unknown>,
): Config {
  const argv = overrides ?? parseCliArgs();

  // Create a new config object instead of mutating the module-level one
  const newConfig: Config = { ...getDefaultConfig() };

  if (argv.synth) {
    newConfig.synth = argv.synth as SynthNames;
  }
  if (argv.debug) {
    newConfig.debug = true;
  }
  const amount = parseOptionalNumber(argv.amount);
  if (amount !== undefined) {
    newConfig.amount = amount;
  }
  if (argv.preset) {
    newConfig.preset = argv.preset as string | string[];
  }
  const randomness = parseOptionalNumber(argv.randomness);
  if (randomness !== undefined) {
    newConfig.randomness = randomness;
  }
  if (argv.merge) {
    newConfig.merge = argv.merge as string | string[];
  }
  if (argv.pattern) {
    newConfig.pattern = argv.pattern as string;
  }
  if (argv.binary) {
    newConfig.binary = argv.binary as boolean;
  }
  if (argv.stable) {
    newConfig.stable = argv.stable as boolean;
  }
  if (argv.creative) {
    newConfig.creative = argv.creative as boolean;
  }
  if (argv.category) {
    newConfig.category = argv.category as boolean | string;
  }
  if (argv.author) {
    newConfig.author = argv.author as boolean | string;
  }
  if (argv.folder) {
    newConfig.folder = argv.folder as boolean | string;
  }
  if (argv.dictionary) {
    newConfig.dictionary = argv.dictionary as boolean;
  }
  if (argv.favorites) {
    newConfig.favorites = argv.favorites as boolean | string | string[];
  }
  if (argv['custom-folder']) {
    newConfig.customFolder = argv['custom-folder'] as string;
  }

  if (argv['binary-template']) {
    newConfig.binaryTemplate = argv['binary-template'] as boolean;
  }

  // Default binaryTemplate to true for Zebralette3 if not specified
  if (
    newConfig.synth === 'Zebralette3' &&
    newConfig.binaryTemplate === undefined
  ) {
    newConfig.binaryTemplate = true;
  }

  // Update module-level config for backward compatibility with getConfig/setConfig
  config = newConfig;
  return newConfig;
}

export function getConfig() {
  return config;
}

export function setConfig(newConfig: Partial<Config>) {
  config = {
    ...config,
    ...newConfig,
  };
}

export function resetConfig() {
  config = getDefaultConfig();
}
