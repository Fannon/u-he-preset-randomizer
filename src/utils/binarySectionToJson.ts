import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  type BinarySectionJsonOptions,
  binarySectionToJson,
  parseBinarySection,
} from '../binarySection.js';
import { getPresetBinarySection } from '../parser.js';

function usage(): never {
  console.error(
    'Usage: tsx src/utils/binarySectionToJson.ts <preset.h2p> [out.json] [--encodings=base64,uint32,float32] [--max=<entries>]',
  );
  process.exit(1);
}

const positional: string[] = [];
let encodingsArg: string | undefined;
let maxEntriesArg: string | undefined;

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--encodings=')) {
    encodingsArg = arg.split('=')[1];
  } else if (arg.startsWith('--max=')) {
    maxEntriesArg = arg.split('=')[1];
  } else if (arg.startsWith('--')) {
    usage();
  } else {
    positional.push(arg);
  }
}

const presetPath = positional[0];
if (!presetPath) {
  usage();
}

const resolvedPresetPath = path.resolve(presetPath);
const defaultOut = `${path.parse(resolvedPresetPath).name}.binary.json`;
const outPath = positional[1]
  ? path.resolve(positional[1])
  : path.resolve('tmp', defaultOut);

const fileString = readFileSync(resolvedPresetPath, 'latin1');
const binarySection = getPresetBinarySection(fileString);
if (!binarySection) {
  throw new Error('Preset file does not contain a binary section.');
}

const parsed = parseBinarySection(binarySection);
const options: BinarySectionJsonOptions = {};

if (encodingsArg) {
  options.includePayloadEncodings = encodingsArg
    .split(',')
    .map((item) => item.trim())
    .filter(
      (item): item is 'base64' | 'uint16' | 'uint32' | 'float32' =>
        item === 'base64' ||
        item === 'uint16' ||
        item === 'uint32' ||
        item === 'float32',
    );
}

if (maxEntriesArg) {
  options.maxPayloadEntries = Number.parseInt(maxEntriesArg, 10);
  if (Number.isNaN(options.maxPayloadEntries)) {
    throw new Error('Invalid --max value');
  }
}

const json = binarySectionToJson(parsed, options);
writeFileSync(outPath, JSON.stringify(json, null, 2));
console.log('Written JSON to', outPath);
