import {
  analyzeParamsTypeAndRange,
  getDictionaryOfNames,
  convertParamsModelBySection,
  average,
  type ParamsModel,
} from '../src/analyzer.js';
import type { PresetLibrary } from '../src/presetLibrary.js';

describe('analyzer', () => {
  describe('average', () => {
    it('should calculate average of positive numbers', () => {
      expect(average([1, 2, 3, 4, 5])).toBe(3);
      expect(average([10, 20, 30])).toBe(20);
    });

    it('should calculate average of negative numbers', () => {
      expect(average([-1, -2, -3])).toBe(-2);
    });

    it('should calculate average of mixed numbers', () => {
      expect(average([-10, 0, 10])).toBe(0);
    });

    it('should calculate average of floats', () => {
      expect(average([1.5, 2.5, 3.5])).toBeCloseTo(2.5);
    });

    it('should handle single value', () => {
      expect(average([42])).toBe(42);
    });

    it('should handle zeros', () => {
      expect(average([0, 0, 0])).toBe(0);
    });
  });

  describe('getDictionaryOfNames', () => {
    it('should extract words from preset names', () => {
      const presetLibrary: PresetLibrary = {
        synth: 'Diva',
        rootFolder: '/test',
        userPresetsFolder: '/test',
        favorites: [],
        presets: [
          {
            filePath: '/test/preset1.h2p',
            presetName: 'Dark Ambient Bass',
            categories: [],
            meta: [],
            params: [],
          },
          {
            filePath: '/test/preset2.h2p',
            presetName: 'Bright Crystal Lead',
            categories: [],
            meta: [],
            params: [],
          },
        ],
      };

      const result = getDictionaryOfNames(presetLibrary);

      expect(result).toContain('Dark');
      expect(result).toContain('Ambient');
      expect(result).toContain('Bright');
      expect(result).toContain('Crystal');
    });

    it('should filter out excluded words', () => {
      const presetLibrary: PresetLibrary = {
        synth: 'Diva',
        rootFolder: '/test',
        userPresetsFolder: '/test',
        favorites: [],
        presets: [
          {
            filePath: '/test/preset1.h2p',
            presetName: 'Bass Lead Piano Guitar',
            categories: [],
            meta: [],
            params: [],
          },
        ],
      };

      const result = getDictionaryOfNames(presetLibrary);

      expect(result).not.toContain('bass');
      expect(result).not.toContain('lead');
      expect(result).not.toContain('piano');
      expect(result).not.toContain('guitar');
    });

    it('should filter out short words (3 chars or less)', () => {
      const presetLibrary: PresetLibrary = {
        synth: 'Diva',
        rootFolder: '/test',
        userPresetsFolder: '/test',
        favorites: [],
        presets: [
          {
            filePath: '/test/preset1.h2p',
            presetName: 'A Big Wide Sound',
            categories: [],
            meta: [],
            params: [],
          },
        ],
      };

      const result = getDictionaryOfNames(presetLibrary);

      expect(result).not.toContain('A');
      expect(result).not.toContain('Big');
      expect(result).toContain('Wide');
      expect(result).toContain('Sound');
    });

    it('should filter out all-uppercase words', () => {
      const presetLibrary: PresetLibrary = {
        synth: 'Diva',
        rootFolder: '/test',
        userPresetsFolder: '/test',
        favorites: [],
        presets: [
          {
            filePath: '/test/preset1.h2p',
            presetName: 'INIT Deep Warm',
            categories: [],
            meta: [],
            params: [],
          },
        ],
      };

      const result = getDictionaryOfNames(presetLibrary);

      expect(result).not.toContain('INIT');
      expect(result).toContain('Deep');
      expect(result).toContain('Warm');
    });

    it('should filter out words with special characters', () => {
      const presetLibrary: PresetLibrary = {
        synth: 'Diva',
        rootFolder: '/test',
        userPresetsFolder: '/test',
        favorites: [],
        presets: [
          {
            filePath: '/test/preset1.h2p',
            presetName: 'TestWord NameWord (Warm) Nice-Sound',
            categories: [],
            meta: [],
            params: [],
          },
        ],
      };

      const result = getDictionaryOfNames(presetLibrary);

      expect(result).toContain('TestWord');
      expect(result).toContain('NameWord');
      expect(result).not.toContain('TestWord-NameWord');
      expect(result).not.toContain('(Warm)');
      expect(result).not.toContain('Nice-Sound');
    });

    it('should handle underscores in names', () => {
      const presetLibrary: PresetLibrary = {
        synth: 'Diva',
        rootFolder: '/test',
        userPresetsFolder: '/test',
        favorites: [],
        presets: [
          {
            filePath: '/test/preset1.h2p',
            presetName: 'Dark_Ambient_Sound',
            categories: [],
            meta: [],
            params: [],
          },
        ],
      };

      const result = getDictionaryOfNames(presetLibrary);

      expect(result).toContain('Dark');
      expect(result).toContain('Ambient');
      expect(result).toContain('Sound');
    });
  });

  describe('analyzeParamsTypeAndRange', () => {
    it('should analyze integer parameters', () => {
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
              { id: 'VCO/Freq', key: 'Freq', section: 'VCO', value: 100, index: 0, type: 'integer' },
            ],
          },
          {
            filePath: '/test/preset2.h2p',
            presetName: 'Test2',
            categories: [],
            meta: [],
            params: [
              { id: 'VCO/Freq', key: 'Freq', section: 'VCO', value: 200, index: 0, type: 'integer' },
            ],
          },
        ],
      };

      const result = analyzeParamsTypeAndRange(presetLibrary);

      expect(result['VCO/Freq']).toBeDefined();
      expect(result['VCO/Freq'].type).toBe('integer');
      expect(result['VCO/Freq'].minValue).toBe(100);
      expect(result['VCO/Freq'].maxValue).toBe(200);
      expect(result['VCO/Freq'].avgValue).toBe(150);
      expect(result['VCO/Freq'].values).toEqual([100, 200]);
      expect(result['VCO/Freq'].distinctValues).toEqual([100, 200]);
    });

    it('should analyze float parameters', () => {
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
              { id: 'VCF/Cutoff', key: 'Cutoff', section: 'VCF', value: 0.5, index: 0, type: 'float' },
            ],
          },
          {
            filePath: '/test/preset2.h2p',
            presetName: 'Test2',
            categories: [],
            meta: [],
            params: [
              { id: 'VCF/Cutoff', key: 'Cutoff', section: 'VCF', value: 0.8, index: 0, type: 'float' },
            ],
          },
        ],
      };

      const result = analyzeParamsTypeAndRange(presetLibrary);

      expect(result['VCF/Cutoff'].type).toBe('float');
      expect(result['VCF/Cutoff'].minValue).toBeCloseTo(0.5);
      expect(result['VCF/Cutoff'].maxValue).toBeCloseTo(0.8);
      expect(result['VCF/Cutoff'].avgValue).toBeCloseTo(0.65);
    });

    it('should analyze string parameters', () => {
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
              { id: 'VCO/Wave', key: 'Wave', section: 'VCO', value: 'Saw', index: 0, type: 'string' },
            ],
          },
          {
            filePath: '/test/preset2.h2p',
            presetName: 'Test2',
            categories: [],
            meta: [],
            params: [
              { id: 'VCO/Wave', key: 'Wave', section: 'VCO', value: 'Square', index: 0, type: 'string' },
            ],
          },
        ],
      };

      const result = analyzeParamsTypeAndRange(presetLibrary);

      expect(result['VCO/Wave'].type).toBe('string');
      expect(result['VCO/Wave'].minValue).toBeUndefined();
      expect(result['VCO/Wave'].maxValue).toBeUndefined();
      expect(result['VCO/Wave'].distinctValues).toEqual(['Saw', 'Square']);
    });

    it('should compact values array when all values are identical', () => {
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
              { id: 'VCO/Mode', key: 'Mode', section: 'VCO', value: 'Poly', index: 0, type: 'string' },
            ],
          },
          {
            filePath: '/test/preset2.h2p',
            presetName: 'Test2',
            categories: [],
            meta: [],
            params: [
              { id: 'VCO/Mode', key: 'Mode', section: 'VCO', value: 'Poly', index: 0, type: 'string' },
            ],
          },
        ],
      };

      const result = analyzeParamsTypeAndRange(presetLibrary);

      expect(result['VCO/Mode'].values).toEqual(['Poly']);
      expect(result['VCO/Mode'].distinctValues).toEqual(['Poly']);
    });

    it('should handle type promotion from integer to float', () => {
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
              { id: 'VCO/Value', key: 'Value', section: 'VCO', value: 100, index: 0, type: 'integer' },
            ],
          },
          {
            filePath: '/test/preset2.h2p',
            presetName: 'Test2',
            categories: [],
            meta: [],
            params: [
              { id: 'VCO/Value', key: 'Value', section: 'VCO', value: 0.5, index: 0, type: 'float' },
            ],
          },
        ],
      };

      const result = analyzeParamsTypeAndRange(presetLibrary);

      expect(result['VCO/Value'].type).toBe('float');
    });

    it('should handle type promotion from float to string', () => {
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
              { id: 'VCO/Value', key: 'Value', section: 'VCO', value: 0.5, index: 0, type: 'float' },
            ],
          },
          {
            filePath: '/test/preset2.h2p',
            presetName: 'Test2',
            categories: [],
            meta: [],
            params: [
              { id: 'VCO/Value', key: 'Value', section: 'VCO', value: 'Text', index: 0, type: 'string' },
            ],
          },
        ],
      };

      const result = analyzeParamsTypeAndRange(presetLibrary);

      expect(result['VCO/Value'].type).toBe('string');
    });

    it('should mark special parameters for stability', () => {
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
              { id: 'VCC/Trsp', key: 'Trsp', section: 'VCC', value: 0, index: 0, type: 'integer' },
              { id: 'VCC/FTun', key: 'FTun', section: 'VCC', value: 0, index: 1, type: 'integer' },
            ],
          },
        ],
      };

      const result = analyzeParamsTypeAndRange(presetLibrary);

      expect(result['VCC/Trsp'].keepStable).toBe('always');
      expect(result['VCC/FTun'].keepStable).toBe('always');
    });

    it('should ignore broken presets with [object Object]', () => {
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
              { id: '[object Object]', key: 'Param', section: 'VCO', value: 100, index: 0, type: 'integer' },
              { id: 'VCO/Valid', key: 'Valid', section: 'VCO', value: 100, index: 1, type: 'integer' },
            ],
          },
        ],
      };

      const result = analyzeParamsTypeAndRange(presetLibrary);

      expect(result['[object Object]']).toBeUndefined();
      expect(result['VCO/Valid']).toBeDefined();
    });
  });

  describe('convertParamsModelBySection', () => {
    it('should organize params by section', () => {
      const paramsModel: ParamsModel = {
        'VCO/Freq': {
          type: 'integer',
          values: [100, 200],
          distinctValues: [100, 200],
          minValue: 100,
          maxValue: 200,
          avgValue: 150,
        },
        'VCO/Wave': {
          type: 'string',
          values: ['Saw', 'Square'],
          distinctValues: ['Saw', 'Square'],
        },
        'VCF/Cutoff': {
          type: 'float',
          values: [0.5, 0.8],
          distinctValues: [0.5, 0.8],
          minValue: 0.5,
          maxValue: 0.8,
          avgValue: 0.65,
        },
      };

      const result = convertParamsModelBySection(paramsModel);

      expect(result).toHaveProperty('VCO');
      expect(result).toHaveProperty('VCF');
      expect(result.VCO).toHaveProperty('VCO/Freq');
      expect(result.VCO).toHaveProperty('VCO/Wave');
      expect(result.VCF).toHaveProperty('VCF/Cutoff');
    });

    it('should handle HEAD section', () => {
      const paramsModel: ParamsModel = {
        'HEAD/Master': {
          type: 'float',
          values: [0.8],
          distinctValues: [0.8],
        },
      };

      const result = convertParamsModelBySection(paramsModel);

      expect(result).toHaveProperty('HEAD');
      expect(result.HEAD).toHaveProperty('HEAD/Master');
    });

    it('should handle multiple params in same section', () => {
      const paramsModel: ParamsModel = {
        'VCO/Param1': {
          type: 'integer',
          values: [1],
          distinctValues: [1],
        },
        'VCO/Param2': {
          type: 'integer',
          values: [2],
          distinctValues: [2],
        },
        'VCO/Param3': {
          type: 'integer',
          values: [3],
          distinctValues: [3],
        },
      };

      const result = convertParamsModelBySection(paramsModel);

      expect(Object.keys(result.VCO)).toHaveLength(3);
    });
  });
});
