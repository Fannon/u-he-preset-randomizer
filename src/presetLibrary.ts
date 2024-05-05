const path = require("path");
const os = require("os");
const fs = require("fs-extra");
const fg = require("fast-glob");
import { SynthName } from "./config";
import { Preset, parseUhePreset, serializePresetToFile } from "./parser";
import { log } from "./utils/log";

export interface PresetLibrary {
  presetRootFolder: string;
  presets: Preset[];
}

export function loadPresetLibrary(synth: SynthName): PresetLibrary {
  const presetFolder = path.join(
    os.homedir(),
    `/Documents/u-he/${synth}.data/Presets/${synth}`
  );
  const userPresetsFolder = path.join(
    os.homedir(),
    `/Documents/u-he/${synth}.data/UserPresets/${synth}`
  );

  const presetLibrary: PresetLibrary = {
    presetRootFolder: presetFolder,
    presets: [],
  };

  const libraryPresets = fg.sync(["**/*.h2p"], { cwd: presetFolder });
  for (const presetPath of libraryPresets) {
    const presetString = fs
    .readFileSync(path.join(presetFolder, presetPath))
    .toString();
    presetLibrary.presets.push(parseUhePreset(presetString, presetPath));
  }

  const userPresets = fg.sync(["**/*.h2p"], { cwd: userPresetsFolder });
  for (const presetPath of userPresets) {
    const presetString = fs
    .readFileSync(path.join(userPresetsFolder, presetPath))
    .toString();
    presetLibrary.presets.push(parseUhePreset(presetString, presetPath));
  }

  if (presetLibrary.presets.length === 0) {
    log.error('No presets found: ' + presetFolder)
    process.exit(1)
  }

  console.log(`Found and loaded ${presetLibrary.presets.length} ${synth} presets`);

  return presetLibrary;
}

export function writePresetLibrary(presetLibrary: PresetLibrary) {
  console.log(`Generated ${presetLibrary.presets.length} presets. Writing to ${presetLibrary.presetRootFolder}`)

  for (const preset of presetLibrary.presets) {
    const filePath = path.join(presetLibrary.presetRootFolder, preset.filePath)
    const fileContent = serializePresetToFile(preset)
    fs.outputFileSync(filePath, fileContent)
    console.log(`Written preset: ${filePath}`)
  }
}
