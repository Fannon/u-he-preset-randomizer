import * as path from "path";
import { log } from "./utils/log.js";

export interface Preset {
  /** Relative filePath to preset folder */
  filePath: string;
  /** Preset file name, without file extension or sub-folders */
  presetName: string;
  categories: string[]
  meta: PresetMetaEntry[];
  params: PresetParam[];
  binary?: string;
}

export interface PresetMetaEntry {
  key: string;
  value: string | string[];
}

export interface PresetParam {
  id: string;
  key: string;
  section: string;
  value: string | number;
  index: number;
  type: "string" | "float" | "integer";
}

//////////////////////////////////////////
// PARSER FUNCTIONS                     //
//////////////////////////////////////////

export function parseUhePreset(fileString: string, filePath: string, binary: boolean): Preset {
  const meta = getPresetMetadata(fileString)
  let categories = []
  const categoriesMeta = meta.find(el => el.key === 'Categories')
  if (categoriesMeta && categoriesMeta.value) {
    if (Array.isArray(categoriesMeta.value)) {
      categories = categoriesMeta.value
    } else {
      categories.push(categoriesMeta.value)
    }
  }
  return {
    filePath: filePath,
    presetName: path.parse(filePath).name,
    meta: meta,
    params: getPresetParams(fileString, filePath),
    binary: binary ? getPresetBinarySection(fileString) : undefined,
    categories: categories
  };
}

export function getPresetMetadata(fileString: string): PresetMetaEntry[] {
  const split = fileString.split("*/");
  const metadataHeader = split[0]!
    .replace("/*@Meta", "")
    .replace("/*@meta", "");

  const cleanedRows = metadataHeader.split("\n").filter((el) => el);

  const metadata = [];
  for (let i = 0; i < cleanedRows.length; i = i + 2) {
    if (!cleanedRows[i]) {
      continue;
    }
    const key = cleanedRows[i].replace(":", "");

    if (!cleanedRows[i + 1]) {
      continue;
    }
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

export function getPresetParams(fileString: string, presetPath: string): PresetParam[] {
  const params: PresetParam[] = [];
  const split = fileString.split("*/");

  if (!split[1]) {
    return params;
  }

  const paramBody = split[1]!.split("// Section")[0];

  if (!paramBody) {
    throw new Error("Could not parse preset parameter body");
  }

  const cleanedRows = paramBody.split("\n").filter((el) => el);

  let repeatCounter = 1;
  let currentSection = "HEAD";
  let currentSectionAndKey = "";
  for (let i = 0; i < cleanedRows.length; i++) {
    const paramSplit = cleanedRows[i]!.split("=");
    const key = paramSplit[0]!;
    let value = paramSplit[1]!;

    if (key === "#cm") {
      currentSection = value;
    }
    const param: PresetParam = {
      id: `${currentSection}/${key}`,
      key: key,
      section: currentSection,
      value: value,
      index: i,
      type: "string",
    };
    
    // Some parameters appear more than once in the same section
    // Here we need to add the index of their appearance to get a unique ID
    if (currentSectionAndKey === param.id) {
      currentSectionAndKey = param.id;
      param.id += `/${repeatCounter}`;
      if (repeatCounter === 1) {
        params[params.length -1].id += `/0`;
      }
      repeatCounter++;

      if (!param.id.includes('#mv') && !param.id.includes('#ms')) {
        log.warn(`Unexpected duplicated header + key for: ${param.id} in preset "${presetPath}"`)
      } 

    } else {
      currentSectionAndKey = param.id;
      repeatCounter = 1;
    }

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

export function getPresetBinarySection(fileString: string): string {
  const split = fileString.split("// Section for ugly compressed binary Data\n// DON'T TOUCH THIS\n");
  if (split[1]) {
    return split[1].trim();
  } else {
    return ''
  }
}

//////////////////////////////////////////
// SERIALIZER FUNCTIONS                 //
//////////////////////////////////////////

export function serializePresetToFile(preset: Preset): string {
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

  if (preset.binary) {
    file += preset.binary
  }

  file += ``; // binary end of file marker?

  return file;
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
