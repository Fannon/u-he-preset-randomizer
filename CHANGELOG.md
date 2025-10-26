[unreleased]

- __Fixed narrowDownByAuthor function__: Removed the incorrect `!el.categories.length` check that was preventing presets without categories from being included when they had author metadata
