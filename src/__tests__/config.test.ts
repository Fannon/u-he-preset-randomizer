import { beforeEach, describe, expect, it } from '@jest/globals';
import {
  getConfig,
  getConfigFromParameters,
  resetConfig,
  setConfig,
} from '../config.js';

describe('config utilities', () => {
  beforeEach(() => {
    resetConfig();
  });

  it('parses CLI overrides and coerces numeric/string values correctly', () => {
    const config = getConfigFromParameters({
      synth: 'Diva',
      amount: '3',
      randomness: '75',
      preset: 'Init Patch',
      merge: ['Bass', 'Lead'],
      pattern: '/User/Favorites/*',
      binary: true,
      stable: true,
      category: 'Pads',
      dictionary: true,
      author: 'Tester',
      folder: 'Studio',
      favorites: ['Fav1', 'Fav2'],
      debug: true,
    });

    expect(config).toMatchObject({
      synth: 'Diva',
      amount: 3,
      randomness: 75,
      preset: 'Init Patch',
      merge: ['Bass', 'Lead'],
      pattern: '/User/Favorites/*',
      binary: true,
      stable: true,
      category: 'Pads',
      dictionary: true,
      author: 'Tester',
      folder: 'Studio',
      favorites: ['Fav1', 'Fav2'],
      debug: true,
    });
  });

  it('merges config updates and supports custom folder parsing', () => {
    const initial = getConfigFromParameters({
      synth: 'Diva',
      amount: '2',
    });

    expect(initial.amount).toBe(2);

    setConfig({ preset: 'Init Diva' });
    expect(getConfig()).toMatchObject({
      synth: 'Diva',
      amount: 2,
      preset: 'Init Diva',
    });

    resetConfig();
    const withCustomFolder = getConfigFromParameters({
      'custom-folder': '/tmp/u-he',
    });

    expect(withCustomFolder.customFolder).toBe('/tmp/u-he');
    expect(getConfig().preset).toBeUndefined();
  });
});
