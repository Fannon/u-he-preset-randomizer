import path from "path"
import fs from "fs-extra"
import fg from "fast-glob"
import { Preset, isValidPreset, parseUhePreset, serializePresetToFile } from "./parser.js";
import { SynthNames, detectPresetLibraryLocations } from "./utils/detector.js";
import { Config } from "./config.js";

export interface PresetLibrary {
  synth: string;
  rootFolder: string;
  userPresetsFolder: string;
  presetsFolder?: string;
  presets: Preset[];
  favorites: FavoriteFile[]
}

interface FavoriteFile {
  fileName: string;
  presets: Array<{
    name: string;
    path: string;
  }>
}

export interface UheFavoriteFile {
  // Not documenting the properties that are irrelevant to this tool
  "tag-category-fav": {
    [favoriteCategory: string]: UheFavoriteFileEntry[]
  }
}
export interface UheFavoriteFileEntry {
  "db_path": string;
  "name": string;
}

export function loadPresetLibrary(synth: SynthNames, config: Config): PresetLibrary {
  let pattern = config.pattern || '**/*';

  // Detect correct Preset Library Location
  const location = detectPresetLibraryLocations(config).find(el => el.synthName.toLowerCase() === synth.toLowerCase())

  console.log(`> Loading preset library for ${synth} in ${location.root} with pattern "${pattern}"`);

  const presetLibrary: PresetLibrary = {
    synth: location.synthName,
    rootFolder: location.root,
    userPresetsFolder: location.userPresets,
    presetsFolder: location.presets,
    presets: [],
    favorites: [],
  };

  let librarySelector;
  if (pattern.startsWith('/User/')) {
    librarySelector = 'User'
    pattern = pattern.replace('/User/', '')
  } else if (pattern.startsWith('/Local/')) {
    librarySelector = 'Local'
    pattern = pattern.replace('/Local/', '')
  }

  if (pattern === '/**/*') {
    pattern = '**/*'
  }

  pattern = pattern.split('//').join('/')

  // Load preset library
  const libraryPresets = fg.sync([`${pattern}.h2p`], { cwd:  presetLibrary.presetsFolder }).map((el) => {
    return `/Local/${el}`
  })
  if (librarySelector !== 'User') {
    if (libraryPresets.length > 0) {
      for (const presetPath of libraryPresets) {
        try {
          const presetString = fs.readFileSync(path.join(presetLibrary.presetsFolder, presetPath.replace('/Local/', ''))).toString();
          const parsedPreset = parseUhePreset(presetString, presetPath, config.binary)
          if (isValidPreset(parsedPreset)) {
            presetLibrary.presets.push(parsedPreset);
          }
        } catch (err) {
          console.warn(`Could not load and parse preset: ${presetPath}`, err)
        }
      }
    } else {
      console.warn(`Could not find presets with glob pattern: ${pattern} in library: ${presetLibrary.presetsFolder}`)
    }
  }

  // Load user preset library
  const userPresets = fg.sync([`${pattern}.h2p`], { 
    cwd: presetLibrary.userPresetsFolder,
    ignore: ['RANDOM/**/*'],
  }).map((el) => {
    return `/User/${el}`
  })
  if (librarySelector !== 'Local') {
    if (userPresets.length > 0) {
      for (const presetPath of userPresets) {
        try {
          const presetString = fs.readFileSync(path.join(presetLibrary.userPresetsFolder, presetPath.replace('/User/', ''))).toString();
          const parsedPreset = parseUhePreset(presetString, presetPath, config.binary)
          if (isValidPreset(parsedPreset)) {
            presetLibrary.presets.push(parsedPreset);
          }
        } catch (err) {
          console.warn(`Could not load and parse preset: ${presetPath}`, err)
        }
      }
    } else {
      console.warn(`Could not find presets with glob pattern: ${pattern} in user library: ${presetLibrary.userPresetsFolder}`)
    }
  }

  if (presetLibrary.presets.length === 0) {
    console.error(`Error: No presets found with glob pattern: ${pattern} in` + presetLibrary.presetsFolder)
    process.exit(1)
  }

  // Search and load .uhe-fav files
  const favorites = fg.sync([`**/*.uhe-fav`], { cwd: presetLibrary.rootFolder }).sort()
  for (const favoriteFile of favorites) {
    const path = `${presetLibrary.rootFolder}/${favoriteFile}`;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const favJson = fs.readJSONSync(path) as UheFavoriteFile
      for (const favCategory in favJson['tag-category-fav']) {
        presetLibrary.favorites.push({
          fileName: favoriteFile,
          presets: favJson['tag-category-fav'][favCategory].map((el) => {
            return {
              name: el.name,
              path: el.db_path,
            }
          })
        })
      }
    } catch (err) {
      console.warn(`Could not read / parse ${path}`);
    }
  }

  console.log(`> Found and loaded ${presetLibrary.presets.length} presets and ${presetLibrary.favorites.length} favorite files`);

  return presetLibrary;
}

export function writePresetLibrary(presetLibrary: PresetLibrary) {
  console.log('----------------------------------------------------------------------')
  for (const preset of presetLibrary.presets) {
    const filePath = path.join(presetLibrary.userPresetsFolder, preset.filePath)
    const fileContent = serializePresetToFile(preset)
    fs.outputFileSync(filePath, fileContent)
    console.log(`Written: ${path.normalize(filePath)}`)
  }
}
