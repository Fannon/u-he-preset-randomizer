#!/usr/bin/env node

import { constants } from 'node:fs';
import { access, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const packageJsonPath = resolve(rootDir, 'package.json');

function formatJson(data) {
  return `${JSON.stringify(data, null, 2)}\n`;
}

async function main() {
  const candidateFiles = ['server.json', 'mcp-server.json'];
  let serverJsonFilename = null;
  for (const filename of candidateFiles) {
    const fullPath = resolve(rootDir, filename);
    try {
      await access(fullPath, constants.F_OK);
      serverJsonFilename = filename;
      break;
    } catch {
      // Try next candidate
    }
  }

  if (!serverJsonFilename) {
    throw new Error(
      `Could not find ${candidateFiles.join(' or ')} in project root.`,
    );
  }

  const serverJsonPath = resolve(rootDir, serverJsonFilename);

  const [packageRaw, mcpRaw] = await Promise.all([
    readFile(packageJsonPath, 'utf8'),
    readFile(serverJsonPath, 'utf8'),
  ]);

  const packageJson = JSON.parse(packageRaw);
  const mcpServer = JSON.parse(mcpRaw);

  const packageVersion = packageJson.version;

  if (!packageVersion) {
    throw new Error('package.json is missing a version field.');
  }

  let updated = false;

  if (mcpServer.version !== packageVersion) {
    mcpServer.version = packageVersion;
    updated = true;
  }

  if (Array.isArray(mcpServer.packages)) {
    for (const pkg of mcpServer.packages) {
      if (pkg && typeof pkg === 'object') {
        if (pkg.version && pkg.version !== packageVersion) {
          pkg.version = packageVersion;
          updated = true;
        }

        if (Array.isArray(pkg.runtimeArguments)) {
          for (const arg of pkg.runtimeArguments) {
            if (
              arg &&
              typeof arg === 'object' &&
              typeof arg.value === 'string'
            ) {
              const nextValue = arg.value.replace(
                /(u-he-preset-randomizer@)([0-9]+\.[0-9]+\.[0-9]+(-[\w.]+)?)/,
                (_, prefix) => `${prefix}${packageVersion}`,
              );

              if (nextValue !== arg.value) {
                arg.value = nextValue;
                updated = true;
              }
            }
          }
        }
      }
    }
  }

  if (updated) {
    await writeFile(serverJsonPath, formatJson(mcpServer), 'utf8');
    console.log(`Updated ${serverJsonFilename} to version ${packageVersion}.`);
  } else {
    console.log(`${serverJsonFilename} already matches package.json version.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
