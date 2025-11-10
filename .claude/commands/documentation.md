---
description: Perform comprehensive documentation and code quality review of the u-he-preset-randomizer project
---

# Documentation & Code Quality Review

Perform a comprehensive review to ensure all documentation reflects the current implementation, TypeScript files have proper headers, and code examples work correctly.

## What Gets Reviewed

### 1. Documentation Files (Priority Order)
1. **README.md** - Installation, CLI examples, MCP setup
2. **MCP_SERVER.md** - MCP tool documentation
3. **AGENTS.md** - Development architecture
4. **CHANGELOG.md** - Version history (current: 1.1.2)

### 2. Source Code Documentation
- All `src/**/*.ts` files must have `@file` JSDoc headers
- Exported functions need JSDoc (when not obvious from types)
- Public API in `src/index.ts` fully documented

## Review Workflow

### Step 1: Scan Repository
Build inventory of:
- Documentation files (*.md)
- TypeScript source files (`src/**/*.ts`)
- Test files (`src/__tests__/**/*.test.ts`)
- Configuration (`package.json`, `tsconfig*.json`, `biome.json`)

### Step 2: Verify Documentation Files

#### README.md
- [ ] Installation instructions match `package.json` (npx, global install)
- [ ] CLI examples use current flags
- [ ] MCP server setup matches `dist/mcp-server.js` binary
- [ ] All links valid (MCP_SERVER.md, AGENTS.md, soundsets)

**Current CLI flags:**
`--synth`, `--amount`, `--randomness`, `--preset`, `--merge`, `--pattern`, `--folder`, `--category`, `--author`, `--favorites`, `--stable`, `--binary`, `--dictionary`, `--custom-folder`, `--debug`

#### MCP_SERVER.md
- [ ] Tool signatures match `src/mcp-server.ts` implementation
- [ ] Examples use correct MCP tool names
- [ ] Configuration examples are valid JSON
- [ ] Claude Desktop setup instructions accurate

**Current MCP tools:**
`list_synths`, `select_synth`, `get_current_synth`, `list_presets`, `search_presets`, `filter_presets`, `explain_preset`, `get_categories`, `get_authors`, `get_favorites_files`, `generate_random_presets`, `randomize_presets`, `merge_presets`, `get_synth_context`

#### AGENTS.md
- [ ] Architecture description matches actual code structure
- [ ] File paths accurate
- [ ] Development workflow matches `package.json` scripts
- [ ] References Biome (not ESLint)

#### CHANGELOG.md
- [ ] Latest version matches `package.json` version
- [ ] Recent changes documented
- [ ] Format consistent

### Step 3: Add @file Headers

**Add to all TypeScript files in `src/`:**

```typescript
/**
 * @file Brief description of module's purpose and responsibility.
 */
```

**Examples:**

```typescript
// Entry points
/**
 * @file CLI entry point for u-he preset randomizer tool.
 * Handles argument parsing, interactive mode, and preset generation orchestration.
 */

// Core modules
/**
 * @file Preset parser and serializer for u-he preset files.
 * Provides functions to read, parse, modify, and write .h2p preset files.
 */

// Utilities
/**
 * @file Preset validation utilities.
 */
```

**Priority files:**
- `src/index.ts` - Public API exports
- `src/cli.ts` - CLI entry point
- `src/mcp-server.ts` - MCP server
- `src/parser.ts` - Parser/serializer (public API)
- `src/analyzer.ts` - Statistical analyzer
- `src/randomizer.ts` - Randomization logic
- `src/generatePresets.ts` - Main generation
- `src/presetLibrary.ts` - Library management
- `src/config.ts` - Configuration
- `src/libraryFilters.ts` - Filtering
- `src/detect-synths.ts` - Synth detection
- `src/utils/*.ts` - Utilities

### Step 4: Add JSDoc to Exported Functions

**Add comprehensive JSDoc to exported functions (when not obvious from types):**

```typescript
/**
 * Parses a u-he preset file into a structured object.
 *
 * @param fileString - The content of the preset file as a string
 * @param filePath - The path to the preset file (for error messages)
 * @param binary - Whether to include the binary section
 * @returns Parsed preset object with metadata and parameters
 */
export function parseUhePreset(
  fileString: string,
  filePath: string,
  binary: boolean,
): Preset { ... }
```

**Focus on:**
- Functions in `src/index.ts` (public API)
- Complex functions in `src/parser.ts`
- Main entry points like `generatePresets()`

**Skip:**
- Simple getters/setters
- Functions where TypeScript types are self-documenting
- Internal utility functions with obvious names

### Step 5: Validation

**Run full validation suite:**

```bash
# Install dependencies if needed
npm install

# Run all checks
npm run lint          # Biome linting (must pass)
npm run typecheck     # TypeScript type checking (must pass)
npm run test:unit     # Unit tests (must pass)
npm run build:dist    # Production build (must pass)
```

**Manual verification:**
- Spot-check 2-3 CLI examples from README.md
- Verify MCP config example is valid JSON
- Check internal file references are correct

**If validation fails:**
- Show error output
- Identify which check failed
- Fix or revert problematic changes

### Step 6: Summary

**Provide concise summary:**

```markdown
## Documentation Review Complete ✅

**Files Updated:**
- 📄 Documentation: X files updated
- 📝 Source headers: Y files with @file headers added
- 💬 JSDoc comments: Z functions documented

**Validation:**
- ✅ Linting: Passed
- ✅ Type checking: Passed
- ✅ Unit tests: Passed (X/X tests)
- ✅ Build: Passed

**Key Changes:**
- [List 3-5 most important changes]

**Optional Improvements:**
- [List any non-critical suggestions]
```

## What NOT to Modify

**Never change:**
- ❌ Runtime logic or algorithms
- ❌ Test assertions or test data
- ❌ Type definitions or interfaces
- ❌ Build configuration (`tsconfig.json`, `biome.json`, `package.json` scripts)
- ❌ CI/CD workflows (`.github/workflows`)
- ❌ File names or directory structure
- ❌ Git configuration (`lefthook.yml`)

**Ask before:**
- ⚠️ Major documentation restructuring
- ⚠️ Adding new documentation files
- ⚠️ Changing public API examples users depend on

## Safe Automated Fixes

**Auto-fix without asking:**
- ✅ Typos and grammar in markdown files
- ✅ Outdated CLI/MCP flag examples
- ✅ Missing `@file` headers
- ✅ Broken internal links
- ✅ Version numbers to match package.json
- ✅ JSDoc comments on exported functions
- ✅ Code block formatting in markdown

## Execution

When user runs `/documentation`:

1. **Scan** - Build file inventory
2. **Review** - Check all documentation files for accuracy
3. **Document** - Add @file headers to source files
4. **Enhance** - Add JSDoc to exported functions
5. **Validate** - Run lint, typecheck, tests, build
6. **Summarize** - Report changes made
7. **Commit** - Create clean commit with `docs:` prefix

**Commit message format:**
```
docs: comprehensive documentation and code quality review

- Update [file] to reference [correct thing]
- Add @file headers to all TypeScript source files
- Add JSDoc comments to [N] exported functions

Validation:
- ✅ Linting passed
- ✅ Type checking passed
- ✅ Unit tests passed (X/X)
```

**Do NOT create:**
- ❌ Separate report files (DOCUMENTATION_REVIEW_REPORT.md, etc.)
- ❌ JSON report files
- ❌ Detailed metrics files

Just make the changes, validate them, commit with a good message, and provide a concise summary.
