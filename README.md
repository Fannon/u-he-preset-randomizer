# u-he-preset-randomizer

Create random [u-he](https://u-he.com/) synth presets through randomization and merging of your existing presets.

This is only a MVP, with limited functionality:
* Generate fully random presets based on real values in your preset library

Future features could be:
* Explicitly pick which existing presets to use for randomization and define amount of randomness applied to them
* Merge explicitly chosen presets between each other
* Refine method of randomization:
  * "Clustered randomization", which keeps consistency within a module
  * "Stable mode", which doesn't introduce randomization into some parameters, which tend to produce unstable results, e.g. pitch. Which params those are, depends on synth.

## How to use

This is a CLI application that you need to run in your terminal / command line.

If you have a recent [Node.js](https://nodejs.org/en) runtime installed, running the following command will download the latest `u-he-preset-randomizer` CLI and execute it:

```bash
# This command will run the randomizer to generate 3 random Diva presets
npx u-he-preset-randomizer --synth Diva --amount 3
```

The generated patches will be put into your preset directory, under a `/RANDOM` folder.

![CLI Screenshot](./assets/cli-screenshot.png)

### CLI Arguments

* `--synth`: Choose the u-he synth. Not all synths have been tested, but the randomizer tries to be generic.
* `--amount`: How many presets to generate
* `--debug`: Enables some optional debug logging and file exporting

## Developer Guide

To run this locally, check out the repo and:

```sh
npm i
npm run build
npm run start -- --synth Diva --amount 3

# or use ts-node:
ts-node src/cli.ts --synth Diva --amount 3
```

I've also exposed the u-he preset parser / serializer functions in the NPM module, so they could be used programmatically by other projects. However, you might inherit more dependencies than necessary if you're just interested in the parser. See [./src/parser.ts](./src/parser.ts).

## Help / Feedback

Please create a [GitHub issue](https://github.com/Fannon/u-he-preset-randomizer/issues).
