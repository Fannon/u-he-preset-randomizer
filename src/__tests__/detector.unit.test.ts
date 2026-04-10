import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import type { Config } from '../config.js';
import {
  detectPresetLibraryLocations,
  getWslWindowsUserPresetRoots,
} from '../utils/detector.js';

describe('detectPresetLibraryLocations', () => {
  let tmpRoot: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'uhe-detector-'));
  });

  afterEach(() => {
    fs.removeSync(tmpRoot);
  });

  it('detects synths in a custom folder and mirrors Repro-5 from Repro-1', () => {
    createSynthDataFolder('TestSynth');
    createSynthDataFolder('Repro-1');

    const config = {
      debug: false,
      customFolder: tmpRoot,
    } as Config;

    const locations = detectPresetLibraryLocations(config);
    const synthNames = locations.map((location) => location.synthName);

    expect(synthNames).toEqual(
      expect.arrayContaining(['TestSynth', 'Repro-1', 'Repro-5']),
    );

    const testSynth = locations.find((location) => location.synthName === 'TestSynth');
    expect(testSynth?.root).toBe(path.join(tmpRoot, 'TestSynth.data/'));
    expect(testSynth?.userPresets).toBe(
      path.join(tmpRoot, 'TestSynth.data/UserPresets/TestSynth'),
    );

    const repro5 = locations.find((location) => location.synthName === 'Repro-5');
    expect(repro5?.root).toBe(path.join(tmpRoot, 'Repro-1.data/'));
    expect(repro5?.userPresets).toBe(
      path.join(tmpRoot, 'Repro-1.data/UserPresets/Repro-5'),
    );
  });

  it('collects WSL Windows per-user preset roots', () => {
    const usersRoot = path.join(tmpRoot, 'Users');
    fs.ensureDirSync(path.join(usersRoot, 'Alice'));
    fs.ensureDirSync(path.join(usersRoot, 'Bob'));
    fs.writeFileSync(path.join(usersRoot, 'desktop.ini'), '');

    const roots = getWslWindowsUserPresetRoots(usersRoot);

    expect(roots.sort()).toEqual([
      path.join(usersRoot, 'Alice', 'Documents', 'u-he'),
      path.join(usersRoot, 'Alice', 'My Documents', 'u-he'),
      path.join(usersRoot, 'Alice', 'AppData', 'Roaming', 'u-he'),
      path.join(usersRoot, 'Bob', 'Documents', 'u-he'),
      path.join(usersRoot, 'Bob', 'My Documents', 'u-he'),
      path.join(usersRoot, 'Bob', 'AppData', 'Roaming', 'u-he'),
    ].sort());
  });

  function createSynthDataFolder(synthName: string) {
    const root = path.join(tmpRoot, `${synthName}.data`);
    fs.ensureDirSync(path.join(root, 'Presets', synthName));
    fs.ensureDirSync(path.join(root, 'UserPresets', synthName));
  }
});
