import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import type { Config } from '../config.js';
import {
  loadPresetLibrary,
  writePresetLibrary,
  type PresetLibrary,
} from '../presetLibrary.js';
import type { Preset } from '../parser.js';
import { serializePresetToFile } from '../parser.js';

describe('presetLibrary', () => {
  let tmpRoot: string;
  let synthRoot: string;
  let presetsDir: string;
  let userDir: string;
  let config: Config;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'preset-library-'));
    synthRoot = path.join(tmpRoot, 'TestSynth.data');
    presetsDir = path.join(synthRoot, 'Presets', 'TestSynth');
    userDir = path.join(synthRoot, 'UserPresets', 'TestSynth');
    fs.ensureDirSync(presetsDir);
    fs.ensureDirSync(userDir);

    config = {
      debug: false,
      synth: 'TestSynth',
      customFolder: tmpRoot,
    };
  });

  afterEach(() => {
    fs.removeSync(tmpRoot);
  });

  it('loads presets from both factory and user folders including favorites', () => {
    writePresetFixture(presetsDir, 'LocalFixture.h2p');
    writePresetFixture(userDir, 'UserFixture.h2p');

    const favFile = path.join(synthRoot, 'Favorites', 'test.uhe-fav');
    fs.ensureDirSync(path.dirname(favFile));
    fs.writeJSONSync(favFile, {
      'tag-category-fav': {
        Pads: [
          {
            name: 'UserFixture',
            db_path: '/User/UserFixture.h2p',
          },
        ],
      },
    });

    const library = loadPresetLibrary('TestSynth', config);

    expect(library.presets.map((preset) => preset.filePath)).toEqual(
      expect.arrayContaining(['/Local/LocalFixture.h2p', '/User/UserFixture.h2p']),
    );
    expect(library.favorites).toHaveLength(1);
    expect(library.favorites[0]?.presets[0]).toEqual({
      name: 'UserFixture',
      path: '/User/UserFixture.h2p',
    });
  });

  it('supports /User/ patterns without touching factory presets', () => {
    writePresetFixture(presetsDir, 'LocalFixture.h2p');
    writePresetFixture(userDir, 'UserOnly.h2p');

    config.pattern = '/User/UserOnly';

    const library = loadPresetLibrary('TestSynth', config);

    expect(library.presets).toHaveLength(1);
    expect(library.presets[0]?.filePath).toBe('/User/UserOnly.h2p');
  });

  it('writes generated presets relative to the user preset folder', () => {
    const randomFolder = path.join(userDir, 'RANDOM');
    fs.ensureDirSync(randomFolder);

    const library: PresetLibrary = {
      synth: 'TestSynth',
      rootFolder: synthRoot,
      userPresetsFolder: randomFolder,
      presetsFolder: presetsDir,
      presets: [
        {
          filePath: '/Generated/Result.h2p',
          presetName: 'Result',
          categories: ['Pads'],
          meta: [
            { key: 'Author', value: 'Random Generator' },
            { key: 'Description', value: 'Unit test preset' },
          ],
          params: [
            {
              id: 'HEAD/Param',
              key: 'Param',
              section: 'HEAD',
              value: 99,
              index: 0,
              type: 'integer',
            },
          ],
        },
      ],
      favorites: [],
    };

    writePresetLibrary(library);

    const expectedPath = path.join(randomFolder, '/Generated/Result.h2p');
    expect(fs.existsSync(expectedPath)).toBe(true);
    const fileContent = fs.readFileSync(expectedPath, 'utf-8');
    expect(fileContent).toContain('Random Generator');
  });

  function writePresetFixture(targetDir: string, fileName: string, overrides: Partial<Preset> = {}) {
    const presetName = path.parse(fileName).name;
    const basePreset: Preset = {
      filePath: `/Fixture/${presetName}.h2p`,
      presetName,
      categories: ['Pads'],
      meta: [
        { key: 'Author', value: 'Unit Tester' },
        { key: 'Description', value: 'Fixture preset' },
      ],
      params: [
        {
          id: 'HEAD/Param',
          key: 'Param',
          section: 'HEAD',
          value: 42,
          index: 0,
          type: 'integer',
        },
      ],
    };

    const preset: Preset = {
      ...basePreset,
      meta: basePreset.meta.map((entry) => ({ ...entry })),
      params: basePreset.params.map((param) => ({ ...param })),
      ...overrides,
    };

    const filePath = path.join(targetDir, fileName);
    fs.outputFileSync(filePath, serializePresetToFile(preset));
  }
});
