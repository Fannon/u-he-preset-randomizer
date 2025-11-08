import * as path from 'node:path';
import chalk from 'chalk';

export interface Preset {
  /** Relative filePath to preset folder */
  filePath: string;
  /** Preset file name, without file extension or sub-folders */
  presetName: string;
  categories: string[];
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
  type: 'string' | 'float' | 'integer';
}

//////////////////////////////////////////
// PARSER FUNCTIONS                     //
//////////////////////////////////////////

/**
 * Parses a u-he preset file and returns a Preset object.
 *
 * @param fileString - The content of the preset file as a string.
 * @param filePath - The path to the preset file.
 * @param binary - A boolean indicating whether to include the binary section of the preset file.
 * @returns The parsed Preset object.
 */
export function parseUhePreset(
  fileString: string,
  filePath: string,
  binary: boolean,
): Preset {
  const meta = getPresetMetadata(fileString);
  let categories: string[] = [];
  const categoriesMeta = meta.find((el) => el.key === 'Categories');
  if (categoriesMeta?.value) {
    if (Array.isArray(categoriesMeta.value)) {
      categories = categoriesMeta.value;
    } else {
      categories.push(categoriesMeta.value);
    }
  }
  return {
    filePath: filePath,
    presetName: path.parse(filePath).name,
    meta: meta,
    params: getPresetParams(fileString, filePath),
    binary: binary ? getPresetBinarySection(fileString) : undefined,
    categories: categories,
  };
}
/**
 * Retrieves the metadata entries from the given u-he preset file string.
 *
 * @param fileString - The string representation of the file.
 * @returns An array of PresetMetaEntry objects representing the metadata entries.
 */
export function getPresetMetadata(fileString: string): PresetMetaEntry[] {
  const split = fileString.split('*/');
  const metadataHeader =
    split[0]?.replace('/*@Meta', '').replace('/*@meta', '') ?? '';

  const cleanedRows = metadataHeader.split('\n').filter((el) => el);

  const metadata: PresetMetaEntry[] = [];
  for (let i = 0; i < cleanedRows.length; i = i + 2) {
    const keyRow = cleanedRows[i];
    if (!keyRow) {
      continue;
    }
    const key = keyRow.replace(':', '');

    const valueRow = cleanedRows[i + 1];
    if (!valueRow) {
      continue;
    }
    let value: string | string[] = valueRow.split("'").join('');
    if (value.includes(', ')) {
      value = value.split(', ');
    }
    metadata.push({
      key,
      value,
    });
  }
  return metadata;
}

export function getPresetParams(
  fileString: string,
  presetPath: string,
): PresetParam[] {
  const params: PresetParam[] = [];
  const split = fileString.split('*/');

  if (!split[1]) {
    return params;
  }

  const paramBody = split[1].split('// Section')[0];

  if (!paramBody) {
    throw new Error('Could not parse preset parameter body');
  }

  const cleanedRows = paramBody.split('\n').filter((el) => el);

  let repeatCounter = 1;
  let currentSection = 'HEAD';
  let currentSectionAndKey = '';
  for (let i = 0; i < cleanedRows.length; i++) {
    const row = cleanedRows[i];
    if (!row) continue;

    const paramSplit = row.split('=');
    const key = paramSplit[0];
    const value = paramSplit[1];

    if (!key || !value) continue;

    if (key === '#cm') {
      currentSection = value;
    }
    const param: PresetParam = {
      id: `${currentSection}/${key}`,
      key: key,
      section: currentSection,
      value: value,
      index: i,
      type: 'string',
    };

    // Some parameters appear more than once in the same section
    // Here we need to add the index of their appearance to get a unique ID
    if (currentSectionAndKey === param.id) {
      currentSectionAndKey = param.id;
      param.id += `/${repeatCounter}`;
      if (repeatCounter === 1 && params.length > 0) {
        const lastParam = params[params.length - 1];
        if (lastParam) {
          lastParam.id += `/0`;
        }
      }
      repeatCounter++;

      if (!param.id.includes('#mv') && !param.id.includes('#ms')) {
        console.warn(
          chalk.yellow(
            `Unexpected duplicated header + key for: ${param.id} in preset "${presetPath}"`,
          ),
        );
      }
    } else {
      currentSectionAndKey = param.id;
      repeatCounter = 1;
    }

    if (isInt(value)) {
      param.value = parseInt(value, 10);
      param.type = 'integer';
    } else if (isNumeric(value)) {
      param.value = parseFloat(value);
      param.type = 'float';
    }

    params.push(param);
  }
  return params;
}

export function getPresetBinarySection(fileString: string): string {
  const split = fileString.split(
    "// Section for ugly compressed binary Data\n// DON'T TOUCH THIS\n",
  );
  if (split[1]) {
    return split[1].trim();
  } else {
    return '';
  }
}

//////////////////////////////////////////
// SERIALIZER FUNCTIONS                 //
//////////////////////////////////////////

export function serializePresetToFile(preset: Preset): string {
  let file = '';

  // Add meta header
  file += '/*@Meta\n\n';
  for (const entry of preset.meta) {
    file += `${entry.key}:\n`;
    if (Array.isArray(entry.value)) {
      file += `'${entry.value.join(', ')}'\n\n`;
    } else {
      file += `'${entry.value}'\n\n`;
    }
  }
  file += '*/\n\n';

  // Add params
  for (const param of preset.params) {
    file += `${param.key}=${param.value}\n`;
  }

  // Add footer

  file += '\n\n\n\n';
  file += '// Section for ugly compressed binary Data\n';
  file += "// DON'T TOUCH THIS\n\n";

  if (preset.binary) {
    file += preset.binary;
  }

  file += ``; // binary end of file marker?

  return file;
}

export function isValidPreset(preset: Preset) {
  if (
    !preset.params ||
    !preset.meta ||
    preset.params.length === 0 ||
    preset.meta.length === 0
  ) {
    console.warn(
      chalk.yellow(
        `Warning: Ignoring preset ${preset.filePath} due to empty params or meta (params: ${preset.params?.length || 0}, meta: ${preset.meta?.length || 0})`,
      ),
    );
    return false;
  }
  for (const param of preset.params) {
    if (
      typeof param.value === 'string' &&
      param.value.includes('[object Object]')
    ) {
      console.warn(
        chalk.yellow(
          `Warning: Ignoring preset ${preset.filePath} due to invalid value: ${param.id}`,
        ),
      );
      return false;
    }
    if (typeof param.value === 'string' && param.value.includes('undefined')) {
      console.warn(
        chalk.yellow(
          `Warning: Ignoring preset ${preset.filePath} due to invalid value: ${param.id}`,
        ),
      );
      return false;
    }
    if (param.id.includes('[object Object]')) {
      console.warn(
        chalk.yellow(
          `Warning: Ignoring preset ${preset.filePath} due to invalid parameter: ${param.id}`,
        ),
      );
      return false;
    }
  }
  return true;
}

//////////////////////////////////////////
// HELPER FUNCTIONS                     //
//////////////////////////////////////////

export function isInt(value: unknown): boolean {
  return (
    !Number.isNaN(value as number) &&
    ((x) => (x | 0) === x)(parseFloat(value as string))
  );
}

export function isNumeric(value: unknown): boolean {
  const num = parseFloat(value as string);
  return !Number.isNaN(num) && Number.isFinite(num);
}
