import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { parseBinarySection } from '../binarySection.js';
import { getPresetBinarySection } from '../parser.js';

function usage(): never {
  console.error(
    'Usage: tsx src/utils/compareBinaryHeaders.ts <preset-directory (default: tmp/Zebralette 3)>',
  );
  process.exit(1);
}

const inputDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve('tmp', 'Zebralette 3');

const dirStats = statSync(inputDir, { throwIfNoEntry: false });
if (!dirStats || !dirStats.isDirectory()) {
  usage();
}

const files = readdirSync(inputDir)
  .filter((file) => file.endsWith('.h2p'))
  .sort((a, b) => a.localeCompare(b));

if (!files.length) {
  console.error(`No .h2p files found in ${inputDir}`);
  process.exit(1);
}

const headerLengths = new Set<number>();
const payloadLengths = new Map<number, string[]>();
const declaredSizes = new Map<number, string[]>();
const tokenValues = new Map<string, Set<string>>();
const undecodedTokens = new Set<string>();

for (const file of files) {
  const presetPath = path.join(inputDir, file);
  const fileString = readFileSync(presetPath, 'latin1');
  const binarySection = getPresetBinarySection(fileString);
  if (!binarySection) {
    console.warn(`Skipping ${file}: missing binary section`);
    continue;
  }

  const parsed = parseBinarySection(binarySection);
  headerLengths.add(parsed.headerBytes.length);

  const payloadGroup = payloadLengths.get(parsed.payloadBytes.length) ?? [];
  payloadGroup.push(file);
  payloadLengths.set(parsed.payloadBytes.length, payloadGroup);

  if (parsed.declaredUncompressedSize) {
    const declaredGroup =
      declaredSizes.get(parsed.declaredUncompressedSize) ?? [];
    declaredGroup.push(file);
    declaredSizes.set(parsed.declaredUncompressedSize, declaredGroup);
  }

  for (const token of parsed.undecodedTokens) {
    undecodedTokens.add(token);
  }

  for (const field of parsed.headerFields) {
    const key = field.token;
    const value = field.bytes.toString('hex');
    const values = tokenValues.get(key) ?? new Set<string>();
    values.add(value);
    tokenValues.set(key, values);
  }
}

console.log('Analyzed presets:', files.length);
console.log('Unique header byte lengths:', [...headerLengths].join(', '));

const payloadStats = [...payloadLengths.entries()]
  .sort((a, b) => a[0] - b[0])
  .map(([length, presets]) => `${length} bytes (${presets.length} presets)`);
console.log('Payload length distribution:', payloadStats.join('; '));

const declaredStats = [...declaredSizes.entries()]
  .sort((a, b) => a[0] - b[0])
  .map(([size, presets]) => `${size} (${presets.length})`);
console.log('Declared uncompressed sizes:', declaredStats.join('; '));

if (undecodedTokens.size) {
  console.log('Undecoded tokens encountered:', [...undecodedTokens].join(', '));
}

console.log('\nHeader token variability (hex values):');
for (const [token, values] of tokenValues.entries()) {
  const list = [...values];
  const sample = list.slice(0, 5).join(', ');
  console.log(
    `${token}: ${values.size} unique ${values.size > 5 ? `(sample: ${sample} …)` : `(${sample})`}`,
  );
}
