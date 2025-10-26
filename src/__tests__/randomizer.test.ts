import { calculateRandomMergeRatios } from '../randomizer.js';

describe('randomizer', () => {
  describe('calculateRandomMergeRatios', () => {
    it('should generate ratios that always sum to exactly 1.0', () => {
      // Test multiple times to ensure mathematical invariant holds
      for (let presetCount = 1; presetCount <= 10; presetCount++) {
        for (let iteration = 0; iteration < 10; iteration++) {
          const ratios = calculateRandomMergeRatios(presetCount);

          expect(ratios).toHaveLength(presetCount);

          const sum = ratios.reduce((acc, val) => acc + val, 0);
          expect(sum).toBeCloseTo(1.0, 10);

          // All ratios should be positive and <= 1
          ratios.forEach((ratio) => {
            expect(ratio).toBeGreaterThan(0);
            expect(ratio).toBeLessThanOrEqual(1);
          });
        }
      }
    });

    it('should never produce zero or negative ratios', () => {
      for (let i = 0; i < 20; i++) {
        const ratios = calculateRandomMergeRatios(5);
        ratios.forEach((ratio) => {
          expect(ratio).toBeGreaterThan(0);
        });
      }
    });
  });
});
