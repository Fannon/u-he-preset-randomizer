import chalk from 'chalk';
import type { Preset } from './parser.js';
import type { PresetLibrary } from './presetLibrary.js';

export function narrowDownByCategory(
  presetLibrary: PresetLibrary,
  category: string,
) {
  const filteredPresets = presetLibrary.presets.filter((el) => {
    if (!el.categories.length) {
      return false;
    }
    for (const ownCategory of el.categories) {
      if (ownCategory.startsWith(category)) {
        return true;
      }
    }
    return false;
  });
  return filteredPresets;
}

export function narrowDownByAuthor(
  presetLibrary: PresetLibrary,
  author: string,
) {
  const filteredPresets = presetLibrary.presets.filter((el) => {
    const authorMeta = el.meta.find((meta) => meta.key === 'Author');
    return authorMeta?.value === author;
  });
  return filteredPresets;
}

export function narrowDownByFavoritesFile(
  presetLibrary: PresetLibrary,
  favorites: string | string[],
) {
  const favList = Array.isArray(favorites) ? favorites : [favorites];

  const favPresets: { path: string; name: string }[] = [];
  const filteredPresets: Preset[] = [];

  for (const favoriteFilePath of favList) {
    const favoriteFile = presetLibrary.favorites.find(
      (el) => el.fileName === favoriteFilePath,
    );

    if (favoriteFile) {
      favPresets.push(...favoriteFile.presets);
    } else {
      console.error(
        chalk.red(`Error: Could not find favorites file: ${favoriteFilePath}`),
      );
      return []; // Return empty array instead of all presets
    }
  }

  for (const preset of presetLibrary.presets) {
    for (const fav of favPresets) {
      if (
        preset.filePath.toLowerCase() ===
        `${fav.path.toLowerCase()}/${fav.name.toLowerCase()}.h2p`
      ) {
        filteredPresets.push(preset);
        break;
      }
    }
  }

  return filteredPresets;
}
