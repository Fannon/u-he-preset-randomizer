import { PresetLibrary } from "./presetLibrary.js";

export interface ParamsModel {
  [key: string]: {
    type: "string" | "float" | "integer";
    values: Array<string | number>;
    distinctValues: Array<string | number>;
    maxValue?: number;
    minValue?: number;
    avgValue?: number;
  }
}


export interface ParamsModelBySection {
  [section: string]: {
    [id: string]: {
      type: "string" | "float" | "integer";
      values: Array<string | number>;
      distinctValues: Array<string | number>;
      maxValue?: number;
      minValue?: number;
      avgValue?: number;
    }
  }
}

export function analyzeParamsTypeAndRange(presetLibrary: PresetLibrary) {
  const paramsModel: ParamsModel = {};
  for (const preset of presetLibrary.presets) {
    for (const param of preset.params) {
      const key = param.id;
      if (!paramsModel[key]) {
        paramsModel[key] = {
          type: param.type,
          values: [param.value],
          distinctValues: [],
        };
      } else {
        paramsModel[key]!.values.push(param.value);
        if (paramsModel[key]!.type !== param.type) {
          if (paramsModel[key]!.type === 'integer') {
            paramsModel[key]!.type = param.type
          } else if (paramsModel[key]!.type === 'float' && param.type === 'string') {
            paramsModel[key]!.type = param.type
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
    
    if (param.type !== "string") {
      const values = param.values as number[]
      param.maxValue = Math.max(...values);
      param.minValue = Math.min(...values);
      param.avgValue = average(values);
    }
  }

  return paramsModel;
}

export function convertParamsModelBySection(paramsModel: ParamsModel): ParamsModelBySection {
  const paramsModelBySection: ParamsModelBySection = {}
  for (const id in paramsModel) {
    const split = id.split('/')
    const section = split[0]

    if (!paramsModelBySection[section]) {
      paramsModelBySection[section] = {}
    }
    paramsModelBySection[section][id] = paramsModel[id]
  }
  return paramsModelBySection;
}

function average(arr: number[]) {
  return arr.reduce((p, c) => p + c, 0) / arr.length;
}
