const path = require("path");
const os = require("os");
const fs = require("fs-extra");
const fg = require("fast-glob");
import { SynthName } from "./config";
import { Preset, parseUhePreset, serializePresetToFile } from "./parser";
import { log } from "./utils/log";

export interface PresetLibrary {
  presetRootFolder: string;
  factoryLibraryRootFolder?: string;
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
    presetRootFolder: userPresetsFolder,
    factoryLibraryRootFolder: presetFolder,
    presets: [],
  };

  const libraryPresets = fg.sync(["**/*.h2p"], { cwd: presetFolder });
  for (const presetPath of libraryPresets) {
    try {
      const presetString = fs
      .readFileSync(path.join(presetFolder, presetPath))
      .toString();
      const parsedPreset = parseUhePreset(presetString, presetPath)
      if (parsedPreset.params.length && parsedPreset.meta.length) {
        presetLibrary.presets.push(parsedPreset);
      }
    } catch (err) {
      log.warn(`Could not load and parse preset: ${presetPath}`, err)
    }
  }

  const userPresets = fg.sync(["**/*.h2p"], { cwd: userPresetsFolder });
  for (const presetPath of userPresets) {
    try {
      const presetString = fs
      .readFileSync(path.join(userPresetsFolder, presetPath))
      .toString();
      const parsedPreset = parseUhePreset(presetString, presetPath)
      if (parsedPreset.params.length && parsedPreset.meta.length) {
        presetLibrary.presets.push(parsedPreset);
      }
    } catch (err) {
      log.warn(`Could not load and parse preset: ${presetPath}`, err)
    }
  }

  if (presetLibrary.presets.length === 0) {
    log.error('No presets found: ' + presetFolder)
    process.exit(1)
  }

  console.log(`Found and loaded ${presetLibrary.presets.length} ${synth} presets`);

  return presetLibrary;
}

export function writePresetLibrary(presetLibrary: PresetLibrary) {
  for (const preset of presetLibrary.presets) {
    const filePath = path.join(presetLibrary.presetRootFolder, preset.filePath)
    const fileContent = serializePresetToFile(preset)
    fs.outputFileSync(filePath, fileContent)
    console.log(`Written: ${filePath}`)
  }
}
