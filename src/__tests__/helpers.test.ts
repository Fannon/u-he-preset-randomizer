/**
 * Unit tests for pure helper functions across the codebase.
 * These tests cover small utility functions that are side-effect free.
 */

import { describe, expect, it } from '@jest/globals';
import { isInt, isNumeric, getPresetBinarySection } from '../parser.js';
import { average } from '../analyzer.js';
import { getRandomArrayItem, getRandomValue, calculateRandomMergeRatios } from '../randomizer.js';
import type { ParamsModel } from '../analyzer.js';

describe('parser helpers', () => {
  describe('isInt', () => {
    it('should return true for valid integers', () => {
      expect(isInt(0)).toBe(true);
      expect(isInt(1)).toBe(true);
      expect(isInt(-1)).toBe(true);
      expect(isInt(100)).toBe(true);
      expect(isInt(-999)).toBe(true);
    });

    it('should return true for integer strings', () => {
      expect(isInt('0')).toBe(true);
      expect(isInt('42')).toBe(true);
      expect(isInt('-100')).toBe(true);
    });

    it('should return false for floats', () => {
      expect(isInt(0.5)).toBe(false);
      expect(isInt(3.14)).toBe(false);
      expect(isInt(-2.7)).toBe(false);
      expect(isInt('0.5')).toBe(false);
    });

    it('should return false for non-numeric values', () => {
      expect(isInt('abc')).toBe(false);
      expect(isInt('')).toBe(false);
      expect(isInt(null)).toBe(false);
      expect(isInt(undefined)).toBe(false);
      expect(isInt({})).toBe(false);
      expect(isInt([])).toBe(false);
    });

    it('should handle edge cases', () => {
      // Now properly handles all JavaScript integers
      expect(isInt(2147483647)).toBe(true); // Max 32-bit signed int
      expect(isInt(-2147483648)).toBe(true); // Min 32-bit signed int
      expect(isInt(Number.MAX_SAFE_INTEGER)).toBe(true); // Large integers work now
      expect(isInt(Number.MIN_SAFE_INTEGER)).toBe(true);
      // Very large floats that look like integers
      expect(isInt(1.0)).toBe(true);
      expect(isInt(-0)).toBe(true);
    });
  });

  describe('isNumeric', () => {
    it('should return true for valid numbers', () => {
      expect(isNumeric(0)).toBe(true);
      expect(isNumeric(42)).toBe(true);
      expect(isNumeric(-100)).toBe(true);
      expect(isNumeric(3.14)).toBe(true);
      expect(isNumeric(-0.5)).toBe(true);
    });

    it('should return true for numeric strings', () => {
      expect(isNumeric('0')).toBe(true);
      expect(isNumeric('42')).toBe(true);
      expect(isNumeric('-100')).toBe(true);
      expect(isNumeric('3.14')).toBe(true);
      expect(isNumeric('-0.5')).toBe(true);
    });

    it('should return false for non-numeric values', () => {
      expect(isNumeric('abc')).toBe(false);
      expect(isNumeric('')).toBe(false);
      expect(isNumeric('NaN')).toBe(false);
    });

    it('should handle infinity correctly', () => {
      expect(isNumeric(Number.POSITIVE_INFINITY)).toBe(false);
      expect(isNumeric(Number.NEGATIVE_INFINITY)).toBe(false);
      expect(isNumeric('Infinity')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isNumeric('1e10')).toBe(true); // Scientific notation
      expect(isNumeric('  42  ')).toBe(true); // Whitespace trimmed by parseFloat
      expect(isNumeric('42px')).toBe(true); // parseFloat extracts leading number
    });
  });

  describe('getPresetBinarySection', () => {
    it('should extract binary section from preset file', () => {
      const fileString = `/*@Meta
Author:
'Test'
*/

Param=1

// Section for ugly compressed binary Data
// DON'T TOUCH THIS

SomeBinaryData==123ABC`;

      const result = getPresetBinarySection(fileString);
      expect(result).toBe('SomeBinaryData==123ABC');
    });

    it('should return empty string when no binary section exists', () => {
      const fileString = `/*@Meta
Author:
'Test'
*/

Param=1`;

      const result = getPresetBinarySection(fileString);
      expect(result).toBe('');
    });

    it('should trim whitespace from binary section', () => {
      const fileString = `/*@Meta
*/

// Section for ugly compressed binary Data
// DON'T TOUCH THIS

   BinaryContent

`;

      const result = getPresetBinarySection(fileString);
      expect(result).toBe('BinaryContent');
    });

    it('should handle empty file', () => {
      expect(getPresetBinarySection('')).toBe('');
    });
  });
});

describe('analyzer helpers', () => {
  describe('average', () => {
    it('should calculate average of positive numbers', () => {
      expect(average([1, 2, 3, 4, 5])).toBe(3);
      expect(average([10, 20, 30])).toBe(20);
      expect(average([100])).toBe(100);
    });

    it('should calculate average with negative numbers', () => {
      expect(average([-1, 0, 1])).toBe(0);
      expect(average([-10, -5, 0, 5, 10])).toBe(0);
    });

    it('should handle floating point numbers', () => {
      expect(average([0.1, 0.2, 0.3])).toBeCloseTo(0.2, 10);
      expect(average([1.5, 2.5])).toBe(2);
    });

    it('should handle single element array', () => {
      expect(average([42])).toBe(42);
      expect(average([0])).toBe(0);
    });

    it('should return 0 for empty array', () => {
      expect(average([])).toBe(0);
    });
  });
});

describe('randomizer helpers', () => {
  describe('getRandomArrayItem', () => {
    it('should return an item from the array', () => {
      const items = ['a', 'b', 'c', 'd', 'e'];

      // Run multiple times to ensure we get valid results
      for (let i = 0; i < 20; i++) {
        const result = getRandomArrayItem(items);
        expect(items).toContain(result);
      }
    });

    it('should return the only item from single-element array', () => {
      expect(getRandomArrayItem(['only'])).toBe('only');
      expect(getRandomArrayItem([42])).toBe(42);
    });

    it('should return undefined for empty array', () => {
      expect(getRandomArrayItem([])).toBeUndefined();
    });

    it('should work with different types', () => {
      expect([1, 2, 3]).toContain(getRandomArrayItem([1, 2, 3]));
      expect([true, false]).toContain(getRandomArrayItem([true, false]));
      expect([null]).toContain(getRandomArrayItem([null]));
    });
  });

  describe('getRandomValue (uniform distribution)', () => {
    it('should return value from parameter model values', () => {
      const paramEntry: ParamsModel[string] = {
        type: 'integer',
        values: [10, 20, 30, 40, 50],
        distinctValues: [10, 20, 30, 40, 50],
      };

      for (let i = 0; i < 20; i++) {
        const result = getRandomValue(paramEntry, false);
        expect(paramEntry.values).toContain(result);
      }
    });

    it('should return undefined for empty values', () => {
      const paramEntry: ParamsModel[string] = {
        type: 'integer',
        values: [],
        distinctValues: [],
      };

      expect(getRandomValue(paramEntry, false)).toBeUndefined();
    });

    it('should return the only value for single-value param', () => {
      const paramEntry: ParamsModel[string] = {
        type: 'float',
        values: [0.75],
        distinctValues: [0.75],
      };

      expect(getRandomValue(paramEntry, false)).toBe(0.75);
    });

    it('should handle string type values', () => {
      const paramEntry: ParamsModel[string] = {
        type: 'string',
        values: ['Saw', 'Square', 'Sine'],
        distinctValues: ['Saw', 'Square', 'Sine'],
      };

      for (let i = 0; i < 10; i++) {
        const result = getRandomValue(paramEntry, false);
        expect(['Saw', 'Square', 'Sine']).toContain(result);
      }
    });
  });

  describe('getRandomValue (frequency-weighted distribution)', () => {
    it('should respect frequency weights when selecting values', () => {
      // Create a heavily skewed distribution
      const paramEntry: ParamsModel[string] = {
        type: 'integer',
        values: [1, 2],
        distinctValues: [1, 2],
        frequencies: {
          '1': 1,     // 1% chance
          '2': 99,    // 99% chance
        },
      };

      let countOf2 = 0;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const result = getRandomValue(paramEntry, true);
        if (result === 2) countOf2++;
      }

      // With 99% probability, we expect mostly 2s (at least 70% to be safe)
      expect(countOf2).toBeGreaterThan(iterations * 0.7);
    });

    it('should fall back to uniform distribution if frequencies not available', () => {
      const paramEntry: ParamsModel[string] = {
        type: 'integer',
        values: [1, 2, 3],
        distinctValues: [1, 2, 3],
        // No frequencies provided
      };

      for (let i = 0; i < 10; i++) {
        const result = getRandomValue(paramEntry, true);
        expect([1, 2, 3]).toContain(result);
      }
    });
  });

  describe('calculateRandomMergeRatios', () => {
    it('should always sum to exactly 1.0 for various preset counts', () => {
      for (let count = 1; count <= 10; count++) {
        const ratios = calculateRandomMergeRatios(count);

        expect(ratios).toHaveLength(count);

        const sum = ratios.reduce((acc, val) => acc + val, 0);
        expect(sum).toBeCloseTo(1.0, 10);
      }
    });

    it('should produce positive ratios only', () => {
      for (let i = 0; i < 20; i++) {
        const ratios = calculateRandomMergeRatios(5);
        ratios.forEach((ratio) => {
          expect(ratio).toBeGreaterThan(0);
          expect(ratio).toBeLessThanOrEqual(1);
        });
      }
    });

    it('should return [1.0] for single preset', () => {
      // Edge case: merging one preset
      const ratios = calculateRandomMergeRatios(1);
      expect(ratios).toHaveLength(1);
      expect(ratios[0]).toBeCloseTo(1.0, 10);
    });

    it('should produce varied ratios across multiple calls', () => {
      // Verify randomness: ratios should vary between calls
      const firstRatios = calculateRandomMergeRatios(3);
      const secondRatios = calculateRandomMergeRatios(3);

      // Very unlikely to be exactly equal
      const areEqual = firstRatios.every(
        (r, i) => Math.abs(r - secondRatios[i]!) < 0.0001
      );
      expect(areEqual).toBe(false);
    });
  });
});
