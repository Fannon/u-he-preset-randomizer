# u-he-preset-randomizer

Create random [u-he](https://u-he.com/) synth presets through randomization and merging of your existing presets.

This is only a MVP, with limited functionality:
* Generate fully random presets based on real values in your preset library

Future features could be:
* Explicitly pick which existing presets to use for randomization and define amount of randomness applied to them
* Merge presets between each other
* Refine method of randomization:
  * "Clustered randomization", which keeps consistency within a module
  * "Stable mode", which doesn't introduce randomization into some parameters, which tend to produce unstable results, e.g. pitch. Which params those are, depends on synth.

## How to use

Prerequisite: [Node.js](https://nodejs.org/en) runtime (min. version 20)

This is a CLI application that you need to run in your terminal / command line.

```bash
npx u-he-preset-randomizer --synth Diva --amount 3
```

### CLI Arguments

* `--synth`: Choose the u-he synth. Not all synths have been tested, but the randomizer tries to be generic.
* `--amount`: How many presets to generate
* `--debug`: Enables some optional debug logging and file exporting

## Help / Feedback

Please create a [GitHub issue](https://github.com/Fannon/u-he-preset-randomizer/issues).
