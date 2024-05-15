import path from "path";
import os from "os";
import fs from "fs-extra";

export type DetectedPresetLibrary = {
  synthName: SynthNames;
  root: string;
  presets: string;
  userPresets: string;
}

const uheSynthNames = <const> ["ACE", "Bazille", "Diva", "Hive", "Repro-1", "Repro-5", "Zebra2", "ZebraHZ", "Zebralette3", "Zebra3", "TyrellN6", "Podolski", "TripleCheese"]

export type SynthNames = typeof uheSynthNames[number];


/**
 * Detects Preset Library locations
 */
export function detectPresetLibraryLocations(): DetectedPresetLibrary[] {

  const detectedPresetLibraries: DetectedPresetLibrary[] = []

  // TODO: MacOS support is not tested and might not work.
  if (process.platform === 'darwin') {
    const userLocationsToTry = [
      path.join(os.homedir(),`/Library/Audio/Presets/u-he/__SynthName__/`)
    ]

    for (const synthName of uheSynthNames) {
      for (const location of userLocationsToTry) {
        const pathToCheck = location.replace('__SynthName__', synthName)
        if (fs.existsSync(pathToCheck)) {
          detectedPresetLibraries.push({
            synthName: synthName,
            root: pathToCheck,
            presets: `/Library/Audio/Presets/u-he/${synthName}/`,
            userPresets: path.join(pathToCheck, `/UserPresets/${synthName}`),
          })
          if (synthName === 'Repro-1') {
            detectedPresetLibraries.push({
              synthName: 'Repro-5',
              root: pathToCheck,
              presets: `/Library/Audio/Presets/u-he/Repro-5/`,
            userPresets: path.join(pathToCheck, `/UserPresets/Repro-5`),
            })
          }
          break;
        }
      }
    }
    return detectedPresetLibraries;
  } 
  
  // Otherwise try Windows or Linux file system conventions
  const locationsToTry = [
    path.join(os.homedir(),`/Documents/u-he/__SynthName__.data/`),
    path.join(os.homedir(),`/.u-he/__SynthName__.data/`),
    `C:/Program Files/Common Files/VST3/__SynthName__.data/`,
    `C:/Program Files/VSTPlugins/__SynthName__.data/`,
    `C:/Program Files/Common Files/CLAP/u-he/__SynthName__.data/`,
    `C:/VstPlugins/u-he/__SynthName__.data/`,
  ]

  for (const synthName of uheSynthNames) {
    for (const location of locationsToTry) {
      const pathToCheck = location.replace('__SynthName__', synthName)
      if (fs.existsSync(pathToCheck)) {
        detectedPresetLibraries.push({
          synthName: synthName,
          root: pathToCheck,
          presets: path.join(pathToCheck, `/Presets/${synthName}`),
          userPresets: path.join(pathToCheck, `/UserPresets/${synthName}`),
        })
        if (synthName === 'Repro-1') {
          detectedPresetLibraries.push({
            synthName: 'Repro-5',
            root: pathToCheck,
            presets: path.join(pathToCheck, `/Presets/Repro-5`),
            userPresets: path.join(pathToCheck, `/UserPresets/Repro-5`),
          })
        }
        break;
      }
    }
  }

  return detectedPresetLibraries;
}
