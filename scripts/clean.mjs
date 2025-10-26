import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const targets = ['dist', '.tsbuildinfo'];

for (const target of targets) {
  const absolutePath = resolve(target);

  try {
    rmSync(absolutePath, { recursive: true, force: true, maxRetries: 1 });
  } catch (error) {
    console.error(`Failed to remove ${target}:`, error);
    process.exitCode = 1;
  }
}
