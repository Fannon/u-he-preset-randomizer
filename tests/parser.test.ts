import {
  parseUhePreset,
  getPresetMetadata,
  getPresetParams,
  serializePresetToFile,
  isValidPreset,
  type Preset,
} from '../src/parser.js';

describe('parser', () => {
  describe('getPresetMetadata', () => {
    it('should parse metadata with various value types', () => {
      const fileString = `/*@Meta

Author:
'Test Author'

Description:
'Test description'

Categories:
'Bass, Lead, Synth'

*/`;

      const result = getPresetMetadata(fileString);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ key: 'Author', value: 'Test Author' });
      expect(result[1]).toEqual({ key: 'Description', value: 'Test description' });
      expect(result[2]).toEqual({ key: 'Categories', value: ['Bass', 'Lead', 'Synth'] });
    });

    it('should handle both @Meta and @meta tags', () => {
      const fileString = `/*@meta

Author:
'Test'

*/`;

      const result = getPresetMetadata(fileString);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ key: 'Author', value: 'Test' });
    });
  });

  describe('getPresetParams', () => {
    it('should correctly detect parameter types (int, float, string)', () => {
      const fileString = `/*@Meta
*/

IntParam=42
FloatParam=0.75
StringParam=TestValue

// Section`;

      const result = getPresetParams(fileString, 'test.h2p');

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ key: 'IntParam', value: 42, type: 'integer' });
      expect(result[1]).toMatchObject({ key: 'FloatParam', value: 0.75, type: 'float' });
      expect(result[2]).toMatchObject({ key: 'StringParam', value: 'TestValue', type: 'string' });
    });

    it('should handle section changes and generate correct IDs', () => {
      const fileString = `/*@Meta
*/

Param1=10
#cm=VCO1
Freq=440
#cm=VCF
Cutoff=1000

// Section`;

      const result = getPresetParams(fileString, 'test.h2p');

      expect(result[0]).toMatchObject({ id: 'HEAD/Param1', section: 'HEAD' });
      expect(result[2]).toMatchObject({ id: 'VCO1/Freq', section: 'VCO1' });
      expect(result[4]).toMatchObject({ id: 'VCF/Cutoff', section: 'VCF' });
    });

    it('should generate unique IDs for duplicate parameters', () => {
      const fileString = `/*@Meta
*/

#cm=VCC
#mv=1
#mv=2
#mv=3

// Section`;

      const result = getPresetParams(fileString, 'test.h2p');

      const mvParams = result.filter(p => p.key === '#mv');
      expect(mvParams).toHaveLength(3);
      expect(mvParams[0].id).toBe('VCC/#mv/0');
      expect(mvParams[1].id).toBe('VCC/#mv/1');
      expect(mvParams[2].id).toBe('VCC/#mv/2');
    });
  });

  describe('isValidPreset', () => {
    it('should reject presets with invalid values', () => {
      const invalidPresets = [
        // No params or meta
        { filePath: '/test.h2p', presetName: 'Test', categories: [], meta: [], params: [] },
        // [object Object] in value
        { filePath: '/test.h2p', presetName: 'Test', categories: [],
          meta: [{ key: 'Author', value: 'Test' }],
          params: [{ id: 'HEAD/P1', key: 'P1', section: 'HEAD', value: '[object Object]', index: 0, type: 'string' }] },
        // undefined in value
        { filePath: '/test.h2p', presetName: 'Test', categories: [],
          meta: [{ key: 'Author', value: 'Test' }],
          params: [{ id: 'HEAD/P1', key: 'P1', section: 'HEAD', value: 'undefined', index: 0, type: 'string' }] },
        // [object Object] in id
        { filePath: '/test.h2p', presetName: 'Test', categories: [],
          meta: [{ key: 'Author', value: 'Test' }],
          params: [{ id: 'HEAD/[object Object]', key: 'P1', section: 'HEAD', value: 42, index: 0, type: 'integer' }] },
      ];

      invalidPresets.forEach(preset => {
        expect(isValidPreset(preset as Preset)).toBe(false);
      });
    });

    it('should accept valid presets', () => {
      const validPreset: Preset = {
        filePath: '/test/preset.h2p',
        presetName: 'TestPreset',
        categories: [],
        meta: [{ key: 'Author', value: 'Test' }],
        params: [
          { id: 'HEAD/Param1', key: 'Param1', section: 'HEAD', value: 42, index: 0, type: 'integer' },
        ],
      };

      expect(isValidPreset(validPreset)).toBe(true);
    });
  });

  describe('round-trip serialization', () => {
    it('should maintain data integrity through parse and serialize cycle', () => {
      const originalFileString = `/*@Meta

Author:
'Test Author'

Description:
'A test preset'

Categories:
'Bass, Lead'

*/

#cm=VCO1
Freq=440
Detune=0.05
Wave=Saw
#cm=VCF
Cutoff=1000
Resonance=50

// Section for ugly compressed binary Data
// DON'T TOUCH THIS

`;

      const parsed = parseUhePreset(originalFileString, '/test.h2p', false);
      const serialized = serializePresetToFile(parsed);
      const reparsed = parseUhePreset(serialized, '/test.h2p', false);

      // Verify structure is maintained
      expect(reparsed.meta).toEqual(parsed.meta);
      expect(reparsed.params.length).toBe(parsed.params.length);

      // Verify critical fields are preserved
      reparsed.params.forEach((param, i) => {
        expect(param.key).toBe(parsed.params[i].key);
        expect(param.value).toBe(parsed.params[i].value);
        expect(param.type).toBe(parsed.params[i].type);
      });
    });
  });
});
