---
name: documentation-review
description: Automatically detect and fix documentation inconsistencies, outdated examples, and missing @file headers in the u-he-preset-randomizer project. Triggers when documentation appears outdated or when making significant code changes that affect public APIs.
---

## Documentation Review Skill

This skill proactively identifies documentation issues and suggests fixes for the u-he-preset-randomizer project.

### When to Activate

**Automatically trigger this skill when:**
- User mentions documentation being out of date
- User asks about API examples or how to use features
- After making significant changes to exported functions or public APIs
- When user mentions adding features that need documentation
- User asks to review or update docs
- After modifying CLI flags or MCP tools

### Project Context

**u-he-preset-randomizer** - CLI tool and MCP server for u-he synth preset generation:
- **CLI interface** (`src/cli.ts`) - Main command-line tool
- **MCP server** (`src/mcp-server.ts`) - Model Context Protocol server for AI assistants
- **Core modules**: parser, analyzer, randomizer, preset library
- **Synth support**: Diva, Hive, Repro-1, Repro-5, Zebra2, ZebraHZ, Zebralette3, and more

### Quick Documentation Checks

#### 1. Core Documentation Files

- **README.md** - Installation, CLI usage, MCP setup
- **MCP_SERVER.md** - MCP tool documentation and examples
- **AGENTS.md** - Development architecture and workflows
- **CHANGELOG.md** - Version history (current: 1.1.2)

#### 2. CLI Examples Validation

Verify examples use correct flags:
- `--synth` - Synth name (e.g., Diva, Hive)
- `--amount` - Number of presets to generate
- `--randomness` - Percentage (0-100) for randomization
- `--preset` - Base preset name or `?` for random
- `--merge` - Preset names to merge (can be multiple)
- `--pattern` - Glob pattern for preset filtering
- `--folder` - Filter by folder path
- `--category` - Filter by category
- `--author` - Filter by author
- `--favorites` - Filter by .uhe-fav file
- `--stable` - Use stable randomization mode
- `--binary` - Include binary section (⚠️ may cause crashes)
- `--dictionary` - Use dictionary for random names
- `--custom-folder` - Custom u-he installation path
- `--debug` - Enable debug logging

#### 3. MCP Tool Signatures

Verify `MCP_SERVER.md` examples match `src/mcp-server.ts`:
- `list_synths` - Detect available synths
- `select_synth` - Load preset library (with optional `pattern`)
- `get_current_synth` - Get active synth info
- `list_presets` - List with pagination
- `search_presets` - Fuzzy search
- `filter_presets` - Filter by category/author/favorites/pattern
- `explain_preset` - Get preset details
- `get_categories`, `get_authors`, `get_favorites_files` - Metadata helpers
- `generate_random_presets` - Generate from distributions
- `randomize_presets` - Create variations
- `merge_presets` - Blend multiple presets
- `get_synth_context` - Get synth reference docs

#### 4. Source Code Documentation

**All TypeScript files must have `@file` headers:**
```typescript
/**
 * @file Brief description of module's purpose.
 */
```

**Exported functions need JSDoc (if not obvious from types):**
```typescript
/**
 * Function description explaining what it does.
 *
 * @param paramName - Parameter description
 * @returns What the function returns
 * @throws {Error} When it throws errors
 */
export function myFunction(paramName: string): ReturnType { ... }
```

**Key files to document:**
- `src/index.ts` - Public API exports
- `src/parser.ts` - Preset parsing/serialization (public API)
- `src/cli.ts` - CLI entry point
- `src/mcp-server.ts` - MCP server
- `src/generatePresets.ts` - Main generation function
- All other `src/*.ts` files

### Actions When Issues Detected

**1. Small issues (typos, outdated examples, missing headers):**
- Fix immediately and explain what was corrected
- Validate with `npm run lint && npm run typecheck`

**2. Medium issues (multiple outdated sections, missing documentation):**
- List all issues found
- Propose specific fixes
- Ask if user wants them all fixed at once

**3. Major issues (significant inconsistencies, large gaps):**
- Explain the scope of issues
- Suggest running full documentation review: `/documentation`
- Wait for user approval before proceeding

### Formatting Standards

**@file Headers:**
```typescript
// Entry points
/**
 * @file CLI entry point for u-he preset randomizer tool.
 * Handles argument parsing, interactive mode, and orchestration.
 */

// Core modules
/**
 * @file Preset parser and serializer for u-he preset files.
 * Provides functions to read, parse, and write .h2p preset files.
 */

// Utilities
/**
 * @file Utility functions for preset validation.
 */
```

**JSDoc for Public Functions:**
```typescript
/**
 * Parses a u-he preset file into a structured object.
 *
 * @param fileString - The content of the preset file
 * @param filePath - Path to the file (for error messages)
 * @param binary - Whether to include binary section
 * @returns Parsed preset object with metadata and parameters
 */
export function parseUhePreset(
  fileString: string,
  filePath: string,
  binary: boolean,
): Preset { ... }
```

**Avoid redundant JSDoc:**
```typescript
// ❌ Don't document what's obvious from types
/**
 * Gets the preset name
 * @param preset - The preset
 * @returns The name
 */
function getName(preset: Preset): string { ... }

// ✅ Let TypeScript speak for simple functions
function getName(preset: Preset): string { ... }
```

### Validation Steps

After any documentation changes:
```bash
npm run lint          # Biome linting (must pass)
npm run typecheck     # TypeScript type checking (must pass)
npm run test:unit     # Unit tests (must pass)
```

Optional build check:
```bash
npm run build:dist    # Production build (for major changes)
```

### Constraints

**Never modify:**
- Runtime logic or algorithm implementations
- Test assertions or test data
- Type definitions or interfaces
- Build configuration (tsconfig.json, biome.json, package.json)
- CI/CD workflows or git hooks

**Always ask before:**
- Major documentation restructuring
- Adding new documentation files
- Changing public API examples that users might depend on

**Auto-fix these safely:**
- Typos and grammar in markdown files
- Outdated CLI/MCP flag examples
- Missing @file headers
- Broken internal links
- Version numbers to match package.json

### Integration with Full Review

For comprehensive reviews, this skill guides the user to use:
```bash
/documentation
```

Which performs:
- Complete scan of all documentation files
- All source file header checks
- Validation suite
- Structured summary of changes
