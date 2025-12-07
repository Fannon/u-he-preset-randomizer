/**
 * @file Synth configuration types and global rules.
 */

import type { SynthNames } from '../utils/detector.js';

export interface SpecialParameterHandling {
  /** Parameter ID pattern to match (uses string.includes() for matching) */
  id: string;
  /** 'always' = never randomize, 'stable-mode' = only keep stable when stable mode is enabled */
  keepStable: 'always' | 'stable-mode';
}

export interface SynthConfig {
  /** Synth name this config applies to */
  synthName: SynthNames;
  /** Special parameter handling rules for this synth */
  specialParameters: SpecialParameterHandling[];
  /** Default configuration values for this synth */
  defaults?: {
    binary?: boolean;
    binaryTemplate?: boolean;
  };
}

/**
 * Global special parameter handling that applies to all synths
 *
 * keepStable options:
 * - 'always': Parameter is NEVER randomized. Used for critical parameters like
 *             binary pointers or internal flags that would break the preset if changed.
 * - 'stable-mode': Parameter is kept stable ONLY when 'Stable' randomization mode is selected.
 *                  In 'Balanced' or 'Creative' modes, these will be randomized.
 *                  Used for tuning, volume, or other sensitive but creative parameters.
 *
 * Note: Global rules are safely ignored for synths that don't have the matching parameters.
 */
export const globalSpecialParameters: SpecialParameterHandling[] = [
  // VCC (Voice Control Center) tuning parameters - common in Diva, Repro, ACE
  // Randomizing these would make presets play out of tune
  {
    id: 'VCC/Trsp', // Transpose in semitones
    keepStable: 'always',
  },
  {
    id: 'VCC/FTun', // Fine Tune in cents
    keepStable: 'always',
  },
  // Other potential rules (uncomment if needed):
  // {
  //   id: 'Tune', // Too generic, might match creative parameters
  //   keepStable: 'stable-mode',
  // },
  // {
  //   id: 'main/CcOp', // Unclear purpose, varies by synth
  //   keepStable: 'stable-mode',
  // },
  // {
  //   id: 'ZMas/Mast', // Zebra-specific master output
  //   keepStable: 'stable-mode',
  // },
];
