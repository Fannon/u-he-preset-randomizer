import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import type { SynthNames } from './utils/detector.js';

const argv = yargs(hideBin(process.argv)).parse() as Record<string, unknown>;

export interface Config {
  debug: boolean;
  synth?: SynthNames;
  amount?: number;
  preset?: string;
  randomness?: number;
  merge?: string | string[];
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
  customFolder?: string;
}

export function getDefaultConfig(): Config {
  return {
    debug: false,
  };
}

let config = getDefaultConfig();

export function getConfigFromParameters(): Config {
  if (argv.synth) {
    config.synth = argv.synth as SynthNames;
  }
  if (argv.debug) {
    config.debug = true;
  }
  if (argv.amount) {
    config.amount = parseInt(argv.amount as string, 10);
  }
  if (argv.preset) {
    config.preset = argv.preset as string;
  }
  if (argv.randomness) {
    config.randomness = parseInt(argv.randomness as string, 10);
  }
  if (argv.merge) {
    config.merge = argv.merge as string | string[];
  }
  if (argv.pattern) {
    config.pattern = argv.pattern as string;
  }
  if (argv.binary) {
    config.binary = argv.binary as boolean;
  }
  if (argv.stable) {
    config.stable = argv.stable as boolean;
  }
  if (argv.category) {
    config.category = argv.category as boolean | string;
  }
  if (argv.author) {
    config.author = argv.author as boolean | string;
  }
  if (argv.folder) {
    config.folder = argv.folder as boolean | string;
  }
  if (argv.dictionary) {
    config.dictionary = argv.dictionary as boolean;
  }
  if (argv.favorites) {
    config.favorites = argv.favorites as boolean | string | string[];
  }
  if (argv['custom-folder']) {
    config.customFolder = argv['custom-folder'] as string;
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
  };
}
