/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { SynthNames } from './utils/detector.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const argv = yargs(hideBin(process.argv)).parse() as any;

export interface Config {
  debug: boolean;
  synth?: SynthNames;
  amount?: number;
  preset?: string | '?';
  randomness?: number;
  merge?: string | string[] | '*' | '?';
  /** Pattern to narrow down presets to load from library */
  pattern?: string;
  /** Binary part of the preset, if enabled that its read and written back again */
  binary?: boolean;
  stable?: boolean;
  category?: boolean | string;
  dictionary?: boolean;
  author?: boolean | string;
  folder?: boolean | string;
  favorites?: boolean | string | string[];
}

export function getDefaultConfig(): Config {
  return {
    debug: false
  }
}

let config = getDefaultConfig();

export function getConfigFromParameters(): Config {
  if (argv['synth']) {
    config.synth = argv['synth']
  }
  if (argv['debug']) {
    config.debug = true;
  }
  if (argv['amount']) {
    config.amount = parseInt(argv.amount as string);
  }
  if (argv['preset']) {
    config.preset = argv.preset;
  }
  if (argv['randomness']) {
    config.randomness = parseInt(argv.randomness as string);
  }
  if (argv['merge']) {
    config.merge = argv.merge;
  }
  if (argv['pattern']) {
    config.pattern = argv.pattern;
  }
  if (argv['binary']) {
    config.binary = argv.binary;
  }
  if (argv['stable']) {
    config.stable = argv.stable;
  }
  if (argv['category']) {
    config.category = argv.category;
  }
  if (argv['author']) {
    config.author = argv.author;
  }
  if (argv['folder']) {
    config.folder = argv.folder;
  }
  if (argv['favorites']) {
    config.favorites = argv.favorites;
  }
  return config;
}

export function getConfig() {
  return config;
}

export function setConfig(newConfig: Partial<Config>) {
  config = {
    ...config,
    ...newConfig,
  }
}
