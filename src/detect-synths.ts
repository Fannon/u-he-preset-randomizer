#!/usr/bin/env node
import { detectPresetLibraryLocations } from './utils/detector.js';
import { getDefaultConfig } from './config.js';
import chalk from 'chalk';

/**
 * Simple script to detect installed u-he synthesizers
 */
function detectSynths() {
  console.log(chalk.cyan.bold('\n🔍 Detecting installed u-he synthesizers...\n'));

  const config = getDefaultConfig();
  const detected = detectPresetLibraryLocations(config);

  if (detected.length === 0) {
    console.log(chalk.yellow('❌ No u-he synthesizers found on this system.\n'));
    console.log(chalk.gray('Searched locations:'));
    if (process.platform === 'darwin') {
      console.log(chalk.gray('  - ~/Library/Audio/Presets/u-he/'));
    } else {
      console.log(chalk.gray('  - ~/Documents/u-he/'));
      console.log(chalk.gray('  - ~/.u-he/'));
      console.log(chalk.gray('  - C:/Program Files/Common Files/VST3/'));
      console.log(chalk.gray('  - C:/Program Files/VSTPlugins/'));
    }
    console.log();
    return;
  }

  console.log(chalk.green(`✅ Found ${detected.length} u-he synthesizer(s):\n`));

  // Group by synth name to avoid duplicates
  const uniqueSynths = new Map<string, typeof detected[0]>();
  detected.forEach(synth => {
    if (!uniqueSynths.has(synth.synthName)) {
      uniqueSynths.set(synth.synthName, synth);
    }
  });

  uniqueSynths.forEach((synth, name) => {
    console.log(chalk.bold(`  📀 ${name}`));
    console.log(chalk.gray(`     Root:         ${synth.root}`));
    console.log(chalk.gray(`     Presets:      ${synth.presets}`));
    console.log(chalk.gray(`     User Presets: ${synth.userPresets}`));
    console.log();
  });

  console.log(chalk.cyan(`💡 Tip: Use these synth names with the --synth flag\n`));
}

detectSynths();
