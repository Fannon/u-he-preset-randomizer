import { PresetLibrary } from "./presetLibrary";

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
    
    if (param.type !== "string") {
      const values = param.values as number[]
      param.maxValue = Math.max(...values);
      param.minValue = Math.min(...values);
      param.avgValue = average(values);
    }
  }

  return paramsModel;
}

function average(arr: number[]) {
  return arr.reduce((p, c) => p + c, 0) / arr.length;
}
