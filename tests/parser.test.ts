import {
  parseUhePreset,
  getPresetMetadata,
  getPresetParams,
  getPresetBinarySection,
  serializePresetToFile,
  isValidPreset,
  isInt,
  isNumeric,
  type Preset,
} from '../src/parser.js';

describe('parser', () => {
  describe('isInt', () => {
    it('should return true for integer strings', () => {
      expect(isInt('42')).toBe(true);
      expect(isInt('0')).toBe(true);
      expect(isInt('-5')).toBe(true);
      expect(isInt('100')).toBe(true);
    });

    it('should return false for float strings', () => {
      expect(isInt('3.14')).toBe(false);
      expect(isInt('0.5')).toBe(false);
      expect(isInt('-2.5')).toBe(false);
    });

    it('should return false for non-numeric strings', () => {
      expect(isInt('abc')).toBe(false);
      expect(isInt('')).toBe(false);
      expect(isInt('12.34.56')).toBe(false);
    });
  });

  describe('isNumeric', () => {
    it('should return true for numeric strings', () => {
      expect(isNumeric('42')).toBe(true);
      expect(isNumeric('3.14')).toBe(true);
      expect(isNumeric('-5.5')).toBe(true);
      expect(isNumeric('0')).toBe(true);
      expect(isNumeric('0.0')).toBe(true);
    });

    it('should return false for non-numeric strings', () => {
      expect(isNumeric('abc')).toBe(false);
      expect(isNumeric('')).toBe(false);
      expect(isNumeric('12abc')).toBe(false);
    });
  });

  describe('getPresetMetadata', () => {
    it('should parse simple metadata correctly', () => {
      const fileString = `/*@Meta

Author:
'Test Author'

Description:
'Test description'

*/`;

      const result = getPresetMetadata(fileString);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ key: 'Author', value: 'Test Author' });
      expect(result[1]).toEqual({ key: 'Description', value: 'Test description' });
    });

    it('should parse categories as array when comma-separated', () => {
      const fileString = `/*@Meta

Categories:
'Bass, Lead, Synth'

*/`;

      const result = getPresetMetadata(fileString);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ key: 'Categories', value: ['Bass', 'Lead', 'Synth'] });
    });

    it('should handle metadata with lowercase @meta tag', () => {
      const fileString = `/*@meta

Author:
'Test'

*/`;

      const result = getPresetMetadata(fileString);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ key: 'Author', value: 'Test' });
    });

    it('should handle empty metadata section', () => {
      const fileString = `/*@Meta

*/`;

      const result = getPresetMetadata(fileString);

      expect(result).toHaveLength(0);
    });
  });

  describe('getPresetParams', () => {
    it('should parse integer parameters correctly', () => {
      const fileString = `/*@Meta
*/

Param1=42
Param2=100

// Section`;

      const result = getPresetParams(fileString, 'test.h2p');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        key: 'Param1',
        value: 42,
        type: 'integer',
        section: 'HEAD',
      });
      expect(result[1]).toMatchObject({
        key: 'Param2',
        value: 100,
        type: 'integer',
      });
    });

    it('should parse float parameters correctly', () => {
      const fileString = `/*@Meta
*/

Volume=0.75
Pan=-0.5

// Section`;

      const result = getPresetParams(fileString, 'test.h2p');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        key: 'Volume',
        value: 0.75,
        type: 'float',
      });
      expect(result[1]).toMatchObject({
        key: 'Pan',
        value: -0.5,
        type: 'float',
      });
    });

    it('should parse string parameters correctly', () => {
      const fileString = `/*@Meta
*/

Name=TestName
Mode=Poly

// Section`;

      const result = getPresetParams(fileString, 'test.h2p');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        key: 'Name',
        value: 'TestName',
        type: 'string',
      });
      expect(result[1]).toMatchObject({
        key: 'Mode',
        value: 'Poly',
        type: 'string',
      });
    });

    it('should handle section changes with #cm marker', () => {
      const fileString = `/*@Meta
*/

Param1=10
#cm=VCO1
Freq=440
#cm=VCF
Cutoff=1000

// Section`;

      const result = getPresetParams(fileString, 'test.h2p');

      expect(result).toHaveLength(5);
      expect(result[0]).toMatchObject({ section: 'HEAD' });
      expect(result[1]).toMatchObject({ key: '#cm', value: 'VCO1' });
      expect(result[2]).toMatchObject({ key: 'Freq', section: 'VCO1' });
      expect(result[3]).toMatchObject({ key: '#cm', value: 'VCF' });
      expect(result[4]).toMatchObject({ key: 'Cutoff', section: 'VCF' });
    });

    it('should generate unique IDs for duplicate parameters', () => {
      const fileString = `/*@Meta
*/

#cm=VCC
Param=1
Param=2
Param=3

// Section`;

      const result = getPresetParams(fileString, 'test.h2p');

      const params = result.filter(p => p.key === 'Param');
      expect(params).toHaveLength(3);
      expect(params[0].id).toBe('VCC/Param/0');
      expect(params[1].id).toBe('VCC/Param/1');
      expect(params[2].id).toBe('VCC/Param/2');
    });

    it('should return empty array for missing param body', () => {
      const fileString = `/*@Meta
*/`;

      const result = getPresetParams(fileString, 'test.h2p');

      expect(result).toHaveLength(0);
    });
  });

  describe('getPresetBinarySection', () => {
    it('should extract binary section when present', () => {
      const fileString = `/*@Meta
*/

Param=1

// Section for ugly compressed binary Data
// DON'T TOUCH THIS

BINARY_DATA_HERE`;

      const result = getPresetBinarySection(fileString);

      expect(result).toBe('BINARY_DATA_HERE');
    });

    it('should return empty string when binary section is missing', () => {
      const fileString = `/*@Meta
*/

Param=1`;

      const result = getPresetBinarySection(fileString);

      expect(result).toBe('');
    });
  });

  describe('serializePresetToFile', () => {
    it('should serialize a preset back to file format', () => {
      const preset: Preset = {
        filePath: '/test/preset.h2p',
        presetName: 'TestPreset',
        categories: ['Bass'],
        meta: [
          { key: 'Author', value: 'Test Author' },
          { key: 'Description', value: 'Test Desc' },
        ],
        params: [
          { id: 'HEAD/Param1', key: 'Param1', section: 'HEAD', value: 42, index: 0, type: 'integer' },
          { id: 'HEAD/Param2', key: 'Param2', section: 'HEAD', value: 0.5, index: 1, type: 'float' },
        ],
      };

      const result = serializePresetToFile(preset);

      expect(result).toContain('/*@Meta');
      expect(result).toContain("'Test Author'");
      expect(result).toContain("'Test Desc'");
      expect(result).toContain('Param1=42');
      expect(result).toContain('Param2=0.5');
      expect(result).toContain('// Section for ugly compressed binary Data');
      expect(result).toContain("// DON'T TOUCH THIS");
    });

    it('should serialize array metadata values correctly', () => {
      const preset: Preset = {
        filePath: '/test/preset.h2p',
        presetName: 'TestPreset',
        categories: [],
        meta: [
          { key: 'Categories', value: ['Bass', 'Lead', 'Synth'] },
        ],
        params: [],
      };

      const result = serializePresetToFile(preset);

      expect(result).toContain("'Bass, Lead, Synth'");
    });

    it('should include binary section when present', () => {
      const preset: Preset = {
        filePath: '/test/preset.h2p',
        presetName: 'TestPreset',
        categories: [],
        meta: [],
        params: [],
        binary: 'BINARY_CONTENT_HERE',
      };

      const result = serializePresetToFile(preset);

      expect(result).toContain('BINARY_CONTENT_HERE');
    });
  });

  describe('parseUhePreset', () => {
    it('should parse a complete preset file', () => {
      const fileString = `/*@Meta

Author:
'Test Author'

Categories:
'Bass, Lead'

*/

Param1=42
Param2=0.75

// Section for ugly compressed binary Data
// DON'T TOUCH THIS

BINARY`;

      const result = parseUhePreset(fileString, '/test/preset.h2p', true);

      expect(result.presetName).toBe('preset');
      expect(result.filePath).toBe('/test/preset.h2p');
      expect(result.categories).toEqual(['Bass', 'Lead']);
      expect(result.meta).toHaveLength(2);
      expect(result.params).toHaveLength(2);
      expect(result.binary).toBe('BINARY');
    });

    it('should not include binary when binary flag is false', () => {
      const fileString = `/*@Meta
*/
Param=1
// Section for ugly compressed binary Data
// DON'T TOUCH THIS
BINARY`;

      const result = parseUhePreset(fileString, '/test/preset.h2p', false);

      expect(result.binary).toBeUndefined();
    });

    it('should handle single category value', () => {
      const fileString = `/*@Meta

Categories:
'Bass'

*/
Param=1`;

      const result = parseUhePreset(fileString, '/test/preset.h2p', false);

      expect(result.categories).toEqual(['Bass']);
    });
  });

  describe('isValidPreset', () => {
    it('should return true for valid preset', () => {
      const preset: Preset = {
        filePath: '/test/preset.h2p',
        presetName: 'TestPreset',
        categories: [],
        meta: [{ key: 'Author', value: 'Test' }],
        params: [
          { id: 'HEAD/Param1', key: 'Param1', section: 'HEAD', value: 42, index: 0, type: 'integer' },
        ],
      };

      expect(isValidPreset(preset)).toBe(true);
    });

    it('should return false for preset with no params', () => {
      const preset: Preset = {
        filePath: '/test/preset.h2p',
        presetName: 'TestPreset',
        categories: [],
        meta: [{ key: 'Author', value: 'Test' }],
        params: [],
      };

      expect(isValidPreset(preset)).toBe(false);
    });

    it('should return false for preset with no meta', () => {
      const preset: Preset = {
        filePath: '/test/preset.h2p',
        presetName: 'TestPreset',
        categories: [],
        meta: [],
        params: [
          { id: 'HEAD/Param1', key: 'Param1', section: 'HEAD', value: 42, index: 0, type: 'integer' },
        ],
      };

      expect(isValidPreset(preset)).toBe(false);
    });

    it('should return false for preset with [object Object] in value', () => {
      const preset: Preset = {
        filePath: '/test/preset.h2p',
        presetName: 'TestPreset',
        categories: [],
        meta: [{ key: 'Author', value: 'Test' }],
        params: [
          { id: 'HEAD/Param1', key: 'Param1', section: 'HEAD', value: '[object Object]', index: 0, type: 'string' },
        ],
      };

      expect(isValidPreset(preset)).toBe(false);
    });

    it('should return false for preset with undefined in value', () => {
      const preset: Preset = {
        filePath: '/test/preset.h2p',
        presetName: 'TestPreset',
        categories: [],
        meta: [{ key: 'Author', value: 'Test' }],
        params: [
          { id: 'HEAD/Param1', key: 'Param1', section: 'HEAD', value: 'undefined', index: 0, type: 'string' },
        ],
      };

      expect(isValidPreset(preset)).toBe(false);
    });

    it('should return false for preset with [object Object] in id', () => {
      const preset: Preset = {
        filePath: '/test/preset.h2p',
        presetName: 'TestPreset',
        categories: [],
        meta: [{ key: 'Author', value: 'Test' }],
        params: [
          { id: 'HEAD/[object Object]', key: 'Param1', section: 'HEAD', value: 42, index: 0, type: 'integer' },
        ],
      };

      expect(isValidPreset(preset)).toBe(false);
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

      expect(reparsed.meta).toEqual(parsed.meta);
      expect(reparsed.params).toEqual(parsed.params);
    });
  });
});
