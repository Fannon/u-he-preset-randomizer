import path from "path"
import fs from "fs-extra"
import fg from "fast-glob"
import { Preset, parseUhePreset, serializePresetToFile } from "./parser.js";
import { SynthNames, detectPresetLibraryLocations } from "./utils/detector.js";
import { log } from "./utils/log.js";

export interface PresetLibrary {
  synth: string;
  userPresetsFolder: string;
  presetsFolder?: string;
  presets: Preset[];
}

export function loadPresetLibrary(synth: SynthNames, pattern: string = '**/*', binary?: boolean): PresetLibrary {

  // Detect correct Preset Library Location
  const location = detectPresetLibraryLocations(synth)[0]

  const presetLibrary: PresetLibrary = {
    synth: synth,
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
        const parsedPreset = parseUhePreset(presetString, presetPath, binary)
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
        const parsedPreset = parseUhePreset(presetString, presetPath, binary)
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
  console.log('----------------------------------------------------------------------')
  for (const preset of presetLibrary.presets) {
    const filePath = path.join(presetLibrary.userPresetsFolder, preset.filePath)
    const fileContent = serializePresetToFile(preset)
    fs.outputFileSync(filePath, fileContent)
    console.log(`Written: ${filePath}`)
  }
}
