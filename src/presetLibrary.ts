const path = require("path");
const os = require("os");
const fs = require("fs-extra");
const fg = require("fast-glob");
import { SynthName } from "./config";
import { preset, parseUhePreset, serializePresetToFile } from "./parser";
import { log } from "./utils/log";

export interface PresetLibrary {
  presetRootFolder: string;
  presets: preset[];
}

export function loadPresetLibrary(synthName: SynthName): PresetLibrary {
  const presetFolder = path.join(
    os.homedir(),
    `/Documents/u-he/${synthName}.data/Presets/${synthName}`
  );

  const presetLibrary: PresetLibrary = {
    presetRootFolder: presetFolder,
    presets: [],
  };

  const presets = fg.sync(["**/*.h2p"], { cwd: presetFolder });

  if (presets.length === 0) {
    log.error('No presets found: ' + presetFolder)
    process.exit(1)
  }

  for (const presetPath of presets) {
    const presetString = fs
      .readFileSync(path.join(presetFolder, presetPath))
      .toString();
    presetLibrary.presets.push(parseUhePreset(presetString, presetPath));
  }

  log.info(`Found and loaded ${presets.length} ${synthName} presets`);

  return presetLibrary;
}

export function writePresetLibrary(presetLibrary: PresetLibrary) {
  log.info(`Writing preset Library with ${presetLibrary.presets.length} presets to ${presetLibrary.presetRootFolder}`)

  for (const preset of presetLibrary.presets) {
    const filePath = path.join(presetLibrary.presetRootFolder, preset.filePath)
    const fileContent = serializePresetToFile(preset)
    fs.outputFileSync(filePath, fileContent)
    log.info(`Written preset: "${filePath}"`)
  }
}
