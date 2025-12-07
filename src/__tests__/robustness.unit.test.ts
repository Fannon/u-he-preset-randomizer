/**
 * Unit tests for robustness and error handling.
 * Verifies that functions handle invalid inputs, edge cases, and incompatibilities gracefully.
 */

import { describe, expect, it, jest, afterAll } from 'bun:test';
import { validateMergeCompatibility } from '../randomizer.js';
import { getPresetMetadata, parseUhePreset } from '../parser.js';
import type { Preset } from '../parser.js';

describe('Robustness Tests', () => {
  describe('randomizer.ts - validateMergeCompatibility', () => {
    // Mock console.error and console.warn to keep test output clean
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    afterAll(() => {
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should throw Error (not process.exit) when presets are incompatible', () => {
      const presetA: Preset = {
        filePath: 'A.h2p',
        presetName: 'PresetA',
        categories: [],
        meta: [],
        params: [
          { id: 'Vol', key: 'Vol', section: 'Main', value: 1, index: 0, type: 'integer' },
          { id: 'Pan', key: 'Pan', section: 'Main', value: 0, index: 1, type: 'integer' },
        ],
      };

      const presetB: Preset = {
        filePath: 'B.h2p',
        presetName: 'PresetB',
        categories: [],
        meta: [],
        params: [
          // Different params, < 50% overlap
          { id: 'Cutoff', key: 'Cutoff', section: 'Filter', value: 100, index: 0, type: 'integer' },
          { id: 'Res', key: 'Res', section: 'Filter', value: 50, index: 1, type: 'integer' },
        ],
      };

      expect(() => {
        validateMergeCompatibility([presetA, presetB]);
      }).toThrow('Presets are incompatible');
    });

    it('should not throw when presets are compatible', () => {
      const presetA: Preset = {
        filePath: 'A.h2p',
        presetName: 'PresetA',
        categories: [],
        meta: [],
        params: [
          { id: 'Vol', key: 'Vol', section: 'Main', value: 1, index: 0, type: 'integer' },
          { id: 'Pan', key: 'Pan', section: 'Main', value: 0, index: 1, type: 'integer' },
        ],
      };

      const presetB: Preset = {
        filePath: 'B.h2p',
        presetName: 'PresetB',
        categories: [],
        meta: [],
        params: [
          { id: 'Vol', key: 'Vol', section: 'Main', value: 0.8, index: 0, type: 'integer' },
          { id: 'Pan', key: 'Pan', section: 'Main', value: 0.2, index: 1, type: 'integer' },
        ],
      };

      expect(() => {
        validateMergeCompatibility([presetA, presetB]);
      }).not.toThrow();
    });

    it('should warn when compatibility is low but acceptable (50-80%)', () => {
      consoleWarnSpy.mockClear();

      const presetA: Preset = {
        filePath: 'A.h2p',
        presetName: 'PresetA',
        categories: [],
        meta: [],
        params: [
          { id: 'P1', key: 'P1', section: 'M', value: 1, index: 0, type: 'integer' },
          { id: 'P2', key: 'P2', section: 'M', value: 1, index: 1, type: 'integer' },
          { id: 'P3', key: 'P3', section: 'M', value: 1, index: 2, type: 'integer' },
          { id: 'P4', key: 'P4', section: 'M', value: 1, index: 3, type: 'integer' },
        ],
      };

      const presetB: Preset = {
        filePath: 'B.h2p',
        presetName: 'PresetB',
        categories: [],
        meta: [],
        params: [
          { id: 'P1', key: 'P1', section: 'M', value: 1, index: 0, type: 'integer' },
          { id: 'P2', key: 'P2', section: 'M', value: 1, index: 1, type: 'integer' },
          // P3, P4 missing (2/4 = 50% overlap)
        ],
      };

      validateMergeCompatibility([presetA, presetB]);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Presets may be incompatible for merging')
      );
    });
  });

  describe('parser.ts - Malformed Inputs', () => {
    it('getPresetMetadata should handle files without Meta header', () => {
      const fileString = `
Param1=100
Param2=200
`;
      const metadata = getPresetMetadata(fileString);
      expect(metadata).toEqual([]);
    });

    it('getPresetMetadata should handle malformed Meta header', () => {
      // Missing closing */ or weirdly formatted
      const fileString = `/*@Meta
Author:
'Missing Value'
/*
Param=1`;

      // Should barely survive, might return weird data but shouldn't crash
      expect(() => getPresetMetadata(fileString)).not.toThrow();
    });

    it('parseUhePreset should handle empty file strings gracefully', () => {
      const parsed = parseUhePreset('', 'empty.h2p', false);
      expect(parsed.params).toEqual([]);
      expect(parsed.meta).toEqual([]);
    });

    it('parseUhePreset should handle file with only comments', () => {
      const parsed = parseUhePreset('// This is just a comment\n// Another comment', 'params.h2p', false);
      expect(parsed.params).toEqual([]);
    });

    it('parseUhePreset should not crash on severely malformed file', () => {
       const malformed = 'INVALID_CONTENT_#$%@#$';
       const parsed = parseUhePreset(malformed, 'malformed.h2p', false);
       expect(parsed.params).toHaveLength(0); // If it can't parse params, it returns empty array
    });
  });
});
