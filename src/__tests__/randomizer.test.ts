import type { Config } from '../config.js';
import type { ParamsModel } from '../analyzer.js';
import type { Preset } from '../parser.js';
import {
  calculateRandomMergeRatios,
  getPresetDescriptionSuffix,
  randomizePreset,
} from '../randomizer.js';

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
});
