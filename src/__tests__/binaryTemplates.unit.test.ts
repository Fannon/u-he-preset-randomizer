import { describe, expect, test } from 'bun:test';
import {
  getBinaryTemplates,
  pickWeightedTemplate,
  getTemplateBinary,
} from '../utils/binaryTemplates.js';

describe('Binary Templates', () => {
  test('should load templates from Zebralette3', () => {
    const templates = getBinaryTemplates('Zebralette3');
    expect(templates.length).toBeGreaterThan(0);

    // Verify a specific known template
    const template = templates.find((t) => t.path.includes('15-Basic Shapes.h2p'));
    expect(template).toBeDefined();
    expect(template?.weight).toBe(15);
  });

  test('should return empty array for unknown synth', () => {
    const templates = getBinaryTemplates('UnknownSynth');
    expect(templates).toEqual([]);
  });

  test('should pick a weighted template', () => {
    const templates = [
      { path: 'A', weight: 10 },
      { path: 'B', weight: 10 }
    ];

    // Run multiple times to ensure we can pick both
    const pickedKeys = new Set();
    for(let i=0; i<50; i++) {
        const picked = pickWeightedTemplate(templates);
        if(picked) pickedKeys.add(picked.path);
    }

    expect(pickedKeys.has('A')).toBe(true);
    expect(pickedKeys.has('B')).toBe(true);
  });

  test('should handle single item selection', () => {
      const templates = [{ path: 'Only', weight: 1 }];
      expect(pickWeightedTemplate(templates)?.path).toBe('Only');
  });

  test('should be able to read binary from valid template', () => {
     const templates = getBinaryTemplates('Zebralette3');
     const validTemplate = templates[0];
     if (!validTemplate) throw new Error('No templates found');

     const binary = getTemplateBinary(validTemplate.path);
     expect(typeof binary).toBe('string');
     expect(binary?.length).toBeGreaterThan(0);
  });
});
