/**
 * @file Zebra3-specific configuration for special parameter handling.
 *
 * Zebra3 (and Zebralette3) presets contain binary sections with curve/geometry data.
 * The curve indices in O1Geo1 and M1Geo1 sections are pointers to these
 * binary slots. Randomizing these indices causes crashes because they
 * may reference non-existent curve data.
 */

import type { SynthConfig } from './types.js';

export const zebra3Config: SynthConfig = {
  synthName: 'Zebra3',
  defaults: {
    binary: false,
  },
  specialParameters: [
    // O1Geo1: Oscillator geometry curve indices are pointers to binary data
    // These must match the curve slots defined in the binary section
    {
      id: 'O1Geo1/Curve',
      keepStable: 'always',
    },
    {
      id: 'O1Geo1/Guide',
      keepStable: 'always',
    },
    {
      id: 'O1Geo1/CrvPos',
      keepStable: 'always',
    },
    // M1Geo1: MSEG geometry curve indices are pointers to binary data
    {
      id: 'M1Geo1/Curve',
      keepStable: 'always',
    },
    {
      id: 'M1Geo1/Guide',
      keepStable: 'always',
    },
    {
      id: 'M1Geo1/CrvPos',
      keepStable: 'always',
    },
    // MPreset section is critical for preset initialization memory
    {
      id: 'MPreset/',
      keepStable: 'always',
    },
  ],
};
