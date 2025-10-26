/**
 * End-to-End Tests for CLI
 *
 * IMPORTANT: These tests require actual u-he synths to be installed locally.
 * They will NOT run in CI/CD environments.
 *
 * These tests verify that:
 * - The CLI runs with different parameters
 * - Presets are successfully generated
 * - Generated presets are stored in the file system
 * - Generated presets are valid .h2p format
 */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import fs from 'fs-extra';
import path from 'node:path';
import { runWithoutInteractivity } from '../../cli.js';
import type { Config } from '../../config.js';
import { isValidPreset, parseUhePreset } from '../../parser.js';
import { detectPresetLibraryLocations } from '../../utils/detector.js';

describe('CLI E2E Tests', () => {
  let createdPresetFiles: string[];
  let availableSynths: string[];

  beforeEach(() => {
    // Detect available synths on this system
    const detectedLocations = detectPresetLibraryLocations({ debug: false });
    availableSynths = detectedLocations.map((loc) => loc.synthName);

    if (availableSynths.length === 0) {
      console.warn('⚠️  No u-he synths detected. Skipping E2E tests.');
    }

    // Track specific files created during this test
    createdPresetFiles = [];
  });

  afterEach(() => {
    // Clean up only the specific preset files created during this test
    for (const filePath of createdPresetFiles) {
      if (fs.existsSync(filePath)) {
        try {
          fs.removeSync(filePath);
        } catch (error) {
          console.warn(`Failed to clean up ${filePath}:`, error);
        }
      }
    }
    if (createdPresetFiles.length > 0) {
      console.log(`Cleaned up ${createdPresetFiles.length} test preset(s)`);
    }
    createdPresetFiles = [];
  });

  /**
   * Helper function to get the expected output directory for a synth
   */
  function getExpectedOutputDir(synth: string): string {
    const locations = detectPresetLibraryLocations({ debug: false });
    const location = locations.find(
      (loc) => loc.synthName.toLowerCase() === synth.toLowerCase(),
    );
    if (!location) {
      throw new Error(`Could not find location for synth: ${synth}`);
    }
    return path.join(location.userPresets, 'RANDOM');
  }

  /**
   * Helper function to verify that presets were generated and track them for cleanup
   */
  function verifyPresetsGenerated(
    outputDir: string,
    expectedCount: number,
  ): string[] {
    expect(fs.existsSync(outputDir)).toBe(true);

    // Recursively find all .h2p files in the directory and subdirectories
    const findPresetFiles = (dir: string): string[] => {
      const files: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...findPresetFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.h2p')) {
          files.push(fullPath);
        }
      }
      return files;
    };

    // Get all .h2p files sorted by modification time (newest first)
    const allFiles = findPresetFiles(outputDir)
      .map((filePath) => ({
        path: filePath,
        mtime: fs.statSync(filePath).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime);

    // Take only the newest files that were just created
    const newestFiles = allFiles.slice(0, expectedCount);
    expect(newestFiles.length).toBe(expectedCount);

    const filePaths = newestFiles.map((f) => f.path);

    // Add to cleanup list
    createdPresetFiles.push(...filePaths);

    return filePaths;
  }

  /**
   * Helper function to verify preset file validity
   */
  function verifyPresetValidity(filePath: string): void {
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(0);

    // Parse the preset to verify it's valid
    const preset = parseUhePreset(
      content,
      path.basename(filePath, '.h2p'),
      false,
    );
    expect(isValidPreset(preset)).toBe(true);
    expect(preset.meta).toBeDefined();
    expect(preset.params).toBeDefined();
  }

  describe('Fully Random Preset Generation', () => {
    it('should generate fully random presets', () => {
      if (availableSynths.length === 0) {
        console.log('Skipping: No synths available');
        return;
      }

      const synth = availableSynths[0];
      const config: Config = {
        debug: false,
        synth: synth as any,
        amount: 1,
        pattern: '/Local/*', // Limit to Local folder to speed up loading
      };

      const outputDir = getExpectedOutputDir(synth);
      runWithoutInteractivity(config);

      const presetFiles = verifyPresetsGenerated(outputDir, 1);
      verifyPresetValidity(presetFiles[0]);
    });

    it('should generate random presets with dictionary names', () => {
      if (availableSynths.length === 0) {
        console.log('Skipping: No synths available');
        return;
      }

      const synth = availableSynths[0];
      const config: Config = {
        debug: false,
        synth: synth as any,
        amount: 1,
        dictionary: true,
        pattern: '/Local/*',
      };

      const outputDir = getExpectedOutputDir(synth);
      runWithoutInteractivity(config);

      const presetFiles = verifyPresetsGenerated(outputDir, 1);
      verifyPresetValidity(presetFiles[0]);
    });
  });

  describe('Preset Randomization', () => {
    it('should randomize a specific preset with low randomness', () => {
      if (availableSynths.length === 0) {
        console.log('Skipping: No synths available');
        return;
      }

      const synth = availableSynths[0];
      const config: Config = {
        debug: false,
        synth: synth as any,
        amount: 1,
        preset: '?', // Random preset
        randomness: 20,
        pattern: '/Local/*',
      };

      const outputDir = getExpectedOutputDir(synth);
      runWithoutInteractivity(config);

      const presetFiles = verifyPresetsGenerated(outputDir, 1);
      verifyPresetValidity(presetFiles[0]);
    });

    it('should randomize a specific preset with high randomness', () => {
      if (availableSynths.length === 0) {
        console.log('Skipping: No synths available');
        return;
      }

      const synth = availableSynths[0];
      const config: Config = {
        debug: false,
        synth: synth as any,
        amount: 1,
        preset: '?',
        randomness: 80,
        pattern: '/Local/*',
      };

      const outputDir = getExpectedOutputDir(synth);
      runWithoutInteractivity(config);

      const presetFiles = verifyPresetsGenerated(outputDir, 1);
      verifyPresetValidity(presetFiles[0]);
    });
  });

  describe('Preset Merging', () => {
    it('should merge two random presets', () => {
      if (availableSynths.length === 0) {
        console.log('Skipping: No synths available');
        return;
      }

      const synth = availableSynths[0];
      const config: Config = {
        debug: false,
        synth: synth as any,
        amount: 1,
        merge: ['?', '?'], // Two random presets
        pattern: '/Local/*',
      };

      const outputDir = getExpectedOutputDir(synth);
      runWithoutInteractivity(config);

      const presetFiles = verifyPresetsGenerated(outputDir, 1);
      verifyPresetValidity(presetFiles[0]);
    });

    it('should merge three random presets', () => {
      if (availableSynths.length === 0) {
        console.log('Skipping: No synths available');
        return;
      }

      const synth = availableSynths[0];
      const config: Config = {
        debug: false,
        synth: synth as any,
        amount: 1,
        merge: ['?', '?', '?'], // Three random presets
        pattern: '/Local/*',
      };

      const outputDir = getExpectedOutputDir(synth);
      runWithoutInteractivity(config);

      const presetFiles = verifyPresetsGenerated(outputDir, 1);
      verifyPresetValidity(presetFiles[0]);
    });
  });

  describe('Filtering Options', () => {
    it('should generate presets with folder filter', () => {
      if (availableSynths.length === 0) {
        console.log('Skipping: No synths available');
        return;
      }

      const synth = availableSynths[0];
      const config: Config = {
        debug: false,
        synth: synth as any,
        amount: 1,
        folder: '/Local/',
      };

      const outputDir = getExpectedOutputDir(synth);
      runWithoutInteractivity(config);

      const presetFiles = verifyPresetsGenerated(outputDir, 1);
      verifyPresetValidity(presetFiles[0]);
    });
  });
});
