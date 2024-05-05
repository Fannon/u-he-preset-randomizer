const path = require("path");
const fs = require("fs-extra");
const fg = require("fast-glob");
import { SynthName } from "./config";
import { Preset, parseUhePreset, serializePresetToFile } from "./parser";
import { detectPresetLibraryLocations } from "./utils/detector";
import { log } from "./utils/log";

export interface PresetLibrary {
  userPresetsFolder: string;
  presetsFolder?: string;
  presets: Preset[];
}

export function loadPresetLibrary(synth: SynthName): PresetLibrary {

  // Detect correct Preset Library Location
  const location = detectPresetLibraryLocations(synth)[synth]

  const presetLibrary: PresetLibrary = {
    userPresetsFolder: location.userPresets,
    presetsFolder: location.presets,
    presets: [],
  };

  // Load preset library
  const libraryPresets = fg.sync(["**/*.h2p"], { cwd:  presetLibrary.presetsFolder });
  for (const presetPath of libraryPresets) {
    try {
      const presetString = fs
      .readFileSync(path.join( presetLibrary.presetsFolder, presetPath))
      .toString();
      const parsedPreset = parseUhePreset(presetString, presetPath)
      if (parsedPreset.params.length && parsedPreset.meta.length) {
        presetLibrary.presets.push(parsedPreset);
      }
    } catch (err) {
      log.warn(`Could not load and parse preset: ${presetPath}`, err)
    }
  }

  // Load user preset library
  const userPresets = fg.sync(["**/*.h2p"], { cwd: presetLibrary.userPresetsFolder });
  for (const presetPath of userPresets) {
    try {
      const presetString = fs
      .readFileSync(path.join(presetLibrary.userPresetsFolder, presetPath))
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
    log.error('No presets found: ' + presetLibrary.presetsFolder)
    process.exit(1)
  }

  console.log(`Found and loaded ${presetLibrary.presets.length} ${synth} presets in ${location.root}`);

  return presetLibrary;
}

export function writePresetLibrary(presetLibrary: PresetLibrary) {
  for (const preset of presetLibrary.presets) {
    const filePath = path.join(presetLibrary.userPresetsFolder, preset.filePath)
    const fileContent = serializePresetToFile(preset)
    fs.outputFileSync(filePath, fileContent)
    console.log(`Written: ${filePath}`)
  }
}
