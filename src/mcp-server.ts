#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import chalk from 'chalk';
import { type Config, getDefaultConfig } from './config.js';
import { type GenerationResult, generatePresets } from './generatePresets.js';
import {
  narrowDownByAuthor,
  narrowDownByCategory,
  narrowDownByFavoritesFile,
} from './libraryFilters.js';
import { isValidPreset, parseUhePreset } from './parser.js';
import { loadPresetLibrary, type PresetLibrary } from './presetLibrary.js';
import {
  type DetectedPresetLibrary,
  detectPresetLibraryLocations,
  type SynthNames,
  uheSynthNames,
} from './utils/detector.js';

// Load package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
  version: string;
};

const DEFAULT_PRESET_AMOUNT = 16;
const SKILLS_DIR = join(__dirname, '..', 'src', 'skills');
const synthContextFileOverrides: Partial<Record<SynthNames, string>> = {
  ZebraHZ: 'Zebra2',
};

function resolveContextFilePath(synthName: SynthNames): string {
  const contextFileName = synthContextFileOverrides[synthName] ?? synthName;
  return join(SKILLS_DIR, `${contextFileName}.md`);
}

// Server state
interface ServerState {
  availableSynths: DetectedPresetLibrary[];
  currentSynth: SynthNames | null;
  presetLibrary: PresetLibrary | null;
  config: Config;
  detectionWarningLogged: boolean;
}

const state: ServerState = {
  availableSynths: [],
  currentSynth: null,
  presetLibrary: null,
  config: getDefaultConfig(),
  detectionWarningLogged: false,
};

function ensureSynthDetection() {
  if (state.availableSynths.length > 0) {
    return;
  }

  try {
    state.availableSynths = detectPresetLibraryLocations(state.config);
  } catch (error) {
    if (!state.detectionWarningLogged) {
      console.error(
        chalk.yellow('Warning: Synth detection failed when listing tools.'),
        error,
      );
      state.detectionWarningLogged = true;
    }
  }
}

/**
 * Load synth-specific context documentation from the skills directory.
 * @param synthName The name of the synth to load context for
 * @returns The context content as a string, or null if not available
 */
function loadSynthContext(synthName: SynthNames): string | null {
  try {
    const contextFilePath = resolveContextFilePath(synthName);

    if (!existsSync(contextFilePath)) {
      return null;
    }

    return readFileSync(contextFilePath, 'utf-8');
  } catch (error) {
    console.error(`Failed to load context file for ${synthName}:`, error);
    return null;
  }
}

/**
 * Check if context documentation is available for a synth.
 * @param synthName The name of the synth to check
 * @returns True if context documentation exists
 */
function hasContextAvailable(synthName: SynthNames): boolean {
  const contextFilePath = resolveContextFilePath(synthName);
  return existsSync(contextFilePath);
}

function getSynthOptions(): string[] {
  ensureSynthDetection();

  if (state.availableSynths.length > 0) {
    const uniqueSynths = Array.from(
      new Set(state.availableSynths.map((s) => s.synthName)),
    ).sort((a, b) => a.localeCompare(b));
    return uniqueSynths;
  }

  return [...uheSynthNames];
}

function resolveAmount(requestedAmount: number | undefined): number {
  if (
    typeof requestedAmount === 'number' &&
    Number.isFinite(requestedAmount) &&
    requestedAmount > 0
  ) {
    return Math.floor(requestedAmount);
  }
  return DEFAULT_PRESET_AMOUNT;
}

const serverInstructions = [
  '1. Use list_synths to discover installed u-he synths.',
  '2. Call select_synth to load a library (supported: ' +
    Array.from(uheSynthNames).join(', ') +
    ').',
  '   TIP: For large libraries (3000+ presets), use pattern parameter for faster loading.',
  '   Example: select_synth(synth="Hive", pattern="Bass/**/*") loads only bass presets.',
  '   Omit pattern to load all presets (slower but gives full library access).',
  '3. Explore presets with search_presets, filter_presets, explain_preset.',
  '4. Generate new sounds (all generated presets are automatically added to the loaded library):',
  '   - generate_random_presets: Fully random patches (supports author/category/pattern/favorites filters)',
  '   - randomize_presets: Variations of existing presets (supports author/category/pattern filters)',
  '   - merge_presets: Hybrid blends of multiple presets (supports author/category filters + wildcards)',
  '   NOTE: Generation filters work on loaded presets only. If library was loaded with pattern,',
  '   only those presets are available for filtering/generation.',
  '5. Use get_synth_context for technical documentation (Diva, Hive, Repro-1, Repro-5).',
  '',
  'COMMON WORKFLOWS:',
  '- Load and generate: select_synth(synth="Hive") → generate_random_presets(category="Bass", amount=16)',
  '- Fast focused workflow: select_synth(synth="Hive", pattern="Bass/**/*") → generate_random_presets(amount=16)',
  '- Preset variations: randomize_presets(preset_names=["My Favorite"], amount=4, randomness=30)',
  '- Expand filtered library: select_synth(synth="Hive") [omit pattern to reload all]',
  '',
  'IMPORTANT: In randomize_presets, "amount" is per source preset:',
  '- 1 preset + amount=4 → 4 files total',
  '- 10 presets (via author filter) + amount=2 → 20 files total',
].join('\n');

// Initialize MCP server
const server = new Server(
  {
    name: 'u-he-preset-randomizer',
    version: packageJson.version,
    description: 'u-he Synth Preset Library Randomizer and Explorer',
  },
  {
    capabilities: {
      tools: {},
    },
    instructions: serverInstructions,
  },
);

// Define all available tools
const tools: Tool[] = [
  {
    name: 'list_synths',
    description:
      'List all available u-he synths detected on this system. Call this to see which synths are installed and can be selected.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'select_synth',
    description:
      'Select a synth and load its preset library. MUST be called before other preset tools. Optional pattern filters which presets are loaded (for faster loading with large libraries). Trade-off: filtered loading is faster but limits subsequent operations to only those presets until reloaded. Omit pattern for full library access (recommended unless library is very large).',
    inputSchema: {
      type: 'object',
      properties: {
        synth: {
          type: 'string',
          description:
            'Name of the synth to select (e.g., "Diva", "Zebra3", "Hive")',
        },
        pattern: {
          type: 'string',
          description:
            'Optional glob pattern to filter loaded presets (e.g., "Bass/**/*", "**/*Pad*"). Use for faster loading with large libraries (3000+ presets). Omit to load all presets (default, recommended). To switch between filtered/full, call again with/without pattern.',
        },
      },
      required: ['synth'],
    },
  },
  {
    name: 'get_current_synth',
    description:
      'Get information about the currently selected synth, including its name and the number of loaded presets.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'list_presets',
    description:
      'List all loaded presets for the current synth with their names, categories, and authors. Use this for browsing available presets. Requires a synth to be selected first.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description:
            'Maximum number of presets to return. Defaults to 50. Use higher values to see more presets.',
        },
        offset: {
          type: 'number',
          description:
            'Number of presets to skip before returning results. Use for pagination.',
        },
      },
      required: [],
    },
  },
  {
    name: 'search_presets',
    description:
      'Search presets by name, category, or author using fuzzy matching. Returns matching presets with relevance scoring. Requires a synth to be selected first.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Search query to match against preset names, categories, and authors (e.g., "bass", "pad", "fat")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return. Defaults to 20.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'filter_presets',
    description:
      'Filter presets by specific criteria including category (hierarchical), author, favorites file, or glob pattern. Can combine multiple filters. Requires a synth to be selected first.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description:
            'Filter by category prefix (e.g., "Bass", "Bass:Sub", "Lead:Mono"). Uses hierarchical matching.',
        },
        author: {
          type: 'string',
          description:
            'Filter by preset author/creator name (exact match required)',
        },
        favorites: {
          type: 'string',
          description:
            'Filter by favorites file name (e.g., "MyFavorites.uhe-fav")',
        },
        pattern: {
          type: 'string',
          description:
            'Glob pattern to filter preset paths (e.g., "Bass/**/*", "*Pad*")',
        },
      },
      required: [],
    },
  },
  {
    name: 'explain_preset',
    description:
      'Get detailed information about a specific preset including all metadata, parameters, and values. Use this to understand what makes a preset unique. Requires a synth to be selected first.',
    inputSchema: {
      type: 'object',
      properties: {
        preset_name: {
          type: 'string',
          description: 'Name of the preset to explain (without .h2p extension)',
        },
        include_parameters: {
          type: 'boolean',
          description:
            'Include full parameter list in the explanation. Defaults to false (only shows metadata).',
        },
      },
      required: ['preset_name'],
    },
  },
  {
    name: 'get_categories',
    description:
      'Get a list of all unique preset categories available in the currently loaded presets. Useful for discovering what types of sounds are available. Requires a synth to be selected first.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_authors',
    description:
      'Get a list of all unique preset authors/creators in the currently loaded presets. Useful for filtering by favorite sound designers. Requires a synth to be selected first.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_favorites_files',
    description:
      'Get a list of all .uhe-fav favorites files found for the current synth. These can be used for filtering presets. Requires a synth to be selected first.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_synth_context',
    description:
      'Get detailed technical documentation about how the currently selected u-he synth works, including its preset format, parameters, modules, and architecture. This is extremely useful for understanding synth-specific settings before analyzing or creating presets. Requires a synth to be selected first.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'generate_random_presets',
    description: `Generate fully random presets based on parameter statistics from the loaded preset library. Optionally filter the statistical basis by author, category, pattern, or favorites to generate more focused/coherent sounds (e.g., random bass presets). Generated presets are automatically added to the library for immediate use with search_presets and explain_preset. Defaults to ${DEFAULT_PRESET_AMOUNT} presets if amount is omitted.`,
    inputSchema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: `Number of random presets to generate. Defaults to ${DEFAULT_PRESET_AMOUNT}.`,
          default: DEFAULT_PRESET_AMOUNT,
        },
        pattern: {
          type: 'string',
          description:
            'Optional glob pattern to filter which presets to use as statistical basis (e.g., "Bass/**/*", "**/*Pad*").',
        },
        author: {
          type: 'string',
          description:
            'Filter statistical basis by author name (exact match). Use presets from specific author as inspiration.',
        },
        category: {
          type: 'string',
          description:
            'Filter statistical basis by category prefix (e.g., "Bass", "Bass:Sub"). Generate random sounds in specific category style.',
        },
        favorites: {
          type: 'string',
          description:
            'Filter statistical basis by favorites file name (e.g., "MyFavorites.uhe-fav"). Use only favorited presets as inspiration.',
        },
        stable: {
          type: 'boolean',
          description:
            'Use stable randomization (randomizes per-section to maintain coherence). Defaults to true.',
        },
        dictionary: {
          type: 'boolean',
          description:
            'Use dictionary of meaningful names from preset library. Defaults to true.',
        },
      },
      required: [],
    },
  },
  {
    name: 'randomize_presets',
    description: `Create variations of existing presets by randomly modifying their parameters (0-100% randomness). Select source presets by preset_names, pattern, author, or category. IMPORTANT: 'amount' is per source preset (1 preset + amount=4 → 4 files; 10 presets + amount=2 → 20 files). Generated variations are automatically added to the library. Defaults to ${DEFAULT_PRESET_AMOUNT} variations per preset and 50% randomness.`,
    inputSchema: {
      type: 'object',
      properties: {
        preset_names: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Names of presets to randomize (without .h2p extension). Can specify multiple.',
        },
        pattern: {
          type: 'string',
          description:
            'Path substring to filter presets (e.g., "Bass/**/*"). Alternative to preset_names.',
        },
        author: {
          type: 'string',
          description:
            'Filter source presets by author name (exact match). Alternative to preset_names/pattern.',
        },
        category: {
          type: 'string',
          description:
            'Filter source presets by category prefix (e.g., "Bass", "Bass:Sub"). Alternative to preset_names/pattern.',
        },
        amount: {
          type: 'number',
          description: `Number of variations to generate per base preset. Defaults to ${DEFAULT_PRESET_AMOUNT}.`,
          default: DEFAULT_PRESET_AMOUNT,
        },
        randomness: {
          type: 'number',
          description:
            'Percentage of randomness to apply (0-100). 0 = no change, 100 = completely random. Defaults to 50.',
        },
        stable: {
          type: 'boolean',
          description:
            'Use stable randomization (randomizes per-section). Defaults to true.',
        },
      },
      required: [],
    },
  },
  {
    name: 'merge_presets',
    description: `Merge multiple presets to create hybrid sounds using weighted random ratios. Select presets via preset_names (supports wildcards: "*" for random from all, "?" for random from list), or filter by author/category/pattern. Generated merges are automatically added to the library. Defaults to ${DEFAULT_PRESET_AMOUNT} merged presets with 0% additional randomness.`,
    inputSchema: {
      type: 'object',
      properties: {
        preset_names: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Names of presets to merge (without .h2p). Use "*" for random from all presets, "?" for random from specified list.',
        },
        pattern: {
          type: 'string',
          description:
            'Path substring to select presets to merge from (e.g., "Bass/**/*"). Alternative to preset_names.',
        },
        author: {
          type: 'string',
          description:
            'Filter source presets by author name. Random presets from this author will be merged. Alternative to preset_names/pattern.',
        },
        category: {
          type: 'string',
          description:
            'Filter source presets by category prefix. Random presets from this category will be merged. Alternative to preset_names/pattern.',
        },
        amount: {
          type: 'number',
          description: `Number of merged presets to generate. Defaults to ${DEFAULT_PRESET_AMOUNT}.`,
          default: DEFAULT_PRESET_AMOUNT,
        },
        randomness: {
          type: 'number',
          description:
            'Additional randomness to apply after merging (0-100). Defaults to 0.',
        },
        stable: {
          type: 'boolean',
          description:
            'Use stable randomization for any additional randomness. Defaults to true.',
        },
      },
      required: [],
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const synthOptions = getSynthOptions();

  const toolsWithHints = tools.map((tool) => {
    if (tool.name === 'select_synth') {
      const properties = {
        ...(tool.inputSchema?.properties ?? {}),
      } as Record<string, unknown>;
      const synthProperty = {
        ...((properties.synth as Record<string, unknown> | undefined) ?? {}),
      };

      return {
        ...tool,
        description: `${tool.description} Known synth options include: ${synthOptions.join(', ')}.`,
        inputSchema: {
          ...tool.inputSchema,
          properties: {
            ...properties,
            synth: {
              ...synthProperty,
              enum: synthOptions,
            },
          },
        },
      };
    }

    return tool;
  });

  return { tools: toolsWithHints };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_synths':
        return handleListSynths();
      case 'select_synth':
        return handleSelectSynth(args as { synth: string; pattern?: string });
      case 'get_current_synth':
        return handleGetCurrentSynth();
      case 'list_presets':
        return handleListPresets(args as { limit?: number; offset?: number });
      case 'search_presets':
        return handleSearchPresets(args as { query: string; limit?: number });
      case 'filter_presets':
        return handleFilterPresets(
          args as {
            category?: string;
            author?: string;
            favorites?: string;
            pattern?: string;
          },
        );
      case 'explain_preset':
        return handleExplainPreset(
          args as { preset_name: string; include_parameters?: boolean },
        );
      case 'get_categories':
        return handleGetCategories();
      case 'get_authors':
        return handleGetAuthors();
      case 'get_favorites_files':
        return handleGetFavoritesFiles();
      case 'get_synth_context':
        return handleGetSynthContext();
      case 'generate_random_presets':
        return handleGenerateRandomPresets(
          args as {
            amount?: number;
            pattern?: string;
            author?: string;
            category?: string;
            favorites?: string;
            stable?: boolean;
            dictionary?: boolean;
          },
        );
      case 'randomize_presets':
        return handleRandomizePresets(
          args as {
            preset_names?: string[];
            pattern?: string;
            author?: string;
            category?: string;
            amount?: number;
            randomness?: number;
            stable?: boolean;
          },
        );
      case 'merge_presets':
        return handleMergePresets(
          args as {
            preset_names?: string[];
            pattern?: string;
            author?: string;
            category?: string;
            amount?: number;
            randomness?: number;
            stable?: boolean;
          },
        );
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
    };
  }
});

// Tool implementation functions

/**
 * Load and add generated presets to the current preset library.
 * This allows generated presets to be immediately searchable and explainable.
 */
function addGeneratedPresetsToLibrary(
  writtenFiles: string[],
  userPresetsFolder: string,
): number {
  if (!state.presetLibrary) {
    return 0;
  }

  let addedCount = 0;
  const binary = state.config.binary ?? false;

  for (const absolutePath of writtenFiles) {
    try {
      // Convert absolute path to relative path from userPresetsFolder
      const normalizedAbsolute = normalize(absolutePath);
      const normalizedUserFolder = normalize(userPresetsFolder);
      const relativePath = relative(normalizedUserFolder, normalizedAbsolute);

      // Create a virtual path in the format expected by the preset library
      const virtualPath = `/User/${relativePath.split('\\').join('/')}`;

      // Read and parse the preset file
      const presetString = readFileSync(normalizedAbsolute, 'utf-8');
      const parsedPreset = parseUhePreset(presetString, virtualPath, binary);

      if (isValidPreset(parsedPreset)) {
        state.presetLibrary.presets.push(parsedPreset);
        addedCount++;
      }
    } catch (error) {
      console.error(
        chalk.yellow(
          `Warning: Could not load generated preset: ${absolutePath}`,
        ),
        error,
      );
    }
  }

  return addedCount;
}

function handleListSynths() {
  ensureSynthDetection();

  if (state.availableSynths.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `No u-he synths detected on this system. Please ensure u-he synths are installed. Known u-he products include: ${Array.from(uheSynthNames).join(', ')}.`,
        },
      ],
    };
  }

  const synthsList = state.availableSynths
    .map((synth) => {
      const current =
        synth.synthName === state.currentSynth ? ' (current)' : '';
      return `- ${synth.synthName}${current}\n  Location: ${synth.root}`;
    })
    .join('\n\n');

  return {
    content: [
      {
        type: 'text',
        text: `Found ${state.availableSynths.length} u-he synth(s):\n\n${synthsList}\n\nUse select_synth to choose one and load its presets, then call generate_random_presets to create new sounds (defaults to ${DEFAULT_PRESET_AMOUNT} presets when amount is omitted).`,
      },
    ],
  };
}

function handleSelectSynth(args: { synth: string; pattern?: string }) {
  const { synth, pattern } = args;

  ensureSynthDetection();

  // Find the synth
  const synthInfo = state.availableSynths.find(
    (s) => s.synthName.toLowerCase() === synth.toLowerCase(),
  );

  if (!synthInfo) {
    const synthOptions = getSynthOptions();
    return {
      content: [
        {
          type: 'text',
          text: `Synth "${synth}" not found. Available synths: ${synthOptions.join(', ')}`,
        },
      ],
    };
  }

  // Check if this synth is already loaded with the same pattern
  if (
    state.currentSynth === synthInfo.synthName &&
    state.presetLibrary !== null
  ) {
    // Normalize pattern comparison (undefined/null should match default '**/*')
    const normalizePattern = (p: string | undefined) => p ?? '**/*';
    const currentPattern = normalizePattern(state.config.pattern);
    const requestedPattern = normalizePattern(pattern);

    if (currentPattern === requestedPattern) {
      const patternInfo =
        pattern && pattern !== '**/*' ? ` (filtered by: ${pattern})` : '';
      return {
        content: [
          {
            type: 'text',
            text: `${synthInfo.synthName} is already loaded with ${state.presetLibrary.presets.length} presets${patternInfo}. No need to reload.`,
          },
        ],
      };
    }

    // Pattern changed - inform user why we're reloading
    const oldPatternInfo =
      currentPattern !== '**/*' ? ` (was: ${currentPattern})` : '';
    const newPatternInfo =
      requestedPattern !== '**/*' ? ` (now: ${requestedPattern})` : '';
    console.error(
      chalk.yellow(
        `Pattern changed${oldPatternInfo}${newPatternInfo}. Reloading preset library...`,
      ),
    );
  }

  // Update config - ALWAYS set pattern (even if undefined) to clear old value
  state.config.synth = synthInfo.synthName;
  state.config.pattern = pattern;

  // Load preset library
  try {
    const startTime = Date.now();
    state.presetLibrary = loadPresetLibrary(synthInfo.synthName, state.config);
    state.currentSynth = synthInfo.synthName;
    const loadTime = Date.now() - startTime;

    // Check if context documentation is available
    const contextAvailable = hasContextAvailable(synthInfo.synthName);
    const contextNote = contextAvailable
      ? `\n\nDetailed technical documentation is available for ${synthInfo.synthName}. Use get_synth_context to learn about its architecture, parameters, and preset format.`
      : '';

    const patternInfo = pattern
      ? `\nPattern filter: ${pattern} (call select_synth again without pattern to load full library)`
      : '';

    return {
      content: [
        {
          type: 'text',
          text: `Successfully selected ${synthInfo.synthName} and loaded ${state.presetLibrary.presets.length} presets in ${loadTime}ms.${patternInfo}\n\nYou can now use other tools to browse, search, filter, and generate presets. Call generate_random_presets without arguments to create ${DEFAULT_PRESET_AMOUNT} fresh patches immediately.${contextNote}`,
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Failed to load presets for ${synthInfo.synthName}: ${errorMessage}`,
        },
      ],
    };
  }
}

function handleGetCurrentSynth() {
  if (!state.currentSynth || !state.presetLibrary) {
    return {
      content: [
        {
          type: 'text',
          text: 'No synth is currently selected. Use select_synth to choose a synth and load its presets.',
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `Current synth: ${state.currentSynth}\nLoaded presets: ${state.presetLibrary.presets.length}\nRoot folder: ${state.presetLibrary.rootFolder}\nUser presets folder: ${state.presetLibrary.userPresetsFolder}`,
      },
    ],
  };
}

function requireSynth(): PresetLibrary {
  if (!state.currentSynth || !state.presetLibrary) {
    throw new Error('No synth is currently selected. Use select_synth first.');
  }
  return state.presetLibrary;
}

function requireSynthWithName(): {
  library: PresetLibrary;
  synthName: SynthNames;
} {
  if (!state.currentSynth || !state.presetLibrary) {
    throw new Error('No synth is currently selected. Use select_synth first.');
  }
  return {
    library: state.presetLibrary,
    synthName: state.currentSynth,
  };
}

function handleListPresets(args: { limit?: number; offset?: number }) {
  const library = requireSynth();
  const limit = args.limit ?? 50;
  const offset = args.offset ?? 0;

  const presets = library.presets.slice(offset, offset + limit);

  if (presets.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `No presets found in the specified range. Total presets: ${library.presets.length}`,
        },
      ],
    };
  }

  const presetsList = presets
    .map((preset, index) => {
      const categories = preset.categories.join(', ') || 'No category';
      const author =
        preset.meta.find((m) => m.key === 'Author')?.value || 'Unknown';
      return `${offset + index + 1}. ${preset.presetName}\n   Categories: ${categories}\n   Author: ${author}\n   Path: ${preset.filePath}`;
    })
    .join('\n\n');

  return {
    content: [
      {
        type: 'text',
        text: `Showing presets ${offset + 1}-${offset + presets.length} of ${library.presets.length}:\n\n${presetsList}`,
      },
    ],
  };
}

function handleSearchPresets(args: { query: string; limit?: number }) {
  const library = requireSynth();
  const query = args.query.toLowerCase();
  const limit = args.limit ?? 20;

  // Simple relevance scoring
  const matches = library.presets
    .map((preset) => {
      let score = 0;
      const presetNameLower = preset.presetName.toLowerCase();
      const categoriesLower = preset.categories.join(' ').toLowerCase();
      const author =
        preset.meta
          .find((m) => m.key === 'Author')
          ?.value?.toString()
          .toLowerCase() || '';

      // Exact name match
      if (presetNameLower === query) score += 100;
      // Name starts with query
      else if (presetNameLower.startsWith(query)) score += 50;
      // Name contains query
      else if (presetNameLower.includes(query)) score += 25;

      // Category match
      if (categoriesLower.includes(query)) score += 15;

      // Author match
      if (author.includes(query)) score += 10;

      return { preset, score };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (matches.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `No presets found matching "${args.query}". Try a different search term or use filter_presets for more specific filtering.`,
        },
      ],
    };
  }

  const matchesList = matches
    .map((match, index) => {
      const { preset, score } = match;
      const categories = preset.categories.join(', ') || 'No category';
      const author =
        preset.meta.find((m) => m.key === 'Author')?.value || 'Unknown';
      return `${index + 1}. ${preset.presetName} (relevance: ${score})\n   Categories: ${categories}\n   Author: ${author}`;
    })
    .join('\n\n');

  return {
    content: [
      {
        type: 'text',
        text: `Found ${matches.length} preset(s) matching "${args.query}":\n\n${matchesList}`,
      },
    ],
  };
}

function handleFilterPresets(args: {
  category?: string;
  author?: string;
  favorites?: string;
  pattern?: string;
}) {
  const library = requireSynth();
  let filteredPresets = [...library.presets];
  const appliedFilters: string[] = [];

  if (args.category) {
    filteredPresets = narrowDownByCategory(
      { ...library, presets: filteredPresets },
      args.category,
    );
    appliedFilters.push(`category: "${args.category}"`);
  }

  if (args.author) {
    filteredPresets = narrowDownByAuthor(
      { ...library, presets: filteredPresets },
      args.author,
    );
    appliedFilters.push(`author: "${args.author}"`);
  }

  if (args.favorites) {
    filteredPresets = narrowDownByFavoritesFile(
      { ...library, presets: filteredPresets },
      args.favorites,
    );
    appliedFilters.push(`favorites: "${args.favorites}"`);
  }

  if (args.pattern) {
    const patternLower = args.pattern.toLowerCase();
    filteredPresets = filteredPresets.filter((preset) =>
      preset.filePath.toLowerCase().includes(patternLower),
    );
    appliedFilters.push(`pattern: "${args.pattern}"`);
  }

  if (filteredPresets.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `No presets found matching filters: ${appliedFilters.join(', ')}`,
        },
      ],
    };
  }

  const limit = 30;
  const presetsList = filteredPresets.slice(0, limit).map((preset, index) => {
    const categories = preset.categories.join(', ') || 'No category';
    const author =
      preset.meta.find((m) => m.key === 'Author')?.value || 'Unknown';
    return `${index + 1}. ${preset.presetName}\n   Categories: ${categories}\n   Author: ${author}`;
  });

  const moreText =
    filteredPresets.length > limit
      ? `\n\n... and ${filteredPresets.length - limit} more presets.`
      : '';

  return {
    content: [
      {
        type: 'text',
        text: `Found ${filteredPresets.length} preset(s) matching filters: ${appliedFilters.join(', ')}\n\n${presetsList.join('\n\n')}${moreText}`,
      },
    ],
  };
}

function handleExplainPreset(args: {
  preset_name: string;
  include_parameters?: boolean;
}) {
  const library = requireSynth();
  const preset = library.presets.find(
    (p) => p.presetName.toLowerCase() === args.preset_name.toLowerCase(),
  );

  if (!preset) {
    return {
      content: [
        {
          type: 'text',
          text: `Preset "${args.preset_name}" not found. Use list_presets or search_presets to find available presets.`,
        },
      ],
    };
  }

  // Try to load context file for the synth
  const contextContent = state.currentSynth
    ? loadSynthContext(state.currentSynth)
    : null;

  let explanation = `# ${preset.presetName}\n\n`;
  explanation += `**Path:** ${preset.filePath}\n\n`;

  // Metadata
  explanation += '## Metadata\n\n';
  for (const meta of preset.meta) {
    const value = Array.isArray(meta.value)
      ? meta.value.join(', ')
      : meta.value;
    explanation += `- **${meta.key}:** ${value}\n`;
  }

  // Categories
  if (preset.categories.length > 0) {
    explanation += `\n**Categories:** ${preset.categories.join(', ')}\n`;
  }

  // Parameters
  if (args.include_parameters) {
    explanation += `\n## Parameters (${preset.params.length} total)\n\n`;

    // Group by section
    const paramsBySection = new Map<string, typeof preset.params>();
    for (const param of preset.params) {
      if (!paramsBySection.has(param.section)) {
        paramsBySection.set(param.section, []);
      }
      paramsBySection.get(param.section)?.push(param);
    }

    for (const [section, params] of paramsBySection) {
      explanation += `### Section: ${section}\n\n`;
      for (const param of params.slice(0, 20)) {
        // Limit to first 20 per section
        explanation += `- ${param.key} = ${param.value} (${param.type})\n`;
      }
      if (params.length > 20) {
        explanation += `  ... and ${params.length - 20} more parameters\n`;
      }
      explanation += '\n';
    }
  } else {
    explanation += `\n**Total Parameters:** ${preset.params.length}\n`;
    explanation +=
      '\nUse include_parameters: true to see the full parameter list.\n';
  }

  // Build response with context if available
  const content: Array<{ type: string; text: string }> = [
    {
      type: 'text',
      text: explanation,
    },
  ];

  if (contextContent) {
    content.push({
      type: 'text',
      text: `\n---\n\n## Context: ${state.currentSynth} Preset Format Reference\n\n${contextContent}`,
    });
  }

  return {
    content,
  };
}

function handleGetCategories() {
  const library = requireSynth();
  const categories = new Set<string>();

  for (const preset of library.presets) {
    for (const category of preset.categories) {
      categories.add(category);
    }
  }

  const sortedCategories = Array.from(categories).sort();

  if (sortedCategories.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: 'No categories found in loaded presets.',
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `Found ${sortedCategories.length} unique categories:\n\n${sortedCategories.join('\n')}`,
      },
    ],
  };
}

function handleGetAuthors() {
  const library = requireSynth();
  const authors = new Set<string>();

  for (const preset of library.presets) {
    const author = preset.meta.find((m) => m.key === 'Author')?.value;
    if (author) {
      const authorStr = Array.isArray(author) ? author.join(', ') : author;
      authors.add(authorStr);
    }
  }

  const sortedAuthors = Array.from(authors).sort();

  if (sortedAuthors.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: 'No authors found in loaded presets.',
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `Found ${sortedAuthors.length} unique author(s):\n\n${sortedAuthors.join('\n')}`,
      },
    ],
  };
}

function handleGetFavoritesFiles() {
  const library = requireSynth();

  if (library.favorites.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: 'No favorites files (.uhe-fav) found for this synth.',
        },
      ],
    };
  }

  const favoritesList = library.favorites
    .map((fav) => `- ${fav.fileName} (${fav.presets.length} presets)`)
    .join('\n');

  return {
    content: [
      {
        type: 'text',
        text: `Found ${library.favorites.length} favorites file(s):\n\n${favoritesList}`,
      },
    ],
  };
}

function handleGetSynthContext() {
  if (!state.currentSynth) {
    return {
      content: [
        {
          type: 'text',
          text: 'No synth is currently selected. Use select_synth to choose a synth first.',
        },
      ],
    };
  }

  const contextContent = loadSynthContext(state.currentSynth);

  if (!contextContent) {
    return {
      content: [
        {
          type: 'text',
          text: `No technical documentation is currently available for ${state.currentSynth}. Documentation is available for: Diva, Hive, Repro-1, and Repro-5.`,
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `# ${state.currentSynth} Technical Documentation\n\n${contextContent}`,
      },
    ],
  };
}

function handleGenerateRandomPresets(args: {
  amount?: number;
  pattern?: string;
  author?: string;
  category?: string;
  favorites?: string;
  stable?: boolean;
  dictionary?: boolean;
}) {
  const { library, synthName } = requireSynthWithName();

  // Apply filters to create a filtered library for statistical basis
  let filteredLibrary = library;
  const appliedFilters: string[] = [];

  if (args.pattern || args.author || args.category || args.favorites) {
    let filteredPresets = [...library.presets];

    if (args.category) {
      filteredPresets = narrowDownByCategory(
        { ...library, presets: filteredPresets },
        args.category,
      );
      appliedFilters.push(`category: "${args.category}"`);
    }

    if (args.author) {
      filteredPresets = narrowDownByAuthor(
        { ...library, presets: filteredPresets },
        args.author,
      );
      appliedFilters.push(`author: "${args.author}"`);
    }

    if (args.favorites) {
      filteredPresets = narrowDownByFavoritesFile(
        { ...library, presets: filteredPresets },
        args.favorites,
      );
      appliedFilters.push(`favorites: "${args.favorites}"`);
    }

    if (args.pattern) {
      const patternLower = args.pattern.toLowerCase();
      filteredPresets = filteredPresets.filter((preset) =>
        preset.filePath.toLowerCase().includes(patternLower),
      );
      appliedFilters.push(`pattern: "${args.pattern}"`);
    }

    if (filteredPresets.length === 0) {
      throw new Error(
        `No presets found matching filters: ${appliedFilters.join(', ')}`,
      );
    }

    filteredLibrary = { ...library, presets: filteredPresets };
  }

  const config: Config = {
    ...state.config,
    synth: synthName,
    amount: resolveAmount(args.amount),
    stable: args.stable ?? true,
    dictionary: args.dictionary ?? true,
  };

  try {
    const result: GenerationResult = generatePresets(config, filteredLibrary);

    // Add generated presets to the library so they can be searched/explained immediately
    const addedCount = addGeneratedPresetsToLibrary(
      result.writtenFiles,
      library.userPresetsFolder,
    );

    const filterInfo =
      appliedFilters.length > 0
        ? `\nStatistical basis: ${filteredLibrary.presets.length} presets matching ${appliedFilters.join(', ')}\n`
        : '';

    const libraryInfo =
      addedCount > 0
        ? `\n✓ Added ${addedCount} preset(s) to loaded library (now searchable via search_presets and explain_preset)\n`
        : '';

    return {
      content: [
        {
          type: 'text',
          text: `Successfully generated ${result.presetCount} random preset(s)!${filterInfo}${libraryInfo}\nSaved to: ${result.outputFolder}/RANDOM/Fully Random/\n\nGenerated files:\n${result.writtenFiles.map((f) => `- ${f}`).join('\n')}`,
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate random presets: ${errorMessage}`);
  }
}

function handleRandomizePresets(args: {
  preset_names?: string[];
  pattern?: string;
  author?: string;
  category?: string;
  amount?: number;
  randomness?: number;
  stable?: boolean;
}) {
  const { library, synthName } = requireSynthWithName();

  // Determine which preset(s) to randomize
  let preset: string | string[];
  let sourceDescription: string;

  if (args.preset_names && args.preset_names.length > 0) {
    preset = args.preset_names;
    sourceDescription = `${preset.length} specified preset(s)`;
  } else if (args.author) {
    const filteredPresets = narrowDownByAuthor(library, args.author);
    if (filteredPresets.length === 0) {
      throw new Error(`No presets found by author: ${args.author}`);
    }
    preset = filteredPresets.map((p) => p.presetName);
    sourceDescription = `${preset.length} preset(s) by ${args.author}`;
  } else if (args.category) {
    const filteredPresets = narrowDownByCategory(library, args.category);
    if (filteredPresets.length === 0) {
      throw new Error(`No presets found in category: ${args.category}`);
    }
    preset = filteredPresets.map((p) => p.presetName);
    sourceDescription = `${preset.length} preset(s) in category ${args.category}`;
  } else if (args.pattern) {
    // Find presets matching the pattern
    const pattern = args.pattern;
    const matchingPresets = library.presets.filter((p) =>
      p.filePath.toLowerCase().includes(pattern.toLowerCase()),
    );
    if (matchingPresets.length === 0) {
      throw new Error(`No presets found matching pattern: ${pattern}`);
    }
    preset = matchingPresets.map((p) => p.presetName);
    sourceDescription = `${preset.length} preset(s) matching pattern "${pattern}"`;
  } else {
    throw new Error(
      'Either preset_names, pattern, author, or category must be specified for randomization',
    );
  }

  const amountPerPreset = resolveAmount(args.amount);
  const sourceCount = Array.isArray(preset) ? preset.length : 1;
  const expectedTotal = sourceCount * amountPerPreset;

  const config: Config = {
    ...state.config,
    synth: synthName,
    preset: preset,
    amount: amountPerPreset,
    randomness: args.randomness ?? 50,
    stable: args.stable ?? true,
  };

  try {
    const result: GenerationResult = generatePresets(config, library);

    // Add generated presets to the library so they can be searched/explained immediately
    const addedCount = addGeneratedPresetsToLibrary(
      result.writtenFiles,
      library.userPresetsFolder,
    );

    const libraryInfo =
      addedCount > 0
        ? `\n✓ Added ${addedCount} preset(s) to loaded library (now searchable via search_presets and explain_preset)\n`
        : '';

    return {
      content: [
        {
          type: 'text',
          text: `Successfully generated ${result.presetCount} randomized preset variation(s)!

Source: ${sourceDescription}
Generated: ${amountPerPreset} variation(s) per source preset
Total files: ${result.presetCount} (expected: ${expectedTotal})
Randomness: ${config.randomness}%${libraryInfo}

Saved to: ${result.outputFolder}/RANDOM/Randomized Preset/

Generated files:
${result.writtenFiles.map((f) => `- ${f}`).join('\n')}`,
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to randomize presets: ${errorMessage}`);
  }
}

function handleMergePresets(args: {
  preset_names?: string[];
  pattern?: string;
  author?: string;
  category?: string;
  amount?: number;
  randomness?: number;
  stable?: boolean;
}) {
  const { library, synthName } = requireSynthWithName();

  // Determine which preset(s) to merge
  let merge: string | string[];
  let sourceDescription: string;
  let libraryToUse = library;

  if (args.preset_names && args.preset_names.length > 0) {
    merge = args.preset_names;
    sourceDescription = `Specified presets with wildcards: ${merge.join(', ')}`;
  } else if (args.author) {
    const filteredPresets = narrowDownByAuthor(library, args.author);
    if (filteredPresets.length === 0) {
      throw new Error(`No presets found by author: ${args.author}`);
    }
    // Use wildcards to randomly select from author's presets for each merge
    merge = ['*', '*', '*', '*']; // Random selection from filtered set
    sourceDescription = `Random presets from ${filteredPresets.length} preset(s) by ${args.author}`;

    // Create a filtered library
    libraryToUse = { ...library, presets: filteredPresets };
    state.presetLibrary = libraryToUse;
  } else if (args.category) {
    const filteredPresets = narrowDownByCategory(library, args.category);
    if (filteredPresets.length === 0) {
      throw new Error(`No presets found in category: ${args.category}`);
    }
    merge = ['*', '*', '*', '*'];
    sourceDescription = `Random presets from ${filteredPresets.length} preset(s) in category ${args.category}`;

    libraryToUse = { ...library, presets: filteredPresets };
    state.presetLibrary = libraryToUse;
  } else if (args.pattern) {
    // Use pattern as merge selector
    merge = args.pattern;
    sourceDescription = `Pattern: ${args.pattern}`;
  } else {
    throw new Error(
      'Either preset_names, pattern, author, or category must be specified for merging',
    );
  }

  const config: Config = {
    ...state.config,
    synth: synthName,
    merge: merge,
    amount: resolveAmount(args.amount),
    randomness: args.randomness ?? 0,
    stable: args.stable ?? true,
  };

  try {
    const result: GenerationResult = generatePresets(config, libraryToUse);

    // Restore original library if we filtered it
    if (args.author || args.category) {
      state.presetLibrary = library;
    }

    // Add generated presets to the library so they can be searched/explained immediately
    const addedCount = addGeneratedPresetsToLibrary(
      result.writtenFiles,
      library.userPresetsFolder,
    );

    const libraryInfo =
      addedCount > 0
        ? `\n✓ Added ${addedCount} preset(s) to loaded library (now searchable via search_presets and explain_preset)\n`
        : '';

    return {
      content: [
        {
          type: 'text',
          text: `Successfully generated ${result.presetCount} merged preset(s)!

Source: ${sourceDescription}
Total files: ${result.presetCount}
Additional randomness: ${config.randomness}%${libraryInfo}

Saved to: ${result.outputFolder}/RANDOM/Merged Preset/

Generated files:
${result.writtenFiles.map((f) => `- ${f}`).join('\n')}`,
        },
      ],
    };
  } catch (error) {
    // Restore original library in case of error
    if (args.author || args.category) {
      state.presetLibrary = library;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to merge presets: ${errorMessage}`);
  }
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Detect synths on startup
  try {
    state.availableSynths = detectPresetLibraryLocations(state.config);
    console.error(
      chalk.green(
        `u-he Preset Randomizer MCP Server v${packageJson.version} started. Detected ${state.availableSynths.length} synth(s).`,
      ),
    );
  } catch (error) {
    state.detectionWarningLogged = true;
    console.error(
      chalk.yellow('Warning: Could not detect synths on startup:', error),
    );
  }
}

main().catch((error) => {
  console.error(chalk.red('Server error:'), error);
  process.exit(1);
});
