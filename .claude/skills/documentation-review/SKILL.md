---
name: documentation-review
description: Automatically detect and fix documentation inconsistencies, outdated examples, and missing @file headers in the u-he-preset-randomizer project. Triggers when documentation appears outdated or when making significant code changes that affect public APIs.
---

## Documentation Review Skill

This skill proactively identifies documentation issues and suggests fixes.

### When to Activate

**Automatically trigger this skill when:**
- User mentions documentation being out of date
- User asks about API examples
- After making significant changes to exported functions
- When user mentions adding features that need documentation
- User asks to review or update docs

### Project Context

**u-he-preset-randomizer** - CLI tool and MCP server for u-he synth preset generation:
- CLI interface (`src/cli.ts`)
- MCP server (`src/mcp-server.ts`)
- Core modules: parser, analyzer, randomizer, preset library
- Supports Diva, Hive, Repro, Zebra, and other u-he synths

### Review Checklist

**Documentation files:**
- `README.md` - Installation, CLI examples, MCP setup
- `MCP_SERVER.md` - MCP tool documentation
- `AGENTS.md` - Development architecture
- `CHANGELOG.md` - Version history (current: 1.1.2)

**Code documentation:**
- All `src/**/*.ts` files should have `@file` headers
- Exported functions need JSDoc comments
- Public API in `src/index.ts` must be documented

### Quick Checks

1. **CLI examples match current flags**: `--synth`, `--amount`, `--randomness`, `--preset`, `--merge`, `--pattern`, `--folder`, `--category`, `--author`, `--favorites`, `--stable`, `--binary`, `--dictionary`

2. **MCP examples match tool signatures** in `src/mcp-server.ts`

3. **Version numbers** in docs match `package.json` version

4. **File paths** in documentation are accurate

### Actions

**When documentation issues detected:**
1. Identify specific outdated sections
2. Propose fixes with examples
3. Ask user if they want full documentation review
4. If approved, systematically update all docs
5. Validate with `npm run lint && npm run typecheck && npm run test:unit`

**Formatting standards:**
```typescript
/**
 * @file Brief description of module's purpose.
 */
```

For exported functions:
```typescript
/**
 * Function description.
 *
 * @param paramName - Description
 * @returns Description
 * @throws {Error} When...
 */
```

### Validation

After updates:
- Run `npm run lint` (Biome)
- Run `npm run typecheck` (TypeScript)
- Run `npm run test:unit` (Jest)
- Manually verify 2-3 CLI examples

### Constraints

**Never modify:**
- Runtime logic or algorithms
- Test assertions
- Build configuration
- Type definitions

**Always ask before:**
- Major documentation restructuring
- Adding new documentation files
- Changing public API examples
