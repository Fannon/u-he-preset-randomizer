## Documentation & Code Quality Review

### Goal

Perform a comprehensive documentation and consistency review of the **u-he-preset-randomizer** project.
Ensure all documentation reflects the current implementation, TypeScript files have proper headers, and code examples work correctly.

### Project Context

**u-he-preset-randomizer** is a CLI tool and MCP server for generating random u-he synth presets through:
- Fully random generation based on statistical analysis
- Randomization of existing presets
- Merging multiple presets together

**Key components:**
- CLI interface (`src/cli.ts`)
- MCP server (`src/mcp-server.ts`)
- Core modules: parser, analyzer, randomizer, preset library
- Supports multiple u-he synths (Diva, Hive, Repro, Zebra, etc.)

---

### Priorities (in order)

1. **Core documentation**: `README.md`, `MCP_SERVER.md`, `CHANGELOG.md`, `AGENTS.md`
2. **Public APIs**: Exported functions from `src/index.ts`, MCP tool definitions
3. **Code examples**: CLI examples in README.md, MCP examples in MCP_SERVER.md
4. **Source file headers**: `@file` JSDoc headers for all TypeScript files
5. **Build/test documentation**: Scripts in `package.json`, test patterns

---

### Workflow

#### 1. Repository Scan

Scan project directories and build inventory of:
- Documentation files: `README.md`, `MCP_SERVER.md`, `AGENTS.md`, `CHANGELOG.md`, `CONTRIBUTING.md`
- TypeScript source files: `src/**/*.ts` (exclude `node_modules/`, `dist/`)
- Test files: `src/__tests__/**/*.test.ts`
- Configuration: `package.json`, `tsconfig*.json`, `biome.json`, `lefthook.yml`

#### 2. Markdown Verification

**For each documentation file, verify:**

**README.md:**
- Installation instructions match `package.json` setup (npx, global install)
- CLI examples work with current flags: `--synth`, `--amount`, `--randomness`, `--preset`, `--merge`, etc.
- MCP server setup matches `dist/mcp-server.js` binary
- Links to MCP_SERVER.md, AGENTS.md, soundsets are valid

**MCP_SERVER.md** (if exists):
- Tool signatures match `src/mcp-server.ts` implementation
- Examples use correct MCP tool names and parameters
- Configuration matches actual Claude Desktop setup

**AGENTS.md:**
- Reflects current project architecture
- File paths and module descriptions are accurate
- Development workflow matches `package.json` scripts

**CHANGELOG.md:**
- Latest version matches `package.json` version (1.1.2)

#### 3. Source Code Review

**For each TypeScript file in `src/`:**

Add or update `@file` header:
```typescript
/**
 * @file Brief description of the module's purpose and responsibility.
 */
```

**Key files to prioritize:**
- `src/index.ts` - Public API exports (must document all exported functions)
- `src/cli.ts` - CLI entry point and argument parsing
- `src/mcp-server.ts` - MCP server tool definitions
- `src/parser.ts` - Preset parsing/serialization (publicly exposed API)
- `src/analyzer.ts`, `src/randomizer.ts`, `src/generatePresets.ts` - Core logic
- `src/presetLibrary.ts`, `src/libraryFilters.ts` - Preset management

**Documentation standards:**
- Add JSDoc comments for exported functions and non-obvious logic
- Skip trivial getters/setters
- Document side effects, mutations, file I/O operations
- Use TypeScript types as primary documentation (avoid redundant param descriptions)

#### 4. Execution Rules

**Safe automated fixes:**
- Fix typos in documentation
- Update outdated CLI/MCP examples
- Add missing `@file` headers
- Fix broken internal links
- Update version numbers to match `package.json`

**Require confirmation before:**
- Changing code examples that might affect user workflows
- Modifying exported API signatures or parameter names
- Removing or significantly restructuring documentation sections

**Never modify:**
- Functional code logic (only documentation)
- Test assertions or test data
- Build configuration unless documentation explicitly requires it

#### 5. Validation

**After making documentation changes, run:**

```bash
npm run lint          # Biome linting (must pass)
npm run typecheck     # TypeScript type checking (must pass)
npm run test:unit     # Unit tests (must pass)
npm run build         # Build verification (must succeed)
```

**Manual verification:**
- Spot-check 2-3 CLI examples from README.md
- Verify MCP server config example is valid JSON
- Check that all internal file references use correct paths

**If validation fails:**
- Document the failure with error output
- Revert changes that caused the failure
- Create a GitHub issue for investigation

#### 6. Reporting

**Produce a structured summary including:**

**Quantitative metrics:**
- Markdown files reviewed/updated
- TypeScript files with headers added
- JSDoc comments added
- Broken links fixed
- Tests passing status

**Qualitative findings:**
- Notable inconsistencies found and fixed
- Outdated examples corrected
- Missing documentation added
- Ambiguous areas requiring clarification

**Follow-up recommendations:**
- Sections needing expansion
- Missing documentation files
- API surfaces needing better examples

---

### Conflict / Uncertainty Policy

**When uncertain about:**
- File's purpose → Check AGENTS.md, examine imports/exports, create issue if still unclear
- Correct terminology → Use existing u-he synth terminology from README.md
- API behavior → Defer to TypeScript types and implementation

**Never:**
- Delete or rename files
- Make speculative edits without verifying against code
- Modify functional logic to match documentation

**Always:**
- Trust code over documentation (update docs to match code)
- Ask for clarification on ambiguous documentation goals
- Create issues for discovered inconsistencies requiring code changes

---

### Formatting Standards

#### `@file` Header Examples

**For CLI/entry points:**
```typescript
/**
 * @file CLI entry point for u-he preset randomizer tool.
 * Handles argument parsing, interactive mode, and preset generation orchestration.
 */
```

**For core modules:**
```typescript
/**
 * @file Preset parser and serializer for u-he preset files.
 * Provides functions to read, parse, modify, and write .h2p preset files.
 */
```

**For utilities:**
```typescript
/**
 * @file Utility functions for preset validation and error checking.
 */
```

#### Function JSDoc Examples

**Public API functions (exported):**
```typescript
/**
 * Parses a u-he preset file into a structured object.
 *
 * @param presetPath - Absolute path to the .h2p file
 * @returns Parsed preset object with metadata and parameters
 * @throws {Error} If file is not a valid u-he preset
 */
export function parsePreset(presetPath: string): ParsedPreset { ... }
```

**Complex internal logic:**
```typescript
/**
 * Applies statistical randomization to preset parameters.
 * Uses weighted distributions from the analyzed preset library.
 */
function applyRandomization(preset: Preset, stats: Statistics): Preset { ... }
```

**Avoid redundant comments:**
```typescript
// ❌ Bad: Returns true if preset is valid
function isValidPreset(preset: Preset): boolean { ... }

// ✅ Good: Let TypeScript types speak
function isValidPreset(preset: Preset): boolean { ... }
```

---

### Branch / Commit / PR Standards

**Branch naming:**
- `docs/update-{scope}` - e.g., `docs/update-mcp-examples`
- `docs/add-file-headers` - for adding JSDoc headers
- `docs/fix-cli-examples` - for specific documentation fixes

**Commit messages:**
- Use `docs:` prefix (follows project convention)
- Be specific: `docs: add @file headers to core modules`
- Multiple commits OK, will be squashed

**PR template:**
```markdown
## Summary
- Updated documentation to match current implementation
- Added missing @file headers to TypeScript source files
- Fixed outdated CLI and MCP examples

## Verification
- [x] `npm run lint` passed
- [x] `npm run typecheck` passed
- [x] `npm run test:unit` passed
- [x] `npm run build` succeeded
- [x] CLI examples manually verified
- [x] MCP config example validated

## Changes
- Updated X Markdown files
- Added @file headers to Y TypeScript files
- Fixed Z broken links/examples

## Notes
- [Any ambiguous areas or follow-up items]
```

---

### Report Format

**Provide both a summary and detailed report:**

**Summary (Markdown):**
```markdown
# Documentation Review Report

## Metrics
- 📄 Markdown files reviewed: 5 (updated: 3)
- 📝 TypeScript files with @file headers: 18/21
- 💬 JSDoc comments added: 12
- 🔗 Broken links fixed: 4
- ✅ All validation passed

## Key Changes
- Updated CLI examples in README.md to match current flags
- Added @file headers to all src/ modules
- Fixed MCP server configuration example
- Synchronized AGENTS.md with current architecture

## Follow-up
- Consider adding examples for `--binary` mode usage
- MCP tool descriptions could be more detailed
```

**Detailed (JSON):**
```json
{
  "summary": {
    "markdown_reviewed": 5,
    "markdown_updated": 3,
    "file_headers_added": 18,
    "jsdoc_comments_added": 12,
    "broken_links_fixed": 4,
    "validation": {
      "lint": "passed",
      "typecheck": "passed",
      "tests": "passed",
      "build": "passed"
    }
  },
  "files_changed": [
    { "path": "README.md", "changes": ["Updated CLI examples", "Fixed MCP config"] },
    { "path": "src/cli.ts", "changes": ["Added @file header"] },
    { "path": "src/parser.ts", "changes": ["Added @file header", "Added JSDoc to parsePreset()"] }
  ],
  "recommendations": [
    "Add examples for --binary mode",
    "Expand MCP tool documentation"
  ]
}
```

---

### Allowed Automated Actions

**Documentation fixes (safe to apply directly):**
- ✅ Fix typos and grammar in .md files
- ✅ Update CLI examples to match current flags
- ✅ Update MCP examples to match current tool signatures
- ✅ Add missing `@file` headers to TypeScript files
- ✅ Add JSDoc comments to exported functions
- ✅ Fix broken internal links
- ✅ Update version numbers in docs to match package.json
- ✅ Format code blocks for consistency
- ✅ Fix indentation in Markdown

**Code formatting (safe):**
- ✅ Run `npm run format` (Biome formatter)
- ✅ Fix minor formatting issues in JSDoc comments

### Disallowed Actions

**Never modify:**
- ❌ Runtime logic or algorithm implementations
- ❌ Test assertions or test data
- ❌ Type definitions or interfaces
- ❌ Build configuration (tsconfig.json, biome.json, package.json scripts)
- ❌ CI/CD workflows (.github/workflows)
- ❌ File names or directory structure
- ❌ Git configuration (lefthook.yml)

**Require explicit approval:**
- ⚠️ Significant restructuring of documentation
- ⚠️ Changes to public API examples that might break user workflows
- ⚠️ Adding new documentation files

---

### Final Deliverables

**1. Updated files:**
- Markdown documentation files with accurate, current information
- TypeScript source files with proper `@file` headers
- JSDoc comments on exported functions and complex logic

**2. Validation proof:**
- All `npm run lint`, `typecheck`, `test:unit`, and `build` passing
- Screenshots or output of validation commands

**3. Documentation review report:**
- Markdown summary (as shown in Report Format section)
- JSON detailed report
- List of follow-up recommendations

**4. Pull request (if applicable):**
- Clean commit history with `docs:` prefix
- PR description following template
- All checks passing
- Ready for review

---

## Usage

To run this documentation review, use:

```bash
/documentation
```

This will trigger a comprehensive review of all documentation and source code headers in the u-he-preset-randomizer project.