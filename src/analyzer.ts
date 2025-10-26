import { PresetLibrary } from './presetLibrary.js';
import { SynthNames } from './utils/detector.js';

export type ParamsModel = Record<
  string,
  {
    type: 'string' | 'float' | 'integer';
    values: (string | number)[];
    distinctValues: (string | number)[];
    maxValue?: number;
    minValue?: number;
    avgValue?: number;
    keepStable?: 'always' | 'stable-mode';
  }
>;

export type ParamsModelBySection = Record<
  string,
  Record<
    string,
    {
      type: 'string' | 'float' | 'integer';
      values: (string | number)[];
      distinctValues: (string | number)[];
      maxValue?: number;
      minValue?: number;
      avgValue?: number;
    }
  >
>;

export function analyzeParamsTypeAndRange(presetLibrary: PresetLibrary) {
  const paramsModel: ParamsModel = {};
  for (const preset of presetLibrary.presets) {
    for (const param of preset.params) {
      const key = param.id;
      if (!paramsModel[key]) {
        if (key.includes('[object Object]')) {
          // Ignore broken presets, the generator did accidentally create in the past
          continue;
        }
        paramsModel[key] = {
          type: param.type,
          values: [param.value],
          distinctValues: [],
        };
        for (const paramHandling of specialParameterHandling) {
          if (key.includes(paramHandling.id)) {
            paramsModel[key].keepStable = paramHandling.keepStable;
          }
        }
      } else {
        paramsModel[key].values.push(param.value);
        if (paramsModel[key].type !== param.type) {
          if (paramsModel[key].type === 'integer') {
            paramsModel[key].type = param.type;
          } else if (paramsModel[key].type === 'float' && param.type === 'string') {
            paramsModel[key].type = param.type;
          }
        }
      }
    }
  }

  // Post Analytics
  for (const paramName in paramsModel) {
    const param = paramsModel[paramName]!;
    param.distinctValues = [...new Set(param.values)];

    if (param.distinctValues.length === 1) {
      // Save some memory by compacting `values` to a single value if they are the same anyway
      param.values = param.distinctValues;
    }

    if (param.type !== 'string') {
      const values = param.values as number[];
      param.maxValue = Math.max(...values);
      param.minValue = Math.min(...values);
      param.avgValue = average(values);
    }
  }

  return paramsModel;
}

/**
 * Returns a list of names, gathered from the preset library
 */
export function getDictionaryOfNames(presetLibrary: PresetLibrary): string[] {
  const names: string[] = [];
  const excludedWords = new Set([
    'bass',
    'guitar',
    'piano',
    'lead',
    'unison',
    'sub',
    'strings',
    'keys',
    'flute',
    'organ',
    'brass',
    'bells',
    'pluck',
    'plucked',
    'epiano',
    'chorus',
    'stab',
    'chord',
    'chords',
    'drum',
    'synth',
    'kick',
    'snare',
    'clap',
    'hihat',
    'edit',
  ]);
  for (const preset of presetLibrary.presets) {
    const cleanedUpName = preset.presetName.split('_').join(' ');
    const splitName = cleanedUpName.split(' ');
    for (const split of splitName) {
      if (
        split.length > 3 &&
        split.toUpperCase() !== split &&
        !split.includes('-') &&
        !split.includes('(') &&
        !split.includes(')') &&
        !excludedWords.has(split.toLowerCase())
      ) {
        names.push(split);
      }
    }
  }
  return names;
}

export function convertParamsModelBySection(paramsModel: ParamsModel): ParamsModelBySection {
  const paramsModelBySection: ParamsModelBySection = {};
  for (const id in paramsModel) {
    const split = id.split('/');
    const section = split[0];

    // Skip if section is undefined (shouldn't happen with valid preset IDs)
    if (!section) continue;

    paramsModelBySection[section] ??= {};
    const sectionModel = paramsModelBySection[section];
    const paramData = paramsModel[id];
    if (sectionModel && paramData) {
      sectionModel[id] = paramData;
    }
  }
  return paramsModelBySection;
}

export function average(arr: number[]) {
  return arr.reduce((p, c) => p + c, 0) / arr.length;
}

interface SpecialParameterHandling {
  id: string;
  keepStable: 'always' | 'stable-mode';
  restrictToSynth?: SynthNames;
}

const specialParameterHandling: SpecialParameterHandling[] = [
  {
    id: 'VCC/Trsp',
    keepStable: 'always',
  },
  {
    id: 'VCC/FTun',
    keepStable: 'always',
  },
  {
    id: 'Tune',
    keepStable: 'stable-mode',
  },
  {
    id: 'main/CcOp',
    keepStable: 'stable-mode',
  },
  {
    id: 'ZMas/Mast',
    keepStable: 'stable-mode',
  },
];
