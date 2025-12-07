/**
 * @file Diva-specific configuration for special parameter handling.
 *
 * Diva is a virtual analog synthesizer. Most parameters can be safely
 * randomized. The critical tuning parameters (VCC/Trsp, VCC/FTun) are
 * covered by global rules.
 */

import type { SynthConfig } from './types.js';

export const divaConfig: SynthConfig = {
  synthName: 'Diva',
  specialParameters: [
    // Diva-specific stable parameters can be added here if needed
    // Global rules already cover VCC/Trsp and VCC/FTun (tuning)
  ],
};
