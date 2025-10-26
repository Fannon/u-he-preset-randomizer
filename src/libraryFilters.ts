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
  console.log(
    `Narrowed down by category "${category}" to ${filteredPresets.length} presets`,
  );
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
  console.log(
    `Narrowed down by author "${author}" to ${filteredPresets.length} presets`,
  );
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
      return presetLibrary.presets;
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

  const favoritesLabel = Array.isArray(favorites)
    ? favorites.join(', ')
    : favorites;
  console.log(
    `Narrowed down via favorite file "${favoritesLabel}" to ${filteredPresets.length} presets`,
  );
  return filteredPresets;
}
