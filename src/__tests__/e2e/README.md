# End-to-End Tests

## Overview

This directory contains end-to-end (E2E) tests for the u-he Preset Randomizer CLI. These tests verify the complete workflow from CLI invocation to preset generation and file system storage.

## Important Notes

⚠️ **These tests require actual u-he synths to be installed on your system.**

- E2E tests will **NOT run in CI/CD** environments
- They are designed for **local testing only**
- Tests will automatically detect available synths and skip if none are found

## Running E2E Tests

### Run all E2E tests

```bash
npm run test:e2e
```

### Run unit tests only (excludes E2E)

```bash
npm run test:unit
```

### Run all tests (unit + E2E)

```bash
npm run test:unit && npm run test:e2e
```

## Test Coverage

The E2E tests cover the following scenarios with **optimized performance**:

### 1. Fully Random Preset Generation

- Generate fully random presets (1 preset)
- Generate presets in stable mode (1 preset)
- Generate presets with dictionary names (1 preset)

### 2. Preset Randomization

- Randomize with low randomness - 20% (1 preset)
- Randomize with high randomness - 80% (1 preset)

### 3. Preset Merging

- Merge two random presets (1 preset)
- Merge three random presets (1 preset)

### 4. Filtering Options

- Filter by folder `/Local/` (1 preset)

### 5. Multiple Synths

- Test with different available synths (1 preset per synth)

### 6. Edge Cases

- Multiple preset generation - 2 presets
- Edge randomness value - 100% (1 preset)

### 7. Debug Mode

- Verify debug file creation (`tmp/paramsModel.json`)

## Performance Optimizations

The E2E tests have been optimized for speed:

1. **Reduced Preset Counts**: Most tests generate only 1 preset instead of 3-5
2. **Pattern Filtering**: Tests use `pattern: '/Local/*'` to load only Local presets, significantly reducing memory usage and load time
3. **Selective Cleanup**: Only test-generated presets are deleted, preserving other presets in the RANDOM folder
4. **Reduced Test Cases**: Eliminated redundant tests to minimize total execution time

## Test Verification

Each test verifies:

1. ✅ Preset files are created in the correct location (`UserPresets/RANDOM/`)
2. ✅ Correct number of presets are generated
3. ✅ Generated files have `.h2p` extension
4. ✅ Preset files contain valid content
5. ✅ Presets can be parsed successfully
6. ✅ Presets pass validation checks

## Cleanup

Tests automatically clean up generated files after each test run. The cleanup:

- **Only removes test-generated presets**, preserving other presets in the `RANDOM/` folder
- Tracks files by modification time to identify newly created presets
- Logs cleanup actions for transparency
- Handles cleanup failures gracefully

## Available Synths

The tests will automatically detect installed u-he synths:

- ACE
- Bazille
- Diva
- Hive
- Podolski
- Repro-1
- Repro-5
- TripleCheese
- TyrellN6
- Zebra2
- Zebra3
- ZebraHZ
- Zebralette3

## Troubleshooting

### No synths detected

If you see "No u-he synths detected. Skipping E2E tests", ensure:

1. You have at least one u-he synth installed
2. The synth is installed in the standard location:
   - **macOS**: `~/Library/Audio/Presets/u-he/{SynthName}/`
   - **Windows**: `C:/Program Files/Common Files/VST3/{SynthName}.data/` or `Documents/u-he/{SynthName}.data/`
   - **Linux/WSL**: `~/.u-he/{SynthName}.data/`

### Tests fail or timeout

- Ensure you have enough presets in your library for the tests to work
- Check that you have write permissions to the UserPresets folder
- Try running a single test to isolate the issue

### Manual cleanup needed

If tests crash and don't clean up, test presets will remain in the `RANDOM/` folder but won't interfere with your existing presets. You can manually delete individual test presets if needed (look for the most recently created `.h2p` files).

## CI/CD Integration

These tests are **excluded from CI/CD** because:

1. CI environments don't have u-he synths installed
2. Tests require file system access to actual synth directories
3. Tests are platform-specific

The regular `npm run test:ci` command runs only unit tests (`test:unit`), which don't require synths.

## Future Improvements

Potential enhancements:

- [ ] Mock file system for CI-compatible E2E tests
- [ ] Performance benchmarking
- [ ] Binary preset testing (currently excluded due to crash risk)
- [ ] Favorites file testing
- [ ] Category/author filter testing
- [ ] Custom folder path testing
