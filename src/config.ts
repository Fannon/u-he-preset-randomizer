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
  synthName: SynthName;
  debug: boolean;
  amount: number;
}

export function getDefaultConfig(): Config {
  return {
    synthName: 'Diva',
    debug: false,
    amount: 4
  }
}

export function getConfig() {
  const config = getDefaultConfig();
  const argv = yargs.argv as any;
  if (argv['synth']) {
    config.synthName = argv['synth']
  }
  if (argv['debug']) {
    config.debug = true;
  }
  if (argv['amount']) {
    config.amount = parseInt(argv.amount);
  }
  return config;
}
