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

function parseCliArgs(): Record<string, unknown> {
  return yargs(hideBin(process.argv)).parse() as Record<string, unknown>;
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
  if (argv.amount) {
    newConfig.amount = parseInt(argv.amount as string, 10);
  }
  if (argv.preset) {
    newConfig.preset = argv.preset as string | string[];
  }
  if (argv.randomness) {
    newConfig.randomness = parseInt(argv.randomness as string, 10);
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
