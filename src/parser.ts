import * as path from "path";

export interface preset {
  /** Relative filePath to preset folder */
  filePath: string;
  /** Preset file name, without file extension or sub-folders */
  presetName: string;
  meta: PresetMetaEntry[];
  params: PresetParam[];
}

export interface PresetMetaEntry {
  key: string;
  value: string | string[];
}

export interface PresetParam {
  key: string;
  section: string;
  value: string | number;
  index: number;
  type: "string" | "float" | "integer";
}

//////////////////////////////////////////
// PARSER FUNCTIONS                     //
//////////////////////////////////////////

export function parseUhePreset(fileString: string, filePath: string): preset {
  return {
    filePath: filePath,
    presetName: path.parse(filePath).name,
    meta: getPresetMetadata(fileString),
    params: getPresetParams(fileString),
  };
}

export function getPresetMetadata(fileString: string) {
  const split = fileString.split("*/");
  const metadataHeader = split[0]!
    .replace("/*@Meta", "")
    .replace("/*@meta", "");

  const cleanedRows = metadataHeader.split("\n").filter((el) => el);

  const metadata = [];
  for (let i = 0; i < cleanedRows.length; i = i + 2) {
    const key = cleanedRows[i]!.replace(":", "");
    let value: string | string[] = cleanedRows[i + 1]!.split("'").join("");
    if (value.includes(", ")) {
      value = value.split(", ");
    }
    metadata.push({
      key,
      value,
    });
  }
  return metadata;
}

export function getPresetParams(fileString: string) {
  const split = fileString.split("*/");
  const paramBody = split[1]!.split("// Section")[0];

  if (!paramBody) {
    throw new Error("Could not parse preset parameter body");
  }

  const cleanedRows = paramBody.split("\n").filter((el) => el);

  const params: PresetParam[] = [];
  let currentSection = "MAIN";
  for (let i = 0; i < cleanedRows.length; i++) {
    const paramSplit = cleanedRows[i]!.split("=");
    const key = paramSplit[0]!;
    let value = paramSplit[1]!;

    if (key === "#cm") {
      currentSection = value;
    }
    const param: PresetParam = {
      key: key,
      section: currentSection,
      value: value,
      index: i,
      type: "string",
    };

    if (isInt(value)) {
      param.value = parseInt(value);
      param.type = "integer";
    } else if (isNumeric(value)) {
      param.value = parseFloat(value);
      param.type = "float";
    }

    params.push(param);
  }
  return params;
}

//////////////////////////////////////////
// SERIALIZER FUNCTIONS                 //
//////////////////////////////////////////

export function serializePresetToFile(preset: preset): string {
  let file = "";

  // Add meta header
  file += "/*@Meta\n\n";
  for (const entry of preset.meta) {
    file += `${entry.key}:\n`;
    if (Array.isArray(entry.value)) {
      file += `'${entry.value.join(", ")}'\n\n`;
    } else {
      file += `'${entry.value}'\n\n`;
    }
  }
  file += "*/\n\n";

  // Add params
  for (const param of preset.params) {
    file += `${param.key}=${param.value}\n`;
  }

  // Add footer

  file += "\n\n\n\n";
  file += "// Section for ugly compressed binary Data\n";
  file += "// DON'T TOUCH THIS\n\n";

  file += ``; // binary end of file marker?

  return file;
}

export function getKeyForParam(param: PresetParam): string {
  let key = `${param.section}/${param.key}`
  if (param.key === '#ms') {
    key += `/${param.index}`
  }
  return key;
}

//////////////////////////////////////////
// HELPER FUNCTIONS                     //
//////////////////////////////////////////

function isInt(value: any): boolean {
  return (
    !isNaN(value) &&
    (function (x) {
      return (x | 0) === x;
    })(parseFloat(value))
  );
}

function isNumeric(value: any): boolean {
  return !isNaN(parseFloat(value)) && isFinite(value);
}
