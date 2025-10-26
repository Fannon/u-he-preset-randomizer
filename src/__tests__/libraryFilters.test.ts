import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { PresetLibrary } from '../presetLibrary.js';
import {
  narrowDownByAuthor,
  narrowDownByCategory,
  narrowDownByFavoritesFile,
} from '../libraryFilters.js';

describe('libraryFilters', () => {
  let mockPresetLibrary: PresetLibrary;

  beforeEach(() => {
    mockPresetLibrary = {
      synth: 'TestSynth',
      rootFolder: '/test',
      userPresetsFolder: '/test/UserPresets/TestSynth',
      presetsFolder: '/test/Presets/TestSynth',
      presets: [
        {
          filePath: '/Local/Lead1.h2p',
          presetName: 'Lead1',
          categories: ['LD', 'Lead'],
          meta: [
            { key: 'Author', value: 'Artist1' },
            { key: 'Description', value: 'Test lead' },
          ],
          params: [],
        },
        {
          filePath: '/Local/Pad1.h2p',
          presetName: 'Pad1',
          categories: ['PD', 'Pad', 'Ambient'],
          meta: [
            { key: 'Author', value: 'Artist2' },
            { key: 'Description', value: 'Test pad' },
          ],
          params: [],
        },
        {
          filePath: '/Local/Bass1.h2p',
          presetName: 'Bass1',
          categories: ['BS', 'Bass'],
          meta: [
            { key: 'Author', value: 'Artist1' },
            { key: 'Description', value: 'Test bass' },
          ],
          params: [],
        },
        {
          filePath: '/User/Custom1.h2p',
          presetName: 'Custom1',
          categories: ['FX', 'Effect'],
          meta: [
            { key: 'Author', value: 'Artist3' },
            { key: 'Description', value: 'Test effect' },
          ],
          params: [],
        },
        {
          filePath: '/Local/NoCategory.h2p',
          presetName: 'NoCategory',
          categories: [],
          meta: [
            { key: 'Author', value: 'Artist1' },
            { key: 'Description', value: 'No category preset' },
          ],
          params: [],
        },
      ],
      favorites: [
        {
          fileName: 'leads.uhe-fav',
          presets: [
            { path: '/Local', name: 'Lead1' },
            { path: '/Local', name: 'Bass1' },
          ],
        },
        {
          fileName: 'pads.uhe-fav',
          presets: [
            { path: '/Local', name: 'Pad1' },
          ],
        },
        {
          fileName: 'effects.uhe-fav',
          presets: [
            { path: '/User', name: 'Custom1' },
          ],
        },
      ],
    };
  });

  describe('narrowDownByCategory', () => {
    it('filters presets by exact category match', () => {
      const result = narrowDownByCategory(mockPresetLibrary, 'LD');

      expect(result).toHaveLength(1);
      expect(result[0]?.presetName).toBe('Lead1');
    });

    it('filters presets by category prefix match', () => {
      const result = narrowDownByCategory(mockPresetLibrary, 'L');

      expect(result).toHaveLength(1);
      expect(result[0]?.presetName).toBe('Lead1');
    });

    it('filters presets by multiple categories', () => {
      const result = narrowDownByCategory(mockPresetLibrary, 'P');

      expect(result).toHaveLength(1);
      expect(result[0]?.presetName).toBe('Pad1');
    });

    it('returns empty array for non-matching category', () => {
      const result = narrowDownByCategory(mockPresetLibrary, 'NonExistent');

      expect(result).toHaveLength(0);
    });

    it('excludes presets with no categories', () => {
      const result = narrowDownByCategory(mockPresetLibrary, 'LD');

      expect(result).toHaveLength(1);
      expect(result.some(p => p.presetName === 'NoCategory')).toBe(false);
    });

    it('handles case sensitivity correctly', () => {
      const result = narrowDownByCategory(mockPresetLibrary, 'ld');

      expect(result).toHaveLength(0); // Should be case sensitive
    });

    it('logs the filtering result', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      narrowDownByCategory(mockPresetLibrary, 'LD');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Narrowed down by category "LD" to 1 presets'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('narrowDownByAuthor', () => {
    it('filters presets by exact author match', () => {
      const result = narrowDownByAuthor(mockPresetLibrary, 'Artist1');

      expect(result).toHaveLength(3);
      expect(result.map(p => p.presetName)).toEqual(
        expect.arrayContaining(['Lead1', 'Bass1', 'NoCategory'])
      );
    });

    it('returns empty array for non-matching author', () => {
      const result = narrowDownByAuthor(mockPresetLibrary, 'NonExistentAuthor');

      expect(result).toHaveLength(0);
    });

    it('includes presets without categories if they have author', () => {
      const result = narrowDownByAuthor(mockPresetLibrary, 'Artist1');

      expect(result).toHaveLength(3);
      expect(result.some(p => p.presetName === 'NoCategory')).toBe(true);
    });

    it('handles case sensitivity correctly', () => {
      const result = narrowDownByAuthor(mockPresetLibrary, 'artist1');

      expect(result).toHaveLength(0); // Should be case sensitive
    });

    it('logs the filtering result', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      narrowDownByAuthor(mockPresetLibrary, 'Artist1');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Narrowed down by author "Artist1" to 3 presets'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('narrowDownByFavoritesFile', () => {
    it('filters presets by single favorites file', () => {
      const result = narrowDownByFavoritesFile(mockPresetLibrary, 'leads.uhe-fav');

      expect(result).toHaveLength(2);
      expect(result.map(p => p.presetName)).toEqual(
        expect.arrayContaining(['Lead1', 'Bass1'])
      );
    });

    it('filters presets by multiple favorites files', () => {
      const result = narrowDownByFavoritesFile(mockPresetLibrary, [
        'leads.uhe-fav',
        'pads.uhe-fav'
      ]);

      expect(result).toHaveLength(3);
      expect(result.map(p => p.presetName)).toEqual(
        expect.arrayContaining(['Lead1', 'Bass1', 'Pad1'])
      );
    });

    it('returns all presets when favorites file not found', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = narrowDownByFavoritesFile(mockPresetLibrary, 'nonexistent.uhe-fav');

      expect(result).toHaveLength(5); // All presets
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error: Could not find favorites file: nonexistent.uhe-fav')
      );

      consoleSpy.mockRestore();
    });

    it('handles path matching case insensitivity', () => {
      const result = narrowDownByFavoritesFile(mockPresetLibrary, 'leads.uhe-fav');

      expect(result).toHaveLength(2);
      expect(result.map(p => p.presetName)).toEqual(
        expect.arrayContaining(['Lead1', 'Bass1'])
      );
    });

    it('handles name matching case insensitivity', () => {
      const result = narrowDownByFavoritesFile(mockPresetLibrary, 'leads.uhe-fav');

      expect(result).toHaveLength(2);
      expect(result.map(p => p.presetName)).toEqual(
        expect.arrayContaining(['Lead1', 'Bass1'])
      );
    });

    it('logs the filtering result for single file', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      narrowDownByFavoritesFile(mockPresetLibrary, 'leads.uhe-fav');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Narrowed down via favorite file "leads.uhe-fav" to 2 presets'
      );

      consoleSpy.mockRestore();
    });

    it('logs the filtering result for multiple files', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      narrowDownByFavoritesFile(mockPresetLibrary, ['leads.uhe-fav', 'pads.uhe-fav']);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Narrowed down via favorite file "leads.uhe-fav, pads.uhe-fav" to 3 presets'
      );

      consoleSpy.mockRestore();
    });

    it('handles empty favorites array', () => {
      const emptyLibrary: PresetLibrary = {
        ...mockPresetLibrary,
        favorites: [],
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = narrowDownByFavoritesFile(emptyLibrary, 'nonexistent.uhe-fav');

      expect(result).toHaveLength(5); // All presets
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error: Could not find favorites file: nonexistent.uhe-fav')
      );

      consoleSpy.mockRestore();
    });

    it('handles preset with no file extension in path matching', () => {
      const libraryWithNoExtension: PresetLibrary = {
        ...mockPresetLibrary,
        presets: [
          ...mockPresetLibrary.presets,
          {
            filePath: '/Local/Test',
            presetName: 'Test',
            categories: ['Test'],
            meta: [],
            params: [],
          },
        ],
      };

      const result = narrowDownByFavoritesFile(libraryWithNoExtension, 'leads.uhe-fav');

      expect(result).toHaveLength(2);
      expect(result.map(p => p.presetName)).toEqual(
        expect.arrayContaining(['Lead1', 'Bass1'])
      );
    });
  });
});
