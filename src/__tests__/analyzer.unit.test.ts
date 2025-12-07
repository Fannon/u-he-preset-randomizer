import { describe, expect, it } from 'bun:test';
import {
  analyzeParamsTypeAndRange,
  convertParamsModelBySection,
  getDictionaryOfNames,
  type ParamsModel,
} from '../analyzer.js';
import type { PresetLibrary } from '../presetLibrary.js';

describe('analyzer', () => {
  describe('getDictionaryOfNames', () => {
    it('should extract words and apply filtering rules', () => {
      const presetLibrary: PresetLibrary = {
        synth: 'Diva',
        rootFolder: '/test',
        userPresetsFolder: '/test',
        favorites: [],
        presets: [
          {
            filePath: '/test/preset1.h2p',
            presetName: 'Dark Ambient Wise', // Good words
            categories: [],
            meta: [],
            params: [],
          },
          {
            filePath: '/test/preset2.h2p',
            presetName: 'INIT Bass AB Lead-Sound (Warm)', // Filtered words
            categories: [],
            meta: [],
            params: [],
          },
          {
            filePath: '/test/preset3.h2p',
            presetName: 'Crystal_Bells_Synth', // Underscores + filtered
            categories: [],
            meta: [],
            params: [],
          },
        ],
      };

      const result = getDictionaryOfNames(presetLibrary);

      // Should include valid words
      expect(result).toContain('Dark');
      expect(result).toContain('Ambient');
      expect(result).toContain('Wise');
      expect(result).toContain('Crystal');

      // Should filter out: short words (≤3 chars), all-caps, common synth words, special chars
      expect(result).not.toContain('AB');
      expect(result).not.toContain('INIT');
      expect(result).not.toContain('bass');
      expect(result).not.toContain('lead');
      expect(result).not.toContain('synth');
      expect(result).not.toContain('Lead-Sound');
      expect(result).not.toContain('(Warm)');
    });
  });

  describe('analyzeParamsTypeAndRange', () => {
    it('should compute min/max/avg and detect types correctly', () => {
      const presetLibrary: PresetLibrary = {
        synth: 'Diva',
        rootFolder: '/test',
        userPresetsFolder: '/test',
        favorites: [],
        presets: [
          {
            filePath: '/test/preset1.h2p',
            presetName: 'Test1',
            categories: [],
            meta: [],
            params: [
              {
                id: 'VCO/Freq',
                key: 'Freq',
                section: 'VCO',
                value: 100,
                index: 0,
                type: 'integer',
              },
              {
                id: 'VCF/Cutoff',
                key: 'Cutoff',
                section: 'VCF',
                value: 0.5,
                index: 1,
                type: 'float',
              },
              {
                id: 'VCO/Wave',
                key: 'Wave',
                section: 'VCO',
                value: 'Saw',
                index: 2,
                type: 'string',
              },
            ],
          },
          {
            filePath: '/test/preset2.h2p',
            presetName: 'Test2',
            categories: [],
            meta: [],
            params: [
              {
                id: 'VCO/Freq',
                key: 'Freq',
                section: 'VCO',
                value: 200,
                index: 0,
                type: 'integer',
              },
              {
                id: 'VCF/Cutoff',
                key: 'Cutoff',
                section: 'VCF',
                value: 0.8,
                index: 1,
                type: 'float',
              },
              {
                id: 'VCO/Wave',
                key: 'Wave',
                section: 'VCO',
                value: 'Square',
                index: 2,
                type: 'string',
              },
            ],
          },
        ],
      };

      const result = analyzeParamsTypeAndRange(presetLibrary);

      // Integer analysis
      expect(result['VCO/Freq']?.type).toBe('integer');
      expect(result['VCO/Freq']?.minValue).toBe(100);
      expect(result['VCO/Freq']?.maxValue).toBe(200);
      expect(result['VCO/Freq']?.avgValue).toBe(150);
      expect(result['VCO/Freq']?.distinctValues).toEqual([100, 200]);

      // Float analysis
      expect(result['VCF/Cutoff']?.type).toBe('float');
      expect(result['VCF/Cutoff']?.minValue).toBeCloseTo(0.5);
      expect(result['VCF/Cutoff']?.maxValue).toBeCloseTo(0.8);
      expect(result['VCF/Cutoff']?.avgValue).toBeCloseTo(0.65);

      // String analysis (no min/max/avg)
      expect(result['VCO/Wave']?.type).toBe('string');
      expect(result['VCO/Wave']?.minValue).toBeUndefined();
      expect(result['VCO/Wave']?.distinctValues).toEqual(['Saw', 'Square']);
    });

    it('should handle type promotion correctly', () => {
      const presetLibrary: PresetLibrary = {
        synth: 'Diva',
        rootFolder: '/test',
        userPresetsFolder: '/test',
        favorites: [],
        presets: [
          {
            filePath: '/test/preset1.h2p',
            presetName: 'Test1',
            categories: [],
            meta: [],
            params: [
              {
                id: 'VCO/Value',
                key: 'Value',
                section: 'VCO',
                value: 100,
                index: 0,
                type: 'integer',
              },
            ],
          },
          {
            filePath: '/test/preset2.h2p',
            presetName: 'Test2',
            categories: [],
            meta: [],
            params: [
              {
                id: 'VCO/Value',
                key: 'Value',
                section: 'VCO',
                value: 0.5,
                index: 0,
                type: 'float',
              },
            ],
          },
          {
            filePath: '/test/preset3.h2p',
            presetName: 'Test3',
            categories: [],
            meta: [],
            params: [
              {
                id: 'VCO/Value',
                key: 'Value',
                section: 'VCO',
                value: 'Text',
                index: 0,
                type: 'string',
              },
            ],
          },
        ],
      };

      const result = analyzeParamsTypeAndRange(presetLibrary);

      // Should promote to most general type (integer -> float -> string)
      expect(result['VCO/Value']?.type).toBe('string');
    });

    it('should compact identical values to save memory', () => {
      const presetLibrary: PresetLibrary = {
        synth: 'Diva',
        rootFolder: '/test',
        userPresetsFolder: '/test',
        favorites: [],
        presets: [
          {
            filePath: '/test/preset1.h2p',
            presetName: 'Test1',
            categories: [],
            meta: [],
            params: [
              {
                id: 'VCO/Fixed',
                key: 'Fixed',
                section: 'VCO',
                value: 440,
                index: 0,
                type: 'integer',
              },
            ],
          },
          {
            filePath: '/test/preset2.h2p',
            presetName: 'Test2',
            categories: [],
            meta: [],
            params: [
              {
                id: 'VCO/Fixed',
                key: 'Fixed',
                section: 'VCO',
                value: 440,
                index: 0,
                type: 'integer',
              },
            ],
          },
        ],
      };

      const result = analyzeParamsTypeAndRange(presetLibrary);

      // Values array should be compacted when all identical
      expect(result['VCO/Fixed']?.values).toEqual([440]);
      expect(result['VCO/Fixed']?.distinctValues).toEqual([440]);
    });

    it('skips parameters that contain serialized object markers', () => {
      const presetLibrary: PresetLibrary = {
        synth: 'Diva',
        rootFolder: '/test',
        userPresetsFolder: '/test',
        favorites: [],
        presets: [
          {
            filePath: '/test/preset1.h2p',
            presetName: 'Test1',
            categories: [],
            meta: [],
            params: [
              {
                id: 'HEAD/Valid',
                key: 'Valid',
                section: 'HEAD',
                value: 10,
                index: 0,
                type: 'integer',
              },
              {
                id: '[object Object]/Broken',
                key: 'Broken',
                section: '[object Object]',
                value: 99,
                index: 1,
                type: 'integer',
              },
            ],
          },
        ],
      };

      const result = analyzeParamsTypeAndRange(presetLibrary);
      expect(result['HEAD/Valid']).toBeDefined();
      expect(result['[object Object]/Broken']).toBeUndefined();
    });
  });

  describe('convertParamsModelBySection', () => {
    it('groups params by section while discarding malformed IDs', () => {
      const paramsModel: ParamsModel = {
        'HEAD/Valid': {
          type: 'integer',
          values: [1, 2],
          distinctValues: [1, 2],
          maxValue: 2,
          minValue: 1,
          avgValue: 1.5,
        },
        '/Broken': {
          type: 'integer',
          values: [5],
          distinctValues: [5],
          maxValue: 5,
          minValue: 5,
          avgValue: 5,
        },
      };

      const result = convertParamsModelBySection(paramsModel);
      expect(result.HEAD).toBeDefined();
      expect(result.HEAD?.['HEAD/Valid']).toBe(paramsModel['HEAD/Valid']);
      expect(result['']).toBeUndefined();
    });
  });
});
