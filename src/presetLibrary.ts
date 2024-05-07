const path = require("path");
const fs = require("fs-extra");
const fg = require("fast-glob");
import { Preset, parseUhePreset, serializePresetToFile } from "./parser";
import { detectPresetLibraryLocations } from "./utils/detector";
import { log } from "./utils/log";

export interface PresetLibrary {
  userPresetsFolder: string;
  presetsFolder?: string;
  presets: Preset[];
}

export function loadPresetLibrary(synth: string, pattern: string = '**/*'): PresetLibrary {

  // Detect correct Preset Library Location
  const location = detectPresetLibraryLocations(synth)[synth]

  const presetLibrary: PresetLibrary = {
    userPresetsFolder: location.userPresets,
    presetsFolder: location.presets,
    presets: [],
  };

  // Load preset library
  const libraryPresets = fg.sync([`${pattern}.h2p`], { cwd:  presetLibrary.presetsFolder });
  if (libraryPresets.length > 0) {
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
  } else {
    log.warn(`Could not find presets with glob pattern: ${pattern} in library: ${presetLibrary.presetsFolder}`)
  }

  // Load user preset library
  const userPresets = fg.sync([`${pattern}.h2p`], { cwd: presetLibrary.userPresetsFolder });
  if (userPresets.length > 0) {
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
  } else {
    log.warn(`Could not find presets with glob pattern: ${pattern} in user library: ${presetLibrary.userPresetsFolder}`)
  }

  if (presetLibrary.presets.length === 0) {
    log.error(`No presets found with glob pattern: ${pattern} in` + presetLibrary.presetsFolder)
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
