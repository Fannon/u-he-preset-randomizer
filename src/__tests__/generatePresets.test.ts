/**
 * CLI Integration Tests with TestSynth Fixtures
 *
 * These tests use a mock TestSynth with preset fixtures from soundsets/.
 * They run the actual CLI in non-interactive mode and validate results.
 *
 * These tests CAN run in CI/CD environments.
 */

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { generatePresets } from '../generatePresets.js';
import type { Config } from '../config.js';
import {
  findPresetFiles,
  getNewestPresetFiles,
  validatePreset,
} from '../utils/presetValidator.js';

describe('generatePresets Integration Tests (TestSynth)', () => {
  const testSynthRoot = path.join(os.homedir(), '.u-he/TestSynth.data');
  const testSynthPresets = path.join(testSynthRoot, 'Presets/TestSynth');
  const testSynthUserPresets = path.join(testSynthRoot, 'UserPresets/TestSynth');
  const testSynthRandomDir = path.join(testSynthUserPresets, 'RANDOM');

  const fixturesSource = path.join(
    process.cwd(),
    'soundsets/Repro-5 Generated',
  );

  beforeAll(() => {
    // Set up TestSynth with fixtures from soundsets
    // Create directory structure
    fs.ensureDirSync(testSynthPresets);
    fs.ensureDirSync(testSynthUserPresets);

    // Copy preset fixtures to TestSynth Presets folder
    const presetFiles = fs.readdirSync(fixturesSource).filter((f) => f.endsWith('.h2p'));

    for (const file of presetFiles) {
      const source = path.join(fixturesSource, file);
      const dest = path.join(testSynthPresets, file);
      fs.copyFileSync(source, dest);
    }

    console.log(
      `Set up TestSynth with ${presetFiles.length} preset fixtures at ${testSynthRoot}`,
    );
  });

  afterAll(() => {
    // Clean up the entire TestSynth directory
    if (fs.existsSync(testSynthRoot)) {
      fs.removeSync(testSynthRoot);
      console.log(`Cleaned up TestSynth fixtures at ${testSynthRoot}`);
    }
  });

  describe('Fully Random Preset Generation', () => {
    it('should generate fully random presets', () => {
      const config: Config = {
        debug: false,
        synth: 'TestSynth',
        amount: 2,
      };

      generatePresets(config);

      // Verify presets were generated
      const generatedPresets = getNewestPresetFiles(testSynthRandomDir, 2);
      expect(generatedPresets.length).toBe(2);

      // Validate each preset
      for (const presetPath of generatedPresets) {
        expect(validatePreset(presetPath)).toBe(true);
      }

      // Clean up generated presets
      for (const presetPath of generatedPresets) {
        if (presetPath) {
          fs.removeSync(presetPath);
        }
      }
    });

    it('should generate presets in stable mode', () => {
      const config: Config = {
        debug: false,
        synth: 'TestSynth',
        amount: 1,
        stable: true,
      };

      generatePresets(config);

      const generatedPresets = getNewestPresetFiles(testSynthRandomDir, 1);
      expect(generatedPresets.length).toBe(1);
      expect(generatedPresets[0] && validatePreset(generatedPresets[0])).toBe(true);

      // Clean up
      if (generatedPresets[0]) {
        fs.removeSync(generatedPresets[0]);
      }
    });

    it('should generate presets with dictionary names', () => {
      const config: Config = {
        debug: false,
        synth: 'TestSynth',
        amount: 1,
        dictionary: true,
      };

      generatePresets(config);

      const generatedPresets = getNewestPresetFiles(testSynthRandomDir, 1);
      expect(generatedPresets.length).toBe(1);
      expect(generatedPresets[0] && validatePreset(generatedPresets[0])).toBe(true);

      // Clean up
      if (generatedPresets[0]) {
        fs.removeSync(generatedPresets[0]);
      }
    });
  });

  describe('Preset Randomization', () => {
    it('should randomize a specific preset with low randomness', () => {
      const config: Config = {
        debug: false,
        synth: 'TestSynth',
        amount: 1,
        preset: '?', // Random preset
        randomness: 20,
      };

      generatePresets(config);

      const generatedPresets = getNewestPresetFiles(testSynthRandomDir, 1);
      expect(generatedPresets.length).toBe(1);
      expect(generatedPresets[0] && validatePreset(generatedPresets[0])).toBe(true);

      // Clean up
      if (generatedPresets[0]) {
        fs.removeSync(generatedPresets[0]);
      }
    });

    it('should randomize a specific preset with high randomness', () => {
      const config: Config = {
        debug: false,
        synth: 'TestSynth',
        amount: 1,
        preset: '?',
        randomness: 80,
      };

      generatePresets(config);

      const generatedPresets = getNewestPresetFiles(testSynthRandomDir, 1);
      expect(generatedPresets.length).toBe(1);
      expect(generatedPresets[0] && validatePreset(generatedPresets[0])).toBe(true);

      // Clean up
      if (generatedPresets[0]) {
        fs.removeSync(generatedPresets[0]);
      }
    });

    it('should handle extreme randomness values', () => {
      const config: Config = {
        debug: false,
        synth: 'TestSynth',
        amount: 1,
        preset: '?',
        randomness: 100,
      };

      generatePresets(config);

      const generatedPresets = getNewestPresetFiles(testSynthRandomDir, 1);
      expect(generatedPresets.length).toBe(1);
      expect(generatedPresets[0] && validatePreset(generatedPresets[0])).toBe(true);

      // Clean up
      if (generatedPresets[0]) {
        fs.removeSync(generatedPresets[0]);
      }
    });
  });

  describe('Preset Merging', () => {
    it('should merge two random presets', () => {
      const config: Config = {
        debug: false,
        synth: 'TestSynth',
        amount: 1,
        merge: ['?', '?'],
      };

      generatePresets(config);

      const generatedPresets = getNewestPresetFiles(testSynthRandomDir, 1);
      expect(generatedPresets.length).toBe(1);
      expect(generatedPresets[0] && validatePreset(generatedPresets[0])).toBe(true);

      // Clean up
      if (generatedPresets[0]) {
        fs.removeSync(generatedPresets[0]);
      }
    });

    it('should merge three random presets', () => {
      const config: Config = {
        debug: false,
        synth: 'TestSynth',
        amount: 1,
        merge: ['?', '?', '?'],
      };

      generatePresets(config);

      const generatedPresets = getNewestPresetFiles(testSynthRandomDir, 1);
      expect(generatedPresets.length).toBe(1);
      expect(generatedPresets[0] && validatePreset(generatedPresets[0])).toBe(true);

      // Clean up
      if (generatedPresets[0]) {
        fs.removeSync(generatedPresets[0]);
      }
    });

    it('should merge presets in stable mode', () => {
      const config: Config = {
        debug: false,
        synth: 'TestSynth',
        amount: 1,
        merge: ['?', '?'],
        stable: true,
      };

      generatePresets(config);

      const generatedPresets = getNewestPresetFiles(testSynthRandomDir, 1);
      expect(generatedPresets.length).toBe(1);
      expect(generatedPresets[0] && validatePreset(generatedPresets[0])).toBe(true);

      // Clean up
      if (generatedPresets[0]) {
        fs.removeSync(generatedPresets[0]);
      }
    });
  });

  describe('Preset Library Validation', () => {
    it('should have valid fixture presets', () => {
      const presetFiles = findPresetFiles(testSynthPresets);
      expect(presetFiles.length).toBeGreaterThan(0);

      // All fixtures should be valid
      for (const presetPath of presetFiles) {
        expect(validatePreset(presetPath)).toBe(true);
      }
    });

    it('should load preset library successfully', () => {
      const config: Config = {
        debug: false,
        synth: 'TestSynth',
        amount: 1,
      };

      // Should not throw
      expect(() => generatePresets(config)).not.toThrow();

      // Clean up
      const generatedPresets = getNewestPresetFiles(testSynthRandomDir, 1);
      if (generatedPresets.length > 0) {
        fs.removeSync(generatedPresets[0]!);
      }
    });
  });

  describe('Generated Preset Count', () => {
    it('should generate correct number of presets', () => {
      const amounts = [1, 2, 5];

      for (const amount of amounts) {
        const config: Config = {
          debug: false,
          synth: 'TestSynth',
          amount,
        };

        generatePresets(config);

        const generatedPresets = getNewestPresetFiles(testSynthRandomDir, amount);
        expect(generatedPresets.length).toBe(amount);

        // Clean up
        for (const presetPath of generatedPresets) {
          fs.removeSync(presetPath);
        }
      }
    });
  });
});
