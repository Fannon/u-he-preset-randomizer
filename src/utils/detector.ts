import path from "path";
import os from "os";
import fs from "fs-extra";
import { Config } from "../config.js";
import chalk from "chalk"

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
export function detectPresetLibraryLocations(config: Config, locationsTried: string[] = []): DetectedPresetLibrary[] {

  const detectedPresetLibraries: DetectedPresetLibrary[] = []

  if (process.platform === 'darwin') {
    const userlocationsTried: string[] = []
    if (config.customFolder) {
      userlocationsTried.push(config.customFolder + '/__SynthName__/')
      userlocationsTried.push(config.customFolder + '/../__SynthName__/')
    }
    userlocationsTried.push(path.join(os.homedir(),`/Library/Audio/Presets/u-he/__SynthName__/`))

    for (const synthName of uheSynthNames) {
      for (const location of userlocationsTried) {
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
            if (config.debug) {
              console.debug(chalk.gray(`> Found synth Repro-5 in ${pathToCheck}`))
            }
          }
          if (config.debug) {
            console.debug(chalk.gray(`> Found synth ${synthName} in ${pathToCheck}`))
          }
          break;
        }
      }
    }
    return detectedPresetLibraries;
  } 
  
  // Otherwise try Windows or Linux file system conventions

  if (config.customFolder) {
    locationsTried.push(config.customFolder + '/__SynthName__.data/')
    locationsTried.push(path.resolve(config.customFolder + '/../__SynthName__.data/'))
  }

  // Windows locations
  locationsTried.push(path.join(os.homedir(),`/Documents/u-he/__SynthName__.data/`))
  locationsTried.push(`C:/Program Files/Common Files/VST3/__SynthName__.data/`)
  locationsTried.push(`C:/Program Files/VSTPlugins/__SynthName__.data/`)
  locationsTried.push(`C:/Program Files/Common Files/CLAP/u-he/__SynthName__.data/`)
  locationsTried.push( `C:/VstPlugins/u-he/__SynthName__.data/`)

  // Linux locations ?
  locationsTried.push(path.join(os.homedir(),`/.u-he/__SynthName__.data/`))
  locationsTried.push(`C:/users/VstPlugins/__SynthName__.data/`) // Wine

  // WSL2 locations (Windows filesystem mounted in Linux)
  if (process.platform === 'linux' && fs.existsSync('/mnt/c/')) {
    locationsTried.push(`/mnt/c/Program Files/Common Files/VST3/__SynthName__.data/`)
    locationsTried.push(`/mnt/c/Program Files/VSTPlugins/__SynthName__.data/`)
    locationsTried.push(`/mnt/c/Program Files/Common Files/CLAP/u-he/__SynthName__.data/`)
    locationsTried.push(`/mnt/c/VstPlugins/u-he/__SynthName__.data/`)
    // Hack: My own Google Drive location that isn't detected otherwise (no symlink following in WSL)
    locationsTried.push(`/mnt/g/My Drive/Musik/u-he/__SynthName__.data/`)
  }

  for (const synthName of uheSynthNames) {
    for (const location of locationsTried) {
      const pathToCheck = location.replace('__SynthName__', synthName)
      if (fs.existsSync(pathToCheck)) {
        if (config.debug) {
          console.debug(chalk.gray(`> Found synth ${synthName} in ${pathToCheck}`))
        }
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
          if (config.debug) {
            console.debug(chalk.gray(`> Found synth Repro-5 in ${pathToCheck}`))
          }
        }
        break;
      }
    }
  }

  return detectedPresetLibraries;
}
