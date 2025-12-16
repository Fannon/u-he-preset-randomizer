import type { SynthNames } from '../utils/detector.js';
import { repro1Config } from './Repro1.js';
import { repro5Config } from './Repro5.js';
import {
  globalSpecialParameters,
  type SpecialParameterHandling,
  type SynthConfig,
} from './types.js';
import { zebra3Config } from './Zebra3.js';
import { zebralette3Config } from './Zebralette3.js';

export {
  globalSpecialParameters,
  type SpecialParameterHandling,
  type SynthConfig,
} from './types.js';

/**
 * Registry of statically imported synth configs
 */
const synthConfigs = {
  Zebralette3: zebralette3Config,
  Zebra3: zebra3Config,
  'Repro-1': repro1Config,
  'Repro-5': repro5Config,
};

/**
 * Gets the configuration for a specific synth.
 *
 * @param synthName - The synth name to get config for
 * @returns The synth configuration or undefined if none exists
 */
export function getSynthConfig(synthName: SynthNames): SynthConfig | undefined {
  // @ts-expect-error - Index access on partial record
  return synthConfigs[synthName];
}

/**
 * Gets the special parameter handling rules for a specific synth
 * Combines global rules with synth-specific rules
 *
 * @param synthName - The synth to get config for (optional)
 * @returns Array of special parameter handling rules
 */
export function getSpecialParameterHandling(
  synthName?: SynthNames,
): SpecialParameterHandling[] {
  const rules = [...globalSpecialParameters];

  if (synthName) {
    const synthConfig = getSynthConfig(synthName);
    if (synthConfig) {
      rules.push(...synthConfig.specialParameters);
    }
  }

  return rules;
}
