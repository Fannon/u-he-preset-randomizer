import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const sourcePath = resolve('tmp/paramsModel.json');
const compactPath = resolve('tmp/paramsModel.compact.json');
const compactMinPath = resolve('tmp/paramsModel.compact.min.json');

const compactNode = (node, { maxDistinctValues, maxFrequencies }) => {
  if (Array.isArray(node)) {
    for (const item of node) {
      compactNode(item, { maxDistinctValues, maxFrequencies });
    }
    return;
  }

  if (node !== null && typeof node === 'object') {
    if ('values' in node && Array.isArray(node.values)) {
      delete node.values;
    }

    if ('distinctValues' in node && Array.isArray(node.distinctValues)) {
      // Keep distinct values if there are few of them
      if (node.distinctValues.length > maxDistinctValues) {
        delete node.distinctValues;
      }
    }

    if ('frequencies' in node && node.frequencies !== null) {
      const frequencyKeys = Object.keys(node.frequencies);
      if (frequencyKeys.length <= 1 || frequencyKeys.length > maxFrequencies) {
        delete node.frequencies;
      }
    }

    for (const value of Object.values(node)) {
      compactNode(value, { maxDistinctValues, maxFrequencies });
    }
  }
};

const writeCompactedModel = async (
  data,
  targetPath,
  { maxDistinctValues, maxFrequencies, label },
) => {
  const compacted = JSON.parse(JSON.stringify(data));
  compactNode(compacted, { maxDistinctValues, maxFrequencies });

  try {
    await writeFile(
      targetPath,
      `${JSON.stringify(compacted, null, 2)}\n`,
      'utf8',
    );
  } catch (error) {
    console.error(`Failed to write ${targetPath}:`, error);
    process.exit(1);
  }

  console.log(`Wrote ${label} params model to ${targetPath}`);
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

  await writeCompactedModel(data, compactPath, {
    maxDistinctValues: 20,
    maxFrequencies: Number.POSITIVE_INFINITY,
    label: 'compact',
  });
  await writeCompactedModel(data, compactMinPath, {
    maxDistinctValues: 20,
    maxFrequencies: 20,
    label: 'compact min',
  });
};

main();
