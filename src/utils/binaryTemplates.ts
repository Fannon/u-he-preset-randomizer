import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import { getPresetBinarySection } from '../parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TemplateFile {
  path: string;
  weight: number;
}

/**
 * Loads available binary templates for a given synth.
 * Templates are expected to be in src/templates/{synthName}/*.h2p
 * Filenames should be prefixed with a weight, e.g. "15-Basic Shapes.h2p"
 */
export function getBinaryTemplates(synthName: string): TemplateFile[] {
  // Navigate up from src/utils/ to src/templates/
  const templatesDir = path.resolve(__dirname, '../templates', synthName);

  if (!fs.pathExistsSync(templatesDir)) {
    return [];
  }

  const files = fs.readdirSync(templatesDir);
  const templates: TemplateFile[] = [];

  for (const file of files) {
    if (!file.endsWith('.h2p')) continue;

    const match = file.match(/^(\d+)-/);
    const weight = match ? parseInt(match[1] ?? '1', 10) : 1; // Default to 1 if no prefix

    templates.push({
      path: path.join(templatesDir, file),
      weight,
    });
  }

  return templates;
}

/**
 * Picks a template based on weighted probability.
 */
export function pickWeightedTemplate(
  templates: TemplateFile[],
): TemplateFile | undefined {
  if (templates.length === 0) return undefined;

  const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0);
  let random = Math.random() * totalWeight;

  for (const template of templates) {
    random -= template.weight;
    if (random <= 0) {
      return template;
    }
  }

  return templates[templates.length - 1];
}

/**
 * Reads the template file and extracts its binary section.
 */
export function getTemplateBinary(templatePath: string): string | undefined {
  try {
    const content = fs.readFileSync(templatePath, 'utf-8');
    return getPresetBinarySection(content);
  } catch (error) {
    console.error(`Failed to read binary template: ${templatePath}`, error);
    return undefined;
  }
}
