# u-he Preset Randomizer MCP Server

The u-he Preset Randomizer exposes a [Model Context Protocol](https://modelcontextprotocol.io/) server so AI assistants can browse, search, analyze, and generate presets for u-he synths. See [README.md](./README.md) for more general documentation.

For a brief demo, watch https://youtu.be/8g8qHzpBTeQ

This document explains how to run the production build, register it with popular MCP clients, and make the most of the available tools.

## Install & Launch

- **Production (no install):** `npx --yes u-he-preset-randomizer@latest u-he-mcp-server`  
  The `--yes` flag lets `npx` install the package automatically on first run.
- **Production (global install):** `npm install -g u-he-preset-randomizer` → `u-he-mcp-server`
- **Development from source:** run `npm run mcp` inside the repo

The server prints status logs to `stderr` and waits for MCP requests on `stdin/stdout`.

## Registering with Clients

### Claude Desktop

Add the server to `claude_desktop_config.json` (`~/Library/Application Support/Claude/` on macOS, `%APPDATA%\Claude\` on Windows):

```json
{
  "mcpServers": {
    "u-he-preset-randomizer": {
      "command": "npx",
      "args": ["--yes", "u-he-preset-randomizer@latest", "u-he-mcp-server"]
    }
  }
}
```

For local development, swap the args for `["tsx", "/absolute/path/to/repo/src/mcp-server.ts"]`. Use forward slashes or escaped backslashes on Windows paths.

### Claude CLI

```bash
# Production build
claude mcp add u-he-preset-randomizer npx --yes u-he-preset-randomizer@latest u-he-mcp-server

# Development build
claude mcp add u-he-preset-randomizer npx tsx ~/dev/u-he-preset-randomizer/src/mcp-server.ts
```

### Codex CLI & Other Clients

```bash
# Production build
codex mcp add u-he-preset-randomizer npx --yes u-he-preset-randomizer@latest u-he-mcp-server

# Development build
codex mcp add u-he-preset-randomizer npx tsx ~/dev/u-he-preset-randomizer/src/mcp-server.ts
```

Any other MCP-compatible client can launch the same command. Replace the path with your checkout when using the development build.

## Workflow Cheat Sheet

The server bundles inline instructions, but the typical flow is:

1. `list_synths` to detect available u-he instruments (fallbacks cover the full supported list).
2. `select_synth` to load presets. Use the optional `pattern` glob for faster loads; call again without it to restore the full library.
3. Explore with `list_presets`, `search_presets`, `filter_presets`, and `explain_preset`. Helper tools `get_categories`, `get_authors`, and `get_favorites_files` surface metadata for filtering.
4. Generate new sounds:
   - `generate_random_presets` uses statistical profiles from the loaded library (defaults: 16 presets, stable mode on, dictionary names on).
   - `randomize_presets` mutates chosen presets. Remember `amount` is **per source preset**.
   - `merge_presets` blends multiple sources; specify `preset_names`, `author`, `category`, or `pattern`.
5. `get_synth_context` returns the detailed reference sheets found in `src/skills` (currently Diva, Hive, Repro-1, Repro-5).

Generated presets are saved into `/RANDOM` subfolders inside the synth’s user presets directory and are immediately added to the in-memory library so they can be searched or explained without reloading.

## Tool Summary

**Synth setup**
- `list_synths` – enumerate detected libraries.
- `select_synth` – load presets (required before other tools). Supports `pattern`.
- `get_current_synth` – report the active synth, preset counts, and folders.
- `get_synth_context` – surface the synth reference document if available.

**Library exploration**
- `list_presets` – list presets with pagination.
- `search_presets` – fuzzy name/category/author search.
- `filter_presets` – filter by `category`, `author`, `favorites`, or `pattern`.
- `explain_preset` – describe metadata; pass `include_parameters: true` for the full parameter dump plus optional synth context.
- `get_categories`, `get_authors`, `get_favorites_files` – enumerate metadata helpers for the loaded library.

**Sound generation**
- `generate_random_presets` – create new presets from statistical distributions. Filters (`category`, `author`, `favorites`, `pattern`) limit the source pool.
- `randomize_presets` – produce variations. You can target explicit `preset_names` or filter by `author`, `category`, or `pattern`. Defaults: 16 variations per source, 50% randomness, stable mode on.
- `merge_presets` – blend presets (supports wildcard names such as `*` and `?`) with optional randomness, filters, and stable mode. At least one selector (`preset_names`, `author`, `category`, or `pattern`) is required.

## Troubleshooting

- **No synths found:** ensure the synths are installed in standard locations or configure custom paths (environment variables from the CLI also apply here). Run `npm run detect` to verify detection.
- **Library loads empty:** check folder permissions and confirm `.h2p` presets exist. Reload without `pattern` if you previously filtered the library.
- **Generation errors:** make sure filters match existing presets. The server reports which filter blocked results.
- **Missing context:** only synths with documentation in `src/skills/*.md` return data via `get_synth_context`.

The MCP server shares the same MIT license as the rest of the project.

## Internal Architecture

### State Management

1. **Initialization**: Server starts, detects available synths on startup
2. **Synth Selection**: User calls `select_synth`, presets are loaded into memory
3. **Operations**: All discovery and generation tools operate on the loaded library. Skills are loaded on demand (skill per synth)
4. **Synth Switching**: User can call `select_synth` again to switch context

### Data Flow

```
┌─────────────────┐
│   MCP Client    │  (Claude Desktop, etc.)
│   (AI Agent)    │
└────────┬────────┘
         │ MCP Protocol (JSON-RPC over stdio)
         │
┌────────▼────────┐
│   MCP Server    │
│  ┌───────────┐  │
│  │   State   │  │  - Current synth context
│  │  Manager  │  │  - Loaded preset library
│  └─────┬─────┘  │  - Available synths cache
│        │        │
│  ┌─────▼─────┐  │
│  │   Tools   │  │  - 13 tool handlers
│  │  Handlers │  │  - Input validation
│  └─────┬─────┘  │  - Response formatting
│        │        │  - Skill selection on demand
└────────┼────────┘
         │
┌────────▼────────┐
│  Core Library   │
│  ┌───────────┐  │
│  │ Detector  │  │  - Synth detection
│  ├───────────┤  │
│  │  Loader   │  │  - Preset parsing
│  ├───────────┤  │
│  │  Filters  │  │  - Category/Author filtering
│  ├───────────┤  │
│  │ Generator │  │  - Random generation
│  ├───────────┤  │
│  │Randomizer │  │  - Preset randomization
│  └───────────┘  │
└─────────────────┘
         │
┌────────▼────────┐
│   File System   │  - Read presets
│                 │  - Write to /RANDOM only
└─────────────────┘
```
