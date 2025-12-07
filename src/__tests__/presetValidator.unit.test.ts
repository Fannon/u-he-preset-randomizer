/**
 * Unit tests for preset validator utilities.
 * Tests the pure validation functions that don't require filesystem access.
 */

import { describe, expect, it } from 'bun:test';
import { validatePresetExtension } from '../utils/presetValidator.js';

describe('presetValidator helpers', () => {
  describe('validatePresetExtension', () => {
    it('should return true for valid .h2p files', () => {
      expect(validatePresetExtension('/path/to/preset.h2p')).toBe(true);
      expect(validatePresetExtension('C:\\Users\\Presets\\Lead.h2p')).toBe(true);
      expect(validatePresetExtension('preset.h2p')).toBe(true);
    });

    it('should be case insensitive for extension', () => {
      expect(validatePresetExtension('preset.H2P')).toBe(true);
      expect(validatePresetExtension('preset.h2P')).toBe(true);
      expect(validatePresetExtension('PRESET.H2P')).toBe(true);
    });

    it('should return false for non-h2p files', () => {
      expect(validatePresetExtension('/path/to/preset.txt')).toBe(false);
      expect(validatePresetExtension('/path/to/preset.json')).toBe(false);
      expect(validatePresetExtension('/path/to/preset.wav')).toBe(false);
      expect(validatePresetExtension('/path/to/preset.fxp')).toBe(false);
    });

    it('should return false for files without extension', () => {
      expect(validatePresetExtension('/path/to/preset')).toBe(false);
      expect(validatePresetExtension('noextension')).toBe(false);
    });

    it('should handle edge cases', () => {
      // Note: path.extname('.h2p') returns '' (treats as hidden file with no extension)
      expect(validatePresetExtension('.h2p')).toBe(false);
      expect(validatePresetExtension('preset.h2p.backup')).toBe(false); // Double extension
      expect(validatePresetExtension('.hidden.h2p')).toBe(true); // Hidden file on Unix
      expect(validatePresetExtension('')).toBe(false); // Empty string
    });

    it('should handle paths with spaces', () => {
      expect(validatePresetExtension('/path/to/My Preset.h2p')).toBe(true);
      expect(validatePresetExtension('C:\\Users\\Music\\My Lead Sound.h2p')).toBe(true);
    });

    it('should handle paths with special characters', () => {
      expect(validatePresetExtension('/path/to/preset-v2.h2p')).toBe(true);
      expect(validatePresetExtension('/path/to/preset_final.h2p')).toBe(true);
      expect(validatePresetExtension("/path/to/preset'copy.h2p")).toBe(true);
    });
  });
});
