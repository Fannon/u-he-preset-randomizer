import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function isDirectExecution(
  moduleUrl: string,
  executionArg = process.argv[1],
): boolean {
  if (!executionArg) {
    return false;
  }

  const modulePath = fileURLToPath(moduleUrl);

  try {
    return realpathSync(executionArg) === realpathSync(modulePath);
  } catch {
    return resolve(executionArg) === modulePath;
  }
}
