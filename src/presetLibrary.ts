import path from 'node:path';
import chalk from 'chalk';
import fg from 'fast-glob';
import fs from 'fs-extra';
import type { Config } from './config.js';
import {
  isValidPreset,
  type Preset,
  parseUhePreset,
  serializePresetToFile,
} from './parser.js';
import {
  detectPresetLibraryLocations,
  type SynthNames,
} from './utils/detector.js';

export interface PresetLibrary {
  synth: string;
  rootFolder: string;
  userPresetsFolder: string;
  presetsFolder?: string;
  presets: Preset[];
  favorites: FavoriteFile[];
}

interface FavoriteFile {
  fileName: string;
  presets: {
    name: string;
    path: string;
  }[];
}

export interface UheFavoriteFile {
  // Not documenting the properties that are irrelevant to this tool
  'tag-category-fav': Record<string, UheFavoriteFileEntry[]>;
}
export interface UheFavoriteFileEntry {
  db_path: string;
  name: string;
}

export function loadPresetLibrary(
  synth: SynthNames,
  config: Config,
): PresetLibrary {
  let pattern = config.pattern ?? '**/*';

  // Detect correct Preset Library Location
  const location = detectPresetLibraryLocations(config).find(
    (el) => el.synthName.toLowerCase() === synth.toLowerCase(),
  );

  if (!location) {
    throw new Error(
      `Could not find preset library location for synth: ${synth}`,
    );
  }

  const presetLibrary: PresetLibrary = {
    synth: location.synthName,
    rootFolder: location.root,
    userPresetsFolder: location.userPresets,
    presetsFolder: location.presets,
    presets: [],
    favorites: [],
  };

  let librarySelector: 'User' | 'Local' | undefined;
  if (pattern.startsWith('/User/')) {
    librarySelector = 'User';
    pattern = pattern.replace('/User/', '');
  } else if (pattern.startsWith('/Local/')) {
    librarySelector = 'Local';
    pattern = pattern.replace('/Local/', '');
  }

  if (pattern === '/**/*') {
    pattern = '**/*';
  }

  pattern = pattern.split('//').join('/');

  // Load preset library
  const libraryPresets = fg
    .sync([`${pattern}.h2p`], { cwd: presetLibrary.presetsFolder ?? '' })
    .map((el) => {
      return `/Local/${el}`;
    });
  if (librarySelector !== 'User' && presetLibrary.presetsFolder) {
    if (libraryPresets.length > 0) {
      for (const presetPath of libraryPresets) {
        try {
          const presetString = fs
            .readFileSync(
              path.join(
                presetLibrary.presetsFolder,
                presetPath.replace('/Local/', ''),
              ),
            )
            .toString();
          const parsedPreset = parseUhePreset(
            presetString,
            presetPath,
            config.binary ?? false,
          );
          if (isValidPreset(parsedPreset)) {
            presetLibrary.presets.push(parsedPreset);
          }
        } catch (err) {
          console.warn(
            chalk.yellow(`Could not load and parse preset: ${presetPath}`, err),
          );
        }
      }
    } else {
      console.warn(
        chalk.yellow(
          `Could not find presets with glob pattern: ${pattern}.h2p in library: ${presetLibrary.presetsFolder}`,
        ),
      );
    }
  }

  // Load user preset library
  const userPresets = fg
    .sync([`${pattern}.h2p`], {
      cwd: presetLibrary.userPresetsFolder,
      ignore: ['RANDOM/**/*'],
    })
    .map((el) => {
      return `/User/${el}`;
    });
  if (librarySelector !== 'Local') {
    if (userPresets.length > 0) {
      for (const presetPath of userPresets) {
        try {
          const presetString = fs
            .readFileSync(
              path.join(
                presetLibrary.userPresetsFolder,
                presetPath.replace('/User/', ''),
              ),
            )
            .toString();
          const parsedPreset = parseUhePreset(
            presetString,
            presetPath,
            config.binary ?? false,
          );
          if (isValidPreset(parsedPreset)) {
            presetLibrary.presets.push(parsedPreset);
          }
        } catch (err) {
          console.warn(
            chalk.yellow(`Could not load and parse preset: ${presetPath}`),
            err,
          );
        }
      }
    } else {
      console.warn(
        chalk.yellow(
          `Could not find presets with glob pattern: ${pattern}.h2p in user library: ${presetLibrary.userPresetsFolder}`,
        ),
      );
    }
  }

  if (presetLibrary.presets.length === 0) {
    console.error(
      chalk.red(
        `Error: No presets found with glob pattern: ${pattern}.h2p in ` +
          presetLibrary.presetsFolder,
      ),
    );
    process.exit(1);
  }

  // Search and load .uhe-fav files
  const favorites = fg
    .sync([`**/*.uhe-fav`], { cwd: presetLibrary.rootFolder })
    .sort();
  for (const favoriteFile of favorites) {
    const path = `${presetLibrary.rootFolder}/${favoriteFile}`;
    try {
      const favJson = fs.readJSONSync(path) as UheFavoriteFile;
      for (const favCategory in favJson['tag-category-fav']) {
        const categoryPresets = favJson['tag-category-fav'][favCategory];
        if (categoryPresets) {
          presetLibrary.favorites.push({
            fileName: favoriteFile,
            presets: categoryPresets.map((el) => {
              return {
                name: el.name,
                path: el.db_path,
              };
            }),
          });
        }
      }
    } catch (err) {
      console.warn(chalk.yellow(`Could not read / parse: ${path}`), err);
    }
  }

  return presetLibrary;
}

/**
 * Validates that a file path is safe and stays within the target directory.
 * Prevents path traversal attacks using ../ or absolute paths.
 */
function validateSafePath(targetDir: string, filePath: string): string {
  // Remove leading slash if present (these are treated as relative paths in this codebase)
  const normalizedFilePath = filePath.startsWith('/')
    ? filePath.slice(1)
    : filePath;

  // Resolve both paths to absolute paths to handle relative paths and symlinks
  const resolvedTargetDir = path.resolve(targetDir);
  const resolvedFilePath = path.resolve(targetDir, normalizedFilePath);

  // Ensure the resolved file path starts with the target directory
  if (!resolvedFilePath.startsWith(resolvedTargetDir + path.sep)) {
    throw new Error(
      `Path traversal detected: "${filePath}" attempts to write outside "${targetDir}"`,
    );
  }

  return resolvedFilePath;
}

export function writePresetLibrary(presetLibrary: PresetLibrary): string[] {
  const writtenFiles: string[] = [];
  for (const preset of presetLibrary.presets) {
    // Validate the file path to prevent path traversal attacks
    const filePath = validateSafePath(
      presetLibrary.userPresetsFolder,
      preset.filePath,
    );
    const fileContent = serializePresetToFile(preset);
    fs.outputFileSync(filePath, fileContent);
    writtenFiles.push(path.normalize(filePath));
  }
  return writtenFiles;
}
