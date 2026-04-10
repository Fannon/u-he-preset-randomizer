import { afterEach, describe, expect, it } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDirectExecution } from '../utils/entrypoint.js';

const tempDirs: string[] = [];

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

describe('isDirectExecution', () => {
  it('matches the real module path when invoked through a symlink', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'entrypoint-test-'));
    tempDirs.push(tempDir);

    const modulePath = path.join(tempDir, 'cli.js');
    const symlinkPath = path.join(tempDir, 'u-he-preset-randomizer');

    fs.writeFileSync(modulePath, '#!/usr/bin/env node\n');
    fs.symlinkSync(modulePath, symlinkPath);

    expect(isDirectExecution(pathToFileURL(modulePath).href, symlinkPath)).toBe(
      true,
    );
  });

  it('returns false for unrelated execution targets', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'entrypoint-test-'));
    tempDirs.push(tempDir);

    const modulePath = path.join(tempDir, 'cli.js');
    const otherPath = path.join(tempDir, 'other.js');

    fs.writeFileSync(modulePath, '#!/usr/bin/env node\n');
    fs.writeFileSync(otherPath, '#!/usr/bin/env node\n');

    expect(isDirectExecution(pathToFileURL(modulePath).href, otherPath)).toBe(
      false,
    );
  });
});
