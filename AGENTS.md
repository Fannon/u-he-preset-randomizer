# AGENTS.md

This file provides context and guidance for AI coding assistants working on the u-he-preset-randomizer project.

## Project Overview

This is a CLI tool that generates random u-he synthesizer presets through randomization and merging of existing presets. The tool:

- Analyzes existing preset libraries to understand parameter distributions
- Generates fully random presets based on statistical distributions
- Randomizes existing presets with configurable randomness ratios
- Merges multiple presets together with random weighting

**Key Technologies:**

- TypeScript (target: Node 20+)
- Node.js CLI application
- Uses ESM modules (`"type": "module"` in package.json)
- Built with `tsc` (TypeScript compiler)
- Testing with Jest (configured for ESM)

## Architecture

### Core Modules

1. **parser.ts** - Parses and serializes u-he preset files (.h2p format)
   - Handles text and binary sections of preset files
   - Exports `parsePreset()` and `serializePreset()` functions
   - Can be used independently by other projects

2. **analyzer.ts** - Analyzes preset libraries to extract parameter statistics
   - Calculates value distributions across preset collections
   - Identifies parameter types (numeric, binary, etc.)
   - Builds statistical models for randomization

3. **randomizer.ts** - Core randomization logic
   - Generates fully random presets
   - Randomizes existing presets with configurable ratios
   - Merges multiple presets with random weighting
   - Supports "stable" mode for more predictable results
   - Handles binary sections (with `--binary` flag)

4. **presetLibrary.ts** - Manages preset discovery and loading
   - Scans directories for u-he preset files
   - Filters presets by pattern, folder, category, author, favorites
   - Handles platform-specific preset locations

5. **config.ts** - Configuration management and CLI argument parsing
   - Uses `yargs` for argument parsing
   - Uses `inquirer` for interactive mode
   - Validates and normalizes configuration

6. **cli.ts** - Main CLI entry point
   - Orchestrates the workflow
   - Handles interactive and non-interactive modes
   - Manages output and user feedback

7. **detect-synths.ts** - Utility script to detect installed u-he synths
   - Can be run separately with `npm run detect`

## Development Workflow

### Setup

```bash
npm i
npm run build
```

### Running Locally

```bash
# Run with tsx (no build needed)
tsx src/cli.ts --synth Diva --amount 3

# Run with node (requires build)
npm run build
node dist/cli.js --synth Diva --amount 3

# Or use npm start
npm run start -- --synth Diva --amount 3
```

### Testing

```bash
npm test                # Run tests once
npm test parser.test.ts # Run tests for a single file, e.g. here parser.test.ts
npm run test:coverage   # Run tests with coverage
npm run test:ci         # Full CI check (lint + build + test)
```

**Important:** Jest is configured for ESM modules with `NODE_OPTIONS="--experimental-vm-modules --no-warnings"`.

### Linting

```bash
npm run lint            # Run ESLint
```

## Key Patterns and Conventions

### File System

- Uses `fs-extra` for enhanced file operations
- Preset files have `.h2p` extension (u-he format)
- Platform-specific preset locations are detected automatically
- Generated presets go into `/RANDOM` folder in user presets

### Error Handling

- Invalid presets should be handled gracefully
- Binary sections can cause preset corruption - warn users about `--binary` flag risks
- File system errors should provide helpful messages with paths

### CLI Design

- Interactive mode by default (uses `inquirer`)
- Non-interactive mode via CLI arguments
- Uses `chalk` for colored terminal output
- Clear progress indication for long operations

### Randomization Philosophy

- Base random values on actual preset library statistics (not arbitrary ranges)
- "Stable" mode: randomize per-section rather than per-parameter
- Binary sections are kept intact when `--binary` flag is used
- Preset names can be generated from dictionary of existing names

## Common Tasks

### Adding New CLI Options

1. Add to `yargs` configuration in `config.ts`
2. Update the `Config` type definition
3. Add interactive prompt if applicable
4. Update README.md with new option

### Modifying Parser Logic

1. Changes to `parser.ts` affect both reading and writing presets
2. Test with multiple synths (Diva, Repro-1, Repro-5, Hive, Zebra, etc.)
3. Be careful with binary sections - they're opaque and synth-specific
4. Add tests to `__tests__/parser.test.ts`

### Adjusting Randomization Algorithm

1. Main logic is in `randomizer.ts`
2. Statistical analysis is in `analyzer.ts`
3. Consider both "stable" and normal modes
4. Test with various synths (simpler ones like Diva/Repro vs complex ones like Bazille/Zebra)
5. Add tests to `__tests__/randomizer.test.ts`

### Supporting New Synths

- Most synths should work automatically (generic approach)
- Simpler architecture synths (Diva, Repro) work best
- Modular synths (Bazille, Zebra) may produce more "varied" or broken results
- No synth-specific code should be needed

## Testing Notes

- Tests are in `src/__tests__/` directory
- Use `.test.ts` extension
- Jest configured with SWC for fast transpilation
- Tests must handle ESM modules
- Mock file system operations where appropriate
- Test files are excluded from npm package (`!dist/**/__tests__`)
- Avoid overly mocking, import and use dependencies directly if they are side-effect free

## Build and Distribution

- Built code goes to `dist/`
- Only `dist/`, `README.md`, and `package.json` are published to npm
- Test files are excluded from distribution
- Binary is at `dist/cli.js`
- Can be run with `npx u-he-preset-randomizer@latest`

## Important Considerations

### Preset Integrity

- Binary sections in presets contain MSEG curves and advanced settings
- Not all binary sections are compatible after parameter modifications
- Some synths handle binary modifications better than others
- Using `--binary` flag can lead to crashes - document risks clearly

### Platform Support

- Cross-platform (Windows, macOS, Linux, WSL2)
- Preset locations vary by platform - handled in detection logic

### Performance

- Large preset libraries can take time to analyze
- Use streaming/chunking for large operations
- Provide progress feedback for long operations
- Consider memory usage with very large libraries

## Helpful Resources

- [KVR Forum Thread](https://www.kvraudio.com/forum/viewtopic.php?p=8898478) - User feedback and discussions
- [GitHub Issues](https://github.com/Fannon/u-he-preset-randomizer/issues) - Bug reports and feature requests
- [u-he Website](https://u-he.com/) - Information about supported synths
