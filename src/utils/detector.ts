import * as path from "path";
import * as os from "os";
import * as fs from "fs-extra";

export interface DetectedPresetLibraries {
  [name: string]: {
    root: string;
    presets: string;
    userPresets: string;
  };
}

const uheSynthNames = ["Diva", "Zebra2", "ZebraHZ", "Hive", "Repro-1", "Bazille", "Zebralette3", "Zebra3", "TyrellN6"]

/**
 * Detects Preset Library locations
 * 
 * TODO: Currently no MacOS support.
 */
export function detectPresetLibraryLocations(synthName?: string): DetectedPresetLibraries {

  const detectedPresetLibraries: DetectedPresetLibraries = {}

  const locationsToTry = [
    path.join(os.homedir(),`/Documents/u-he/__SynthName__.data/`),
    `C:/Program Files/Common Files/VST3/__SynthName__.data/`,
    `C:/Program Files/VSTPlugins/__SynthName__.data/`,
    `C:/Program Files/Common Files/CLAP/u-he/__SynthName__.data/`,
    `C:/VstPlugins/u-he/__SynthName__.data/`,
  ]

  const synthNamesToTry = synthName ? [synthName] : uheSynthNames;

  for (const synthName of synthNamesToTry) {
    for (const location of locationsToTry) {
      const pathToCheck = location.replace('__SynthName__', synthName)
      if (fs.existsSync(pathToCheck)) {
        detectedPresetLibraries[synthName] = {
          root: pathToCheck,
          presets: path.join(pathToCheck, `/Presets/${synthName}`),
          userPresets: path.join(pathToCheck, `/UserPresets/${synthName}`),
        }
        break;
      }
    }
  }

  return detectedPresetLibraries;
}
