import { describe, expect, it } from 'bun:test';
import type { Config } from '../config.js';
import type { ParamsModel } from '../analyzer.js';
import type { Preset } from '../parser.js';
import {
  calculateRandomMergeRatios,
  generateFullyRandomPresets,
  getPresetDescriptionSuffix,
  randomizePreset,
} from '../randomizer.js';
import type { PresetLibrary } from '../presetLibrary.js';

describe('randomizer', () => {
  describe('calculateRandomMergeRatios', () => {
    it('should generate ratios that always sum to exactly 1.0', () => {
      // Test multiple times to ensure mathematical invariant holds
      for (let presetCount = 1; presetCount <= 10; presetCount++) {
        for (let iteration = 0; iteration < 10; iteration++) {
          const ratios = calculateRandomMergeRatios(presetCount);

          expect(ratios).toHaveLength(presetCount);

          const sum = ratios.reduce((acc, val) => acc + val, 0);
          expect(sum).toBeCloseTo(1.0, 10);

          // All ratios should be positive and <= 1
          ratios.forEach((ratio) => {
            expect(ratio).toBeGreaterThan(0);
            expect(ratio).toBeLessThanOrEqual(1);
          });
        }
      }
    });

    it('should never produce zero or negative ratios', () => {
      for (let i = 0; i < 20; i++) {
        const ratios = calculateRandomMergeRatios(5);
        ratios.forEach((ratio) => {
          expect(ratio).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('randomizePreset', () => {
    const numericPreset: Preset = {
      filePath: '/Local/Init.h2p',
      presetName: 'Init',
      categories: [],
      meta: [],
      params: [
        {
          id: 'HEAD/Param',
          key: 'Param',
          section: 'HEAD',
          value: 0,
          index: 0,
          type: 'integer',
        },
      ],
    };

    it('applies randomness ratio to numeric parameters', () => {
      const paramsModel: ParamsModel = {
        'HEAD/Param': {
          type: 'integer',
          values: [100],
          distinctValues: [0, 100],
          maxValue: 100,
          minValue: 0,
          avgValue: 50,
        },
      };

      const config: Config = {
        debug: false,
        randomness: 50,
      };

      const result = randomizePreset(numericPreset, paramsModel, config);
      expect(result.params[0]?.value).toBe(50);
    });

    it('keeps parameters stable when marked keepStable=always', () => {
      const paramsModel: ParamsModel = {
        'HEAD/Param': {
          type: 'float',
          values: [0.9],
          distinctValues: [0.1, 0.9],
          maxValue: 0.9,
          minValue: 0.1,
          avgValue: 0.5,
          keepStable: 'always',
        },
      };

      const config: Config = {
        debug: false,
        randomness: 100,
      };

      const result = randomizePreset(
        {
          ...numericPreset,
          params: [
            {
              ...numericPreset.params[0]!,
              type: 'float',
              value: 0.1,
            },
          ],
        },
        paramsModel,
        config,
      );

      expect(result.params[0]?.value).toBe(0.1);
    });

    it('skips string parameters in stable mode when distinct values are small', () => {
      const preset: Preset = {
        filePath: '/Local/Init.h2p',
        presetName: 'Init',
        categories: [],
        meta: [],
        params: [
          {
            id: 'HEAD/Mode',
            key: 'Mode',
            section: 'HEAD',
            value: 'Warm',
            index: 0,
            type: 'string',
          },
        ],
      };

      const paramsModel: ParamsModel = {
        'HEAD/Mode': {
          type: 'string',
          values: ['Cold'],
          distinctValues: ['Warm', 'Cold'],
        },
      };

      const result = randomizePreset(preset, paramsModel, {
        debug: false,
        randomness: 80,
        stable: true,
      });

      expect(result.params[0]?.value).toBe('Warm');
    });
  });

  describe('getPresetDescriptionSuffix', () => {
    it('adds repository reference and category context', () => {
      const suffix = getPresetDescriptionSuffix({ debug: false, category: 'Pads' });
      expect(suffix).toContain('https://github.com/Fannon/u-he-preset-randomizer');
      expect(suffix).toContain('Based on presets of category: Pads.');
    });
  });

  describe('numeric parameter randomization', () => {
    it('properly applies randomness ratio to numeric parameters', () => {
      // Regression test to ensure numeric parameters are properly randomized
      // This indirectly tests the variable shadowing fix at randomizer.ts:372

      const preset1: Preset = {
        filePath: '/Local/Preset1.h2p',
        presetName: 'Preset1',
        categories: [],
        meta: [],
        params: [
          {
            id: 'HEAD/Volume',
            key: 'Volume',
            section: 'HEAD',
            value: 0,
            index: 0,
            type: 'integer',
          },
          {
            id: 'HEAD/Cutoff',
            key: 'Cutoff',
            section: 'HEAD',
            value: 0.0,
            index: 1,
            type: 'float',
          },
        ],
      };

      const paramsModel: ParamsModel = {
        'HEAD/Volume': {
          type: 'integer',
          values: [100], // Only one value to make test deterministic
          distinctValues: [0, 100],
          maxValue: 100,
          minValue: 0,
          avgValue: 50,
        },
        'HEAD/Cutoff': {
          type: 'float',
          values: [1.0], // Only one value to make test deterministic
          distinctValues: [0.0, 1.0],
          maxValue: 1.0,
          minValue: 0.0,
          avgValue: 0.5,
        },
      };

      const config: Config = {
        debug: false,
        randomness: 60, // 60% randomness, 40% stability
      };

      // Apply randomization
      const result = randomizePreset(preset1, paramsModel, config);

      // With randomness=60 and picking value 100:
      // newValue = oldValue * (1-0.6) + randomValue * 0.6
      //          = 0 * 0.4 + 100 * 0.6 = 60
      expect(result.params[0]?.value).toBe(60);

      // For float with value 1.0:
      // newValue = 0.0 * 0.4 + 1.0 * 0.6 = 0.6
      expect(result.params[1]?.value).toBe(0.6);
    });
  });
  describe('generateFullyRandomPresets with Binary Randomization', () => {
    const mockPreset: Preset = {
      filePath: '/Local/Init.h2p',
      presetName: 'Init',
      categories: [],
      meta: [],
      params: [],
      binary: 'BINARY_DATA_1',
    };

    const mockPresetWithBinary2: Preset = {
      filePath: '/Local/Other.h2p',
      presetName: 'Other',
      categories: [],
      meta: [],
      params: [],
      binary: 'BINARY_DATA_2',
    };

    const mockLibrary: PresetLibrary = {
      synth: 'Zebra2',
      rootFolder: '/test',
      userPresetsFolder: '/test/User',
      presets: [mockPreset, mockPresetWithBinary2],
      favorites: [],
    };

    const mockParamsModel: ParamsModel = {
      ID1: {
        type: 'integer',
        values: [1],
        distinctValues: [1],
        frequencies: { '1': 1 },
        maxValue: 1,
        minValue: 1,
        avgValue: 1,
      },
      ID2: {
        type: 'integer',
        values: [2],
        distinctValues: [2],
        frequencies: { '2': 1 },
        maxValue: 2,
        minValue: 2,
        avgValue: 2,
      },
    };

    it('should randomize binary section when config.binary is true', () => {
      const config: Config = {
        debug: false,
        binary: true,
        amount: 20,
        stable: false,
      };

      const result = generateFullyRandomPresets(
        mockLibrary,
        mockParamsModel,
        config,
      );

      const binaries = result.presets.map((p) => p.binary);
      // We expect to see both binaries eventually
      expect(binaries).toContain('BINARY_DATA_1');
      expect(binaries).toContain('BINARY_DATA_2');
    });

    it('should explicitly decouple binary section from base preset', () => {
      const preset1: Preset = {
        ...mockPreset,
        binary: 'BIN1',
        params: [
          {
            id: 'ID1',
            key: 'K',
            section: 'S',
            value: 1,
            index: 0,
            type: 'integer',
          },
        ],
      };
      const preset2: Preset = {
        ...mockPresetWithBinary2,
        binary: 'BIN2',
        params: [
          {
            id: 'ID2',
            key: 'K',
            section: 'S',
            value: 2,
            index: 0,
            type: 'integer',
          },
        ],
      };

      const lib: PresetLibrary = {
        ...mockLibrary,
        presets: [preset1, preset2],
      };

      const config: Config = {
        debug: false,
        binary: true,
        amount: 200,
        stable: true,
      };

      const result = generateFullyRandomPresets(lib, mockParamsModel, config);

      let decoupledCount = 0;
      for (const p of result.presets) {
        // If we identify base preset1 (by ID1 params) but it has BIN2 binary, it's decoupled
        // Note: param names/ids are preserved
        const hasID1 = p.params.some((param) => param.id === 'ID1');
        const hasID2 = p.params.some((param) => param.id === 'ID2');

        if (hasID1 && p.binary === 'BIN2') decoupledCount++;
        if (hasID2 && p.binary === 'BIN1') decoupledCount++;
      }

      expect(decoupledCount).toBeGreaterThan(0);
    });
  });
});
