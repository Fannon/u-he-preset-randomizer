import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseBinarySection } from '../binarySection.js';

function usage(): never {
  console.error(
    'Usage: tsx src/utils/analyzeBinarySection.ts <preset.h2p> [out.bin]',
  );
  process.exit(1);
}

const [presetPath, outputPath] = process.argv.slice(2);
if (!presetPath) {
  usage();
}

const resolvedPresetPath = path.resolve(presetPath);
const outPath = outputPath
  ? path.resolve(outputPath)
  : path.resolve('tmp', `${path.parse(presetPath).name}.decoded.bin`);

const presetBuffer = readFileSync(resolvedPresetPath);
const marker = Buffer.from("// DON'T TOUCH THIS\n", 'utf8');
const markerIdx = presetBuffer.indexOf(marker);
if (markerIdx === -1) {
  throw new Error('Binary marker not found in preset file.');
}

const chunkStart = markerIdx + marker.length;
const chunkBuffer = presetBuffer.subarray(chunkStart);
const nulnulIdx = chunkBuffer.indexOf(Buffer.from([0x0, 0x0]));
const binarySection =
  nulnulIdx === -1 ? chunkBuffer : chunkBuffer.subarray(0, nulnulIdx);
const sectionText = binarySection.toString('latin1');
const parsed = parseBinarySection(sectionText);

writeFileSync(outPath, parsed.combinedBytes);

console.log('Decoded binary section for', resolvedPresetPath);
console.log(
  'Declared uncompressed size:',
  parsed.declaredUncompressedSize ?? 'unknown',
);
console.log('Header tokens decoded:', parsed.headerFields.length);
console.table(
  parsed.headerFields.map((field) => ({
    token: field.token,
    hex: `0x${field.bytes.toString('hex')}`,
    decimal: field.decimalValue ?? 'n/a',
  })),
);
if (parsed.undecodedTokens.length) {
  console.log('Tokens left undecoded:', parsed.undecodedTokens);
}
console.log('Header bytes:', parsed.headerBytes.length);
console.log('Payload bytes:', parsed.payloadBytes.length);
console.log('Combined binary length:', parsed.combinedBytes.length);
console.log('Written to:', outPath);
