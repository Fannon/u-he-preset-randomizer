## [unreleased]

- **FIXED**: narrowDownByAuthor function: Removed the incorrect `!el.categories.length` check that was preventing presets without categories from being included when they had author metadata
- **FIXED**: The narrowDownByFavoritesFile function was returning all presets when a favorites file wasn't found, instead of an empty array. This was dangerous behavior that could silently include unintended presets.

## [1.1.2]

- Added documentation skill and command
- Cleaned up code around user third party
- Added user third party support
- Analyzed and improved preset randomization logic
- Migrated from simple-git-hooks to lefthook
