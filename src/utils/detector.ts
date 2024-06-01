import path from "path";
import os from "os";
import fs from "fs-extra";
import { Config } from "src/config.js";
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
export function detectPresetLibraryLocations(config: Config): DetectedPresetLibrary[] {

  const detectedPresetLibraries: DetectedPresetLibrary[] = []

  if (process.platform === 'darwin') {
    const userLocationsToTry: string[] = []
    if (config.customFolder) {
      userLocationsToTry.push(config.customFolder + '/__SynthName__/')
      userLocationsToTry.push(config.customFolder + '/../__SynthName__/')
    }
    userLocationsToTry.push(path.join(os.homedir(),`/Library/Audio/Presets/u-he/__SynthName__/`))
    if (config.customFolder) {
      userLocationsToTry.push(config.customFolder)
    }

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
            if (config.debug) {
              console.debug(chalk.gray(`> Found synth Repro-5 in ${pathToCheck}`))
            }
          }
          if (config.debug) {
            console.debug(chalk.gray(`> Found synth ${synthName} in ${pathToCheck}`))
          }
          if (config.customFolder && config.customFolder === pathToCheck) {
            console.warn(chalk.yellow(`Warning: --custom-folder fall back to expect ${synthName} in ${pathToCheck}. This might not work if the path is wrong.`))
          } 
          break;
        }
      }
    }
    return detectedPresetLibraries;
  } 
  
  // Otherwise try Windows or Linux file system conventions
  const locationsToTry: string[] = []

  if (config.customFolder) {
    locationsToTry.push(config.customFolder + '/__SynthName__.data/')
    locationsToTry.push(path.resolve(config.customFolder + '/../__SynthName__.data/'))
  }

  // Windows locations
  locationsToTry.push(path.join(os.homedir(),`/Documents/u-he/__SynthName__.data/`))
  locationsToTry.push(`C:/Program Files/Common Files/VST3/__SynthName__.data/`)
  locationsToTry.push(`C:/Program Files/VSTPlugins/__SynthName__.data/`)
  locationsToTry.push(`C:/Program Files/Common Files/CLAP/u-he/__SynthName__.data/`)
  locationsToTry.push( `C:/VstPlugins/u-he/__SynthName__.data/`)

  // Linux locations ?
  locationsToTry.push(path.join(os.homedir(),`/.u-he/__SynthName__.data/`))
  locationsToTry.push(`C:/users/VstPlugins/__SynthName__.data/`) // Wine

  if (config.customFolder) {
    // Last ditch effort, to just take the custom folder directly
    locationsToTry.push(config.customFolder)
  }

  for (const synthName of uheSynthNames) {
    for (const location of locationsToTry) {
      const pathToCheck = location.replace('__SynthName__', synthName)
      if (fs.existsSync(pathToCheck)) {
        if (config.debug) {
          console.debug(chalk.gray(`> Found synth ${synthName} in ${pathToCheck}`))
        }
        if (config.customFolder && config.customFolder === pathToCheck) {
          console.warn(chalk.yellow(`Warning: --custom-folder fall back to expect ${synthName} in ${pathToCheck}. This might not work if the path is wrong.`))
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
