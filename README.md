# u-he-preset-randomizer

Generate [u-he](https://u-he.com/) synth presets through randomization and merging of your existing presets.

This tool can generate random presets in three different modes:
* Generate **fully random presets** based on real values and value distributions in your preset library
* **Randomize existing presets**, with a customizable amount of randomness
* **Merge multiple presets** together, with randomness introduced by different ratios between them.

The randomization / merging approach is very generic as it analyzes your actual preset library and bases the random values on the resulting statistical distributions.

In addition, there are **optional flags / modes** that that affect the randomization:
* Narrow down the analyzed presets that are the basis for random generation.
  * E.g. by only using a sub-folder, a certain tag category, author or a favorite file export.
  * This will influence / limit the range of values in the generated presets.
* Use `stable` mode for more reliable, but slightly less random results
* Use `binary` mode, see `--binary` [CLI arguments documentation](#cli-arguments--configuration).
 
It should work for all u-he synths on all platforms.
Some synths may work better, due to their simpler architecture (e.g. u-he Diva). 
More modular synths like Bazille or Zebra also work, but you'll get more "varied" results.

## How to use

This is a CLI application that you need to run in your terminal / command line.

First you need to install the [Node.js](https://nodejs.org/en) runtime.
Then you can open your Terminal / Console / Command Prompt and start it by entering a command, optionally with some arguments.
They start with `npx u-he-preset-randomizer@latest`, which will download and run the latest version of this tool:

```sh
npx u-he-preset-randomizer@latest
```

This will start the tool in **interactive mode**. It will guide you though the necessary choices.
Alternatively, you can pass some [arguments](#cli-arguments--configuration) if you already know the choices (non interactive).

The generated patches will be put into your selected synth preset directory, under a `/RANDOM` folder in your user presets.

![GIF Recording](./assets/u-he-preset-randomizer.gif)

If you want to download the tool for offline use and manual updates:

```sh
# install it as a global CLI tool
npm i -g u-he-preset-randomizer

# Now you can run it without npx:
u-he-preset-randomizer
```

### Generate Fully Randomized Presets

This command will run the randomizer to generate 3 fully randomized Diva presets.
Random values will be based on real values (and their distribution) of your actual presets. 

```sh
npx u-he-preset-randomizer@latest --synth Diva --amount 3
```

### Randomize a particular Preset

This command will take one particular preset "HS Greek Horn" and create 5 random variations of it, with a 20% randomization ratio.

```sh
npx u-he-preset-randomizer@latest --synth Diva --amount 5 --preset "HS Greek Horn" --randomness 20
```

### Merge multiple Presets together

This command will merge multiple presets together, with a random ratio on how much weight each one has in the "inheritance". 
The following example will take three Diva presets (each indicated with `--merge`) and create 5 merged variants out of them.

```bash
npx u-he-preset-randomizer@latest --synth Diva --amount 5 --merge "HS Greek Horn" --merge "HS Strumpet" --merge "HS Baroqualog"
```

## Tips & Tricks

* The u-he preset browser have the most flexibility in filtering and combining presets by category, tags, etc. You can use this to either copy them to a new folder or create a .uhe-fav file export and using this as narrow down selection in the CLI
* When merging presets, it's possible to select the same preset multiple times. Use this to assign "weights" between how strong a preset will influence the outcome.

### CLI Arguments / Configuration

> If you're unsure which values are correct to use, run the tool in interactive mode.
> Most config options here will be available with auto-complete or suggestions.

* `--synth`: Choose the u-he synth. Not all synths have been tested, but the randomizer tries to be generic. The name must match the folder name convention of u-he. E.g. `Diva`, `Hive`, `ZebraHZ`.
* `--amount`: How many presets to generate. Positive integer number.
* `--randomness`: Amount of randomness (in percentage) to apply, when randomizing existing presets or resulting merged presets. Value needs to be between 0 and 100.
* `--preset`: If given, an existing preset will be used as a based and randomized by `--randomness` ratio.
  * Use "?" to choose random preset
  * Use `?search string?` to choose a random preset containing "search string" in its path and file name.
* `--merge`: Can be provided multiple times, for each preset that should be part of the merging. Ratio between merged presets is random and NOT driven by the `--randomness` parameter.
  * Use `?` to choose random preset
  * Use `?search string?` to choose a random preset containing "search string" in its path and file name.
  * Use `*` to select all presets (careful! Better first reduce via `--pattern`.)
  * Use `*search string*` to select all presets containing "search string" in its path and file name.
* `--pattern`: Define a [glob pattern](https://code.visualstudio.com/docs/editor/glob-patterns), which presets should be loaded. 
  * By default, it's `**/*` which will load all presets from all sub-folders.
  * To select a subfolder, use e.g. `My Folder/**/*`
  * To select presets starting with something, use e.g. `**/PD *`
- `--folder`: narrow down presets by folder. Use `/Local/` or `/User/` as starting point.
- `--category`: narrow down presets by preset category (metadata)
- `--author`: narrow down presets by preset author (metadata)
- `--favorites`: narrow down presets by selection fia `.uhe-fav` file. The files must be located somewhere within your preset library.
- `--stable`: Uses more stable randomization approach
  * For fully random presets, it will randomize not per parameter, but per section (e.g. the entire OSC1 together)
  * Only parameters with numeric non-binary assignments will be further randomized. Otherwise they stay consistent with the chosen base preset or a random starter preset.
- `--binary`: Keep the binary part of the u-he presets. They will not be changed, but randomly generated presets will now include the binary section of either a random preset or the base preset that is randomized.
  * This contains advanced settings like MSEG curves, but this tool cannot really parse or modify it. Not every binary section seems to be compatible with other parameter adjustment, leading to invalid presets.
  * ⚠ Using binary mode may lead to broken presets that may crash your synth plugin when loading. Use with care. For some synths this works better (Repro, Diva, Zebralette 3) and for some it frequently leads to invalid presets.
* `--dictionary`: Creates random names from a dictionary of names used in the preset library
* `--custom-folder`: In case the installation folder is custom, it can be given here
  * E.g. `--custom-folder "C:/Audio/Plugin Installationen/u-he/"`
* `--debug`: Enables some optional debug logging and file exporting

## Soundsets

| Cover    | Links   | Description |
| -------- | ------- | ----------- |
| <img src="https://github.com/Fannon/u-he-preset-randomizer/assets/470980/afcf03b9-f2c1-4f60-bfae-f341c4fdb24c" alt="Diva Generated Vol. 1" width="256"/>  | [Diva Generated Vol. 1](https://github.com/Fannon/u-he-preset-randomizer/releases/download/v1.0.0/Diva.Generated.Vol.1.zip) (ZIP), [Audio Demo](https://www.youtube.com/watch?v=ouicLqilF9M) | 50 randomly generated presets for [u-he Diva](https://u-he.com/products/diva/), curated, modified and tagged by [Simon Heimler](https://github.com/Fannon) in 2024. |
| <img src="./soundsets/Repro-1 Generated Vol. 1/Repro-1 Generated Vol. 1.png" alt="Repro-1 Generated Vol. 1" width="256"/>  | [Repro-1 Generated Vol. 1](https://github.com/Fannon/u-he-preset-randomizer/releases/download/v1.0.9/Repro-1.Generated.Vol.1.zip) (ZIP), | 28 randomly generated presets for [u-he Repro](https://u-he.com/products/repro/), curated, modified and tagged by [Simon Heimler](https://github.com/Fannon) in 2024. |

## Developer Guide

To run this tool locally in developer mode, check out the repo and:

```sh
npm i
npm run build
npm run start -- --synth Diva --amount 3

# or run with node.js (remember npm run build!)
node dist/cli.js

# or use tsx if you wan't to avoid running npm run build (install via npm i -g tsx):
tsx src/cli.ts --synth Diva --amount 3
```

I've also exposed the u-he preset parser / serializer functions in the NPM module, so they could be used programmatically by other projects. However, you might inherit more dependencies than necessary if you're just interested in the parser. See [./src/parser.ts](./src/parser.ts).

## Help / Feedback

Please use the [related KVR Thread](https://www.kvraudio.com/forum/viewtopic.php?p=8898478) or create a [GitHub issue](https://github.com/Fannon/u-he-preset-randomizer/issues).
