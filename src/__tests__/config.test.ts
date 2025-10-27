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

  it('creates new config objects instead of mutating shared state', () => {
    // Create first config
    const config1 = getConfigFromParameters({
      synth: 'Diva',
      amount: '5',
    });

    // Create second config - should not be affected by first config
    const config2 = getConfigFromParameters({
      synth: 'Repro',
      randomness: '80',
    });

    // Verify both configs are independent
    expect(config1.synth).toBe('Diva');
    expect(config1.amount).toBe(5);
    expect(config1.randomness).toBeUndefined();

    expect(config2.synth).toBe('Repro');
    expect(config2.randomness).toBe(80);
    // amount should not be inherited from config1
    expect(config2.amount).toBeUndefined();
  });
});
