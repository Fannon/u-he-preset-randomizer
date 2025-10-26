[unreleased]

- **FIXED**: narrowDownByAuthor function: Removed the incorrect `!el.categories.length` check that was preventing presets without categories from being included when they had author metadata
- **FIXED**: The narrowDownByFavoritesFile function was returning all presets when a favorites file wasn't found, instead of an empty array. This was dangerous behavior that could silently include unintended presets.
