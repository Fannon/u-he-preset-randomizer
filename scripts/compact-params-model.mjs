import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const sourcePath = resolve('tmp/paramsModel.json');
const targetPath = resolve('tmp/paramsModel.compact.json');

const stripDistinctValues = (node) => {
  if (Array.isArray(node)) {
    for (const item of node) {
      stripDistinctValues(item);
    }
    return;
  }

  if (node !== null && typeof node === 'object') {
    if ('distinctValues' in node && Array.isArray(node.distinctValues)) {
      // Keep distinct values if there are few of them
      if (node.distinctValues.length > 20) {
        delete node.distinctValues;
      }
    }

    for (const value of Object.values(node)) {
      stripDistinctValues(value);
    }
  }
};

const main = async () => {
  let raw;

  try {
    raw = await readFile(sourcePath, 'utf8');
  } catch (error) {
    console.error(`Failed to read ${sourcePath}:`, error);
    process.exit(1);
  }

  let data;

  try {
    data = JSON.parse(raw);
  } catch (error) {
    console.error(`Failed to parse JSON from ${sourcePath}:`, error);
    process.exit(1);
  }

  stripDistinctValues(data);

  try {
    await writeFile(targetPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  } catch (error) {
    console.error(`Failed to write ${targetPath}:`, error);
    process.exit(1);
  }

  console.log(`Wrote compact params model to ${targetPath}`);
};

main();
