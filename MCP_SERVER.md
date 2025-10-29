# u-he Preset Randomizer MCP Server

This document explains how to use and configure the Model Context Protocol (MCP) server for the u-he Preset Randomizer, and details its internal architecture.

## Table of Contents

- [What is the MCP Server?](#what-is-the-mcp-server)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Available Tools](#available-tools)
- [Usage Examples](#usage-examples)
- [Internal Architecture](#internal-architecture)
- [Comparison with CLI](#comparison-with-cli)
- [Troubleshooting](#troubleshooting)

## What is the MCP Server?

The MCP server provides an alternative interface to the CLI for interacting with u-he synth presets through the [Model Context Protocol](https://modelcontextprotocol.io/). This allows AI assistants like Claude to directly interact with your u-he synth presets, making it easier to:

- Browse and search through your preset libraries
- Get explanations of what makes specific presets unique
- Generate new presets through randomization and merging
- Filter presets by categories, authors, and favorites

**Key Benefits:**
- **Conversational interface**: Ask questions in natural language
- **Stateful context**: Select a synth once, then perform multiple operations
- **Efficient**: Presets are loaded once and cached in memory
- **Safe**: Only writes to the `/RANDOM` folder, preventing accidental modifications

## Quick Start

### Installation

You can run the MCP server from the published package or directly from source:

```bash

# Run the published MCP server via npx (production build, no global install)
npx --yes u-he-preset-randomizer@latest u-he-mcp-server

# Install the package globally (production build)
npm install -g u-he-preset-randomizer

# Or use the local source without installing (development build)
npm run mcp
```

The `--yes` flag tells `npx` to automatically install the package the first time it runs.

### Testing the Server

You can test the server directly using stdio:

```bash
# Run the MCP server
u-he-mcp-server

# Or in development
npm run mcp
```

The server will start and wait for MCP commands via stdin/stdout.

## Configuration

### Claude Desktop

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

#### Windows Setup

1. Open Notepad as Administrator
2. Create/edit the file at `%APPDATA%\Claude\claude_desktop_config.json`
3. Add the configuration below (adjust the path to match your actual project location)

Production version (published build):

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

Local development version (no compilation needed):

```json
{
  "mcpServers": {
    "u-he-preset-randomizer": {
      "command": "npx",
      "args": ["tsx", "C:\\Development\\u-he-synth-preset-randomizer\\src\\mcp-server.ts"]
    }
  }
}
```

**Notes:**
- Update path to where you checked out the code
- Use forward slashes (`/`) or escaped backslashes (`\\`) in the path. Windows-style paths with single backslashes may not work correctly.
- `--yes` tells `npx` to automatically install the published package the first time it runs.

### Claude Code (CLI)

Production version (published build):

```bash
claude mcp add u-he-preset-randomizer npx --yes u-he-preset-randomizer@latest u-he-mcp-server
```

Local development version (no compilation needed):

```bash
claude mcp add u-he-preset-randomizer npx tsx ~/dev/u-he-preset-randomizer/src/mcp-server.ts
```

### Codex and Other MCP Clients

Production version (published build):

```bash
codex mcp add u-he-preset-randomizer npx --yes u-he-preset-randomizer@latest u-he-mcp-server
```

Local development version (no compilation needed):

```bash
codex mcp add u-he-preset-randomizer npx tsx ~/dev/u-he-preset-randomizer/src/mcp-server.ts
```

This registers the local build with the Codex CLI. Replace the `~/dev/...` portion with the absolute path to your repository if it lives elsewhere. After adding the server you can verify the registration with `codex mcp list`, and remove it again via `codex mcp remove u-he-preset-randomizer` when you're done testing.

For other MCP-compatible clients, follow their documentation for registering a custom stdio server. You can launch the published build with `npx --yes u-he-preset-randomizer@latest u-he-mcp-server`, or point to your local source with `npx tsx <path-to-repo>/src/mcp-server.ts`.

## Available Tools

The MCP server provides 13 tools organized into three categories:

### Synth Management

#### `list_synths`
Lists all u-he synths detected on your system.

**Parameters:** None

**Example Response:**
```
Found 3 u-he synth(s):

- Diva
  Location: /Library/Audio/Presets/u-he/Diva/

- Zebra3
  Location: /Library/Audio/Presets/u-he/Zebra3/

- Hive (current)
  Location: /Library/Audio/Presets/u-he/Hive/
```

#### `select_synth`
Selects a synth to work with and loads all its presets into memory.

**Parameters:**
- `synth` (string, required): Name of the synth (e.g., "Diva", "Zebra3")
- `pattern` (string, optional): Glob pattern to filter presets (e.g., "Bass/**/*")

**Example:**
```json
{
  "synth": "Diva",
  "pattern": "Bass/**/*"
}
```

**Response:**
```
Successfully selected Diva and loaded 847 presets in 1234ms.

You can now use other tools to browse, search, filter, and generate presets.
```

#### `get_current_synth`
Returns information about the currently selected synth.

**Parameters:** None

**Example Response:**
```
Current synth: Diva
Loaded presets: 847
Root folder: /Library/Audio/Presets/u-he/Diva/
User presets folder: /Library/Audio/Presets/u-he/Diva/UserPresets/Diva
```

---

### Preset Discovery

#### `list_presets`
Lists loaded presets with pagination support.

**Parameters:**
- `limit` (number, optional): Maximum presets to return (default: 50)
- `offset` (number, optional): Number of presets to skip (default: 0)

**Example:**
```json
{
  "limit": 10,
  "offset": 0
}
```

**Example Response:**
```
Showing presets 1-10 of 847:

1. 303 Bass
   Categories: Bass:Acid
   Author: u-he
   Path: /Local/Bass/303 Bass.h2p

2. Analog Monster
   Categories: Bass:Sub
   Author: u-he
   Path: /Local/Bass/Analog Monster.h2p
...
```

#### `search_presets`
Searches presets by name, category, or author with fuzzy matching.

**Parameters:**
- `query` (string, required): Search query
- `limit` (number, optional): Maximum results (default: 20)

**Example:**
```json
{
  "query": "bass",
  "limit": 5
}
```

**Example Response:**
```
Found 127 preset(s) matching "bass":

1. Bass Foundation (relevance: 100)
   Categories: Bass:Sub
   Author: u-he

2. Deep Bass (relevance: 100)
   Categories: Bass:Sub, Bass:Synth
   Author: Howard Scarr
...
```

#### `filter_presets`
Filters presets by specific criteria. Can combine multiple filters.

**Parameters:**
- `category` (string, optional): Filter by category prefix (e.g., "Bass", "Bass:Sub")
- `author` (string, optional): Filter by author name (exact match)
- `favorites` (string, optional): Filter by favorites file (e.g., "MyFavorites.uhe-fav")
- `pattern` (string, optional): Filter by glob pattern

**Example:**
```json
{
  "category": "Bass:Sub",
  "author": "u-he"
}
```

**Example Response:**
```
Found 23 preset(s) matching filters: category: "Bass:Sub", author: "u-he"

1. 303 Bass
   Categories: Bass:Sub, Bass:Acid
   Author: u-he

2. Analog Monster
   Categories: Bass:Sub
   Author: u-he
...
```

#### `explain_preset`
Gets detailed information about a specific preset including all metadata and parameters.

**Parameters:**
- `preset_name` (string, required): Preset name without .h2p extension
- `include_parameters` (boolean, optional): Include full parameter list (default: false)

**Example:**
```json
{
  "preset_name": "303 Bass",
  "include_parameters": true
}
```

**Example Response:**
```markdown
# 303 Bass

**Path:** /Local/Bass/303 Bass.h2p

## Metadata

- **Author:** u-he
- **Description:** Classic 303-style acid bass
- **Categories:** Bass:Acid, Bass:Sub

## Parameters (189 total)

### Section: HEAD
- #AM = Diva (string)
- #cm = VCF1 (string)
...

### Section: VCF1
- Mode = 0 (integer)
- Cutoff = 0.456 (float)
- Resonance = 0.73 (float)
...
```

#### `get_categories`
Lists all unique preset categories in the loaded library.

**Parameters:** None

**Example Response:**
```
Found 45 unique categories:

Arp:Dotted
Arp:Straight
Bass:Acid
Bass:Sub
Bass:Synth
Lead:Mono
Lead:Poly
Pad:Bright
Pad:Dark
...
```

#### `get_authors`
Lists all unique preset authors/creators.

**Parameters:** None

**Example Response:**
```
Found 12 unique author(s):

Howard Scarr
Oli Larkin
Rob Papen
u-he
...
```

#### `get_favorites_files`
Lists all .uhe-fav favorites files found for the current synth.

**Parameters:** None

**Example Response:**
```
Found 3 favorites file(s):

- MyFavorites.uhe-fav (45 presets)
- LiveSet.uhe-fav (23 presets)
- Experimental.uhe-fav (67 presets)
```

---

### Preset Generation

All generation tools create presets in the `/RANDOM` folder within the synth's user presets directory.

#### `generate_random_presets`
Generates fully random presets based on parameter statistics from your library.

**Parameters:**
- `amount` (number, optional): Number of presets to generate (default: 10)
- `stable` (boolean, optional): Use stable randomization mode (default: false)
- `dictionary` (boolean, optional): Use meaningful names from library (default: true)

**Example:**
```json
{
  "amount": 5,
  "stable": true,
  "dictionary": true
}
```

**Example Response:**
```
Successfully generated 5 random preset(s)!

Saved to: /Library/Audio/Presets/u-he/Diva/UserPresets/Diva/RANDOM/Fully Random/

Generated files:
- /path/to/Cosmic Wobble.h2p
- /path/to/Digital Thunder.h2p
- /path/to/Metallic Dreams.h2p
- /path/to/Analog Whisper.h2p
- /path/to/Crystal Pulse.h2p
```

**Modes:**
- **Stable mode** (`stable: true`): Randomizes parameters per-section to maintain sonic coherence
- **Full random** (`stable: false`): Each parameter randomized independently for more extreme results

#### `randomize_presets`
Creates variations of existing presets by randomly modifying their parameters.

**Parameters:**
- `preset_names` (string[], optional): Array of preset names to randomize
- `pattern` (string, optional): Glob pattern to select presets (alternative to preset_names)
- `amount` (number, optional): Variations per base preset (default: 10)
- `randomness` (number, optional): Randomness percentage 0-100 (default: 50)
- `stable` (boolean, optional): Use stable randomization (default: true)

**Example:**
```json
{
  "preset_names": ["303 Bass", "Deep Sub"],
  "amount": 3,
  "randomness": 30
}
```

**Example Response:**
```
Successfully generated 6 randomized preset variation(s)!

Base preset(s): 303 Bass, Deep Sub
Randomness: 30%

Saved to: /path/to/UserPresets/Diva/RANDOM/Randomized Preset/

Generated files:
- /path/to/303 Bass/303 Bass Random 1.h2p
- /path/to/303 Bass/303 Bass Random 2.h2p
- /path/to/303 Bass/303 Bass Random 3.h2p
- /path/to/Deep Sub/Deep Sub Random 1.h2p
- /path/to/Deep Sub/Deep Sub Random 2.h2p
- /path/to/Deep Sub/Deep Sub Random 3.h2p
```

**Randomness Scale:**
- `0%`: No change (exact copy)
- `25%`: Subtle variations
- `50%`: Moderate changes
- `75%`: Significant alterations
- `100%`: Completely random

#### `merge_presets`
Merges multiple presets together to create hybrid sounds.

**Parameters:**
- `preset_names` (string[], optional): Presets to merge (supports "*" for random, "?" for random from list)
- `pattern` (string, optional): Glob pattern to select presets (alternative to preset_names)
- `amount` (number, optional): Number of merged presets to generate (default: 10)
- `randomness` (number, optional): Additional randomness after merging 0-100 (default: 0)
- `stable` (boolean, optional): Use stable randomization (default: true)

**Example:**
```json
{
  "preset_names": ["303 Bass", "Analog Monster", "Deep Sub"],
  "amount": 5,
  "randomness": 10
}
```

**Example Response:**
```
Successfully generated 5 merged preset(s)!

Merge sources: 303 Bass, Analog Monster, Deep Sub
Additional randomness: 10%

Saved to: /path/to/UserPresets/Diva/RANDOM/Merged Preset/

Generated files:
- /path/to/Merged Random 1.h2p
- /path/to/Merged Random 2.h2p
- /path/to/Merged Random 3.h2p
- /path/to/Merged Random 4.h2p
- /path/to/Merged Random 5.h2p
```

**Special Patterns:**
- Use `"*"` to randomly select from all presets for each merge
- Use `"?"` to randomly select from the specified preset list for each merge
- Use glob patterns like `"Bass/**/*"` to merge from a subset

## Usage Examples

### Example 1: Exploring a New Synth

```
User: "What synths do I have installed?"
Assistant: [Calls list_synths]

User: "Let's work with Diva"
Assistant: [Calls select_synth with synth="Diva"]

User: "What categories of presets are available?"
Assistant: [Calls get_categories]

User: "Show me some bass presets"
Assistant: [Calls filter_presets with category="Bass"]
```

### Example 2: Creating Variations

```
User: "I like the '303 Bass' preset. Can you make some variations of it?"
Assistant: [Calls explain_preset to understand it, then randomize_presets with preset_names=["303 Bass"], amount=5, randomness=40]

User: "Make them a bit more extreme"
Assistant: [Calls randomize_presets with higher randomness=70]
```

### Example 3: Sound Design Exploration

```
User: "Create some hybrid bass sounds by merging my favorite bass presets"
Assistant: [Calls search_presets with query="bass", then merge_presets with selected preset names]

User: "Now make fully random variations of those merged presets"
Assistant: [Uses generated presets as base for randomize_presets]
```

### Example 4: Working with Favorites

```
User: "What's in my LiveSet favorites?"
Assistant: [Calls get_favorites_files, then filter_presets with favorites="LiveSet.uhe-fav"]

User: "Generate some random presets based on those sounds"
Assistant: [Uses filtered library to call generate_random_presets with stable=true]
```

## Internal Architecture

### State Management

The MCP server maintains a stateful session with the following structure:

```typescript
interface ServerState {
  availableSynths: DetectedPresetLibrary[];  // Detected synths on system
  currentSynth: SynthNames | null;           // Currently selected synth
  presetLibrary: PresetLibrary | null;       // Loaded preset library
  config: Config;                             // Server configuration
}
```

**State Lifecycle:**

1. **Initialization**: Server starts, detects available synths on startup
2. **Synth Selection**: User calls `select_synth`, presets are loaded into memory
3. **Operations**: All discovery and generation tools operate on the loaded library
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
│        │        │
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

### Tool Handler Pattern

Each tool follows a consistent handler pattern:

```typescript
function handleToolName(args: ToolArgs) {
  // 1. Validate synth context if needed
  const library = requireSynth();

  // 2. Perform operation
  const result = performOperation(library, args);

  // 3. Format response
  return {
    content: [{
      type: 'text',
      text: formatResponse(result)
    }]
  };
}
```

### Preset Library Loading

When `select_synth` is called:

1. **Detection**: Finds synth installation path using platform-specific logic
2. **File Discovery**: Uses `fast-glob` to find all `.h2p` preset files
3. **Parsing**: Each preset is parsed to extract:
   - Metadata (author, description, categories)
   - Parameters (all synth settings)
   - Binary data (advanced modulation, if enabled)
4. **Caching**: All presets stored in memory for fast access
5. **Favorites**: `.uhe-fav` files are also loaded and indexed

**Performance Optimization:**
- Presets are loaded once and cached
- Subsequent operations work on in-memory data
- Typical load time: 500ms-2s for 500-1000 presets

### Safety Mechanisms

The server implements several safety features:

1. **Path Validation**: All file writes use `validateSafePath()` to prevent directory traversal
2. **Write Restrictions**: Only writes to `/RANDOM` folder within user presets directory
3. **Error Handling**: All operations wrapped in try-catch with informative error messages
4. **Input Validation**: Tool parameters validated against JSON schemas

### Transport Layer

The server uses **stdio transport** for MCP communication:

```typescript
const transport = new StdioServerTransport();
await server.connect(transport);
```

This means:
- Commands received via `stdin`
- Responses sent via `stdout`
- Logs and errors sent via `stderr`
- Compatible with all MCP clients that support stdio

## Comparison with CLI

| Feature | CLI | MCP Server |
|---------|-----|------------|
| **Interface** | Interactive prompts | Tool calls from AI |
| **State** | Per-session, prompt-driven | Persistent synth context |
| **Preset Loading** | On-demand per operation | Once, then cached |
| **Natural Language** | Limited | Full (via AI assistant) |
| **Batch Operations** | Single operation mode | Multiple operations per session |
| **Configuration** | Command-line flags | Tool parameters |
| **Output** | Terminal formatting | Structured text responses |
| **Use Case** | Direct human usage | AI-assisted workflows |

**When to use CLI:**
- Quick one-off preset generation
- Scripting and automation
- Integration with shell scripts

**When to use MCP Server:**
- Conversational exploration of presets
- Complex multi-step workflows
- AI-assisted sound design
- Integration with AI coding assistants

## Troubleshooting

### Server Won't Start

**Issue:** Server exits immediately or shows connection errors

**Solutions:**
1. Check that Node.js v20+ is installed: `node --version`
2. Verify installation: `which u-he-mcp-server`
3. Test manually: `u-he-mcp-server` (should wait for input)
4. Check MCP client logs for detailed error messages

### No Synths Detected

**Issue:** `list_synths` returns no synths

**Solutions:**
1. Verify u-he synths are installed
2. Check installation paths:
   - macOS: `~/Library/Audio/Presets/u-he/`
   - Windows: `C:\Program Files\Common Files\VST3\*.data\`
   - Linux: `~/.u-he/`
3. Use `--custom-folder` flag if synths are in non-standard locations
4. Run `detect-synths` CLI command to test detection

### Preset Loading Fails

**Issue:** `select_synth` fails or loads 0 presets

**Solutions:**
1. Check folder permissions (must be readable)
2. Verify `.h2p` files exist in synth folders
3. Check for corrupted preset files
4. Try loading with a pattern: `select_synth` with `pattern: "**/*"`
5. Enable debug mode to see detailed logs

### Tool Calls Fail

**Issue:** MCP client reports tool execution failures

**Solutions:**
1. Ensure synth is selected first (`select_synth` must be called)
2. Verify tool parameters match the expected schema
3. Check preset names match exactly (case-sensitive)
4. Review error messages for specific issues
5. Check disk space for generation operations

### Generated Presets Sound Wrong

**Issue:** Generated presets don't sound good or are silent

**Solutions:**
1. Try `stable: true` for more coherent randomization
2. Start with lower `randomness` values (30-50%)
3. Use `dictionary: true` to leverage existing preset data
4. Merge presets from the same category for better results
5. Check that binary modulation data is enabled if needed (`binary: true`)

### Performance Issues

**Issue:** Server is slow or unresponsive

**Solutions:**
1. Reduce preset library size with `pattern` parameter
2. Load smaller preset sets for faster operations
3. Limit generation `amount` for large batches
4. Check system resources (memory, disk I/O)
5. Consider using `pattern` filters when selecting synth

## Advanced Configuration

### Custom Synth Locations

If your synths are installed in non-standard locations, you can configure the server to look in custom paths. This requires modifying the server startup:

```json
{
  "mcpServers": {
    "u-he-preset-randomizer": {
      "command": "u-he-mcp-server",
      "args": [],
      "env": {
        "UHE_CUSTOM_FOLDER": "/custom/path/to/synths"
      }
    }
  }
}
```

### Debug Mode

Enable debug output for troubleshooting:

```json
{
  "mcpServers": {
    "u-he-preset-randomizer": {
      "command": "u-he-mcp-server",
      "args": [],
      "env": {
        "DEBUG": "true"
      }
    }
  }
}
```

Debug logs will appear in the MCP client's log output (usually `stderr`).

## Contributing

Found a bug or want to add a feature? Please open an issue or pull request on the [GitHub repository](https://github.com/Fannon/u-he-preset-randomizer).

## License

MIT License - See LICENSE file for details.
