import * as yargs from "yargs";
// import { hideBin } from "yargs/helpers"

export type SynthName =
  | "Diva"
  | "Hive"
  | "Zebra2"
  | "ZebraHZ"
  | "Zebralette3"
  | string;

export interface Config {
  synth: SynthName;
  debug: boolean;
  amount: number;
  preset?: string | '?';
  randomness: number;
  merge?: string | string[] | '*' | '?';
  /** Pattern to narrow down presets to load from library */
  pattern?: string;
}

export function getDefaultConfig(): Config {
  return {
    synth: '',
    debug: false,
    amount: 4,
    preset: undefined,
    randomness: 20,
    pattern: '**/*' // all subfolders, all files
  }
}

let config = getDefaultConfig();

export function getConfigFromParameters() {
  const argv = yargs.argv as any;
  if (argv['synth']) {
    config.synth = argv['synth']
  }
  if (argv['debug']) {
    config.debug = true;
  }
  if (argv['amount']) {
    config.amount = parseInt(argv.amount);
  }
  if (argv['preset']) {
    config.preset = argv.preset;
  }
  if (argv['randomness']) {
    config.randomness = parseInt(argv.randomness);
  }
  if (argv['merge']) {
    config.merge = argv.merge;
  }
  if (argv['pattern']) {
    config.pattern = argv.pattern;
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
