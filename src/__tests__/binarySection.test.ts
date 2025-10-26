import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseBinarySection, binarySectionToJson } from '../binarySection.js';
import { getPresetBinarySection } from '../parser.js';

const PRESET_DIR = path.resolve(process.cwd(), 'tmp', 'Zebralette 3');

function ensureFixtureDirectory() {
  if (!existsSync(PRESET_DIR)) {
    throw new Error(
      `Expected Zebralette 3 presets at "${PRESET_DIR}". Please copy the presets into tmp/Zebralette 3.`,
    );
  }
}

function readBinarySectionFromPreset(presetPath: string) {
  const fileString = readFileSync(presetPath, 'latin1');
  const section = getPresetBinarySection(fileString);
  if (!section) {
    throw new Error(`Preset "${presetPath}" does not contain a binary section`);
  }
  return section;
}

describe('binary section parsing', () => {
  beforeAll(() => {
    ensureFixtureDirectory();
  });

  it('decodes the Basic Shapes binary chunk', () => {
    const presetPath = path.join(PRESET_DIR, 'Basic Shapes.h2p');
    const parsed = parseBinarySection(readBinarySectionFromPreset(presetPath));

    expect(parsed.declaredUncompressedSize).toBe(282372);
    expect(parsed.headerBytes.length).toBeGreaterThan(0);
    expect(parsed.payloadBytes.length).toBeGreaterThan(0);
    expect(parsed.headerFields[0]).toMatchObject({
      token: 'klkkckdp',
    });
    expect(parsed.undecodedTokens).toContain('?klkkkkdo');
    expect(parsed.headerBytes.length + parsed.payloadBytes.length).toBe(
      parsed.combinedBytes.length,
    );
  });

  it('parses all provided Zebralette 3 presets without errors', () => {
    const presetFiles = readdirSync(PRESET_DIR).filter((file) => file.endsWith('.h2p'));
    expect(presetFiles.length).toBeGreaterThan(0);

    const headerLengths = new Set<number>();

    for (const file of presetFiles) {
      const presetPath = path.join(PRESET_DIR, file);
      const parsed = parseBinarySection(readBinarySectionFromPreset(presetPath));

      expect(parsed.declaredUncompressedSize).toBeGreaterThan(0);
      expect(parsed.headerFields.length).toBeGreaterThan(20);
      expect(parsed.payloadBytes.length).toBeGreaterThan(1000);
      expect(parsed.combinedBytes.length).toBe(
        parsed.headerBytes.length + parsed.payloadBytes.length,
      );
      headerLengths.add(parsed.headerBytes.length);
    }

    expect(headerLengths.size).toBeGreaterThan(0);
  });

  it('serializes parsed sections into JSON-friendly data', () => {
    const presetPath = path.join(PRESET_DIR, 'Basic Shapes.h2p');
    const parsed = parseBinarySection(readBinarySectionFromPreset(presetPath));
    const json = binarySectionToJson(parsed, {
      includePayloadEncodings: ['uint16', 'float32'],
      maxPayloadEntries: 5,
    });

    expect(json.declaredUncompressedSize).toBe(282372);
    expect(json.header['klkkckdp']).toBeDefined();
    expect(json.payload.byteLength).toBe(parsed.payloadBytes.length);
    expect(json.payload.uint16LittleEndian).toHaveLength(5);
    expect(json.payload.float32LittleEndian).toHaveLength(5);
  });
});
