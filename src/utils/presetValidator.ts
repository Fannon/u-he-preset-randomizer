/**
 * Preset Validation Utilities
 *
 * Provides utilities for validating u-he preset files (.h2p format).
 * Useful for tests and general preset validation.
 */

import path from 'node:path';
import fs from 'fs-extra';
import { isValidPreset, parseUhePreset } from '../parser.js';

/**
 * Validates that a preset file exists and is readable
 */
export function validatePresetFileExists(filePath: string): boolean {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

/**
 * Validates that a preset file has the correct extension
 */
export function validatePresetExtension(filePath: string): boolean {
  return path.extname(filePath).toLowerCase() === '.h2p';
}

/**
 * Validates that a preset file has content
 */
export function validatePresetHasContent(filePath: string): boolean {
  if (!validatePresetFileExists(filePath)) {
    return false;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.length > 0;
}

/**
 * Validates that a preset can be parsed and is valid
 */
export function validatePresetParsable(
  filePath: string,
  binary = false,
): boolean {
  if (!validatePresetHasContent(filePath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const presetName = path.basename(filePath, '.h2p');
    const preset = parseUhePreset(content, presetName, binary);
    return isValidPreset(preset);
  } catch (error) {
    return false;
  }
}

/**
 * Comprehensive preset validation
 *
 * Validates that:
 * - File exists and is readable
 * - File has .h2p extension
 * - File has content
 * - File can be parsed successfully
 * - Preset passes validation checks
 */
export function validatePreset(filePath: string, binary = false): boolean {
  return (
    validatePresetFileExists(filePath) &&
    validatePresetExtension(filePath) &&
    validatePresetHasContent(filePath) &&
    validatePresetParsable(filePath, binary)
  );
}

/**
 * Validates multiple preset files
 *
 * @returns Object with validation results
 */
export function validatePresets(
  filePaths: string[],
  binary = false,
): {
  valid: string[];
  invalid: string[];
  total: number;
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const filePath of filePaths) {
    if (validatePreset(filePath, binary)) {
      valid.push(filePath);
    } else {
      invalid.push(filePath);
    }
  }

  return {
    valid,
    invalid,
    total: filePaths.length,
  };
}

/**
 * Finds all .h2p preset files in a directory (recursive)
 */
export function findPresetFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findPresetFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.h2p')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Gets the newest preset files by modification time
 */
export function getNewestPresetFiles(dir: string, count: number): string[] {
  const files = findPresetFiles(dir);

  const filesWithMtime = files
    .map((filePath) => ({
      path: filePath,
      mtime: fs.statSync(filePath).mtime.getTime(),
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return filesWithMtime.slice(0, count).map((f) => f.path);
}
