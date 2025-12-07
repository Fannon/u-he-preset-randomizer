import {
  getSpecialParameterHandling,
  getSynthConfig,
  globalSpecialParameters,
} from '../synthConfigs/index.js';

describe('synthConfigs', () => {
  describe('globalSpecialParameters', () => {
    it('should contain VCC tuning rules that apply to synths with VCC section', () => {
      expect(globalSpecialParameters.length).toBeGreaterThan(0);

      // Check for VCC tuning rules
      const vccTrsp = globalSpecialParameters.find((r) => r.id === 'VCC/Trsp');
      expect(vccTrsp).toBeDefined();
      expect(vccTrsp?.keepStable).toBe('always');

      const vccFTun = globalSpecialParameters.find((r) => r.id === 'VCC/FTun');
      expect(vccFTun).toBeDefined();
      expect(vccFTun?.keepStable).toBe('always');
    });
  });

  describe('getSpecialParameterHandling', () => {
    it('should return only global rules when no synth specified', () => {
      const rules = getSpecialParameterHandling();

      expect(rules.length).toBe(globalSpecialParameters.length);

      // Should NOT contain Zebralette3-specific rules
      const o1geo1 = rules.find((r) => r.id.includes('O1Geo1'));
      expect(o1geo1).toBeUndefined();
    });

    it('should return global + Zebralette3 rules for Zebralette3', () => {
      const rules = getSpecialParameterHandling('Zebralette3');

      // Should have more rules than just global
      expect(rules.length).toBeGreaterThan(globalSpecialParameters.length);

      // Should contain Zebralette3-specific rules
      const o1geo1Curve = rules.find((r) => r.id.includes('O1Geo1/Curve'));
      expect(o1geo1Curve).toBeDefined();
      expect(o1geo1Curve?.keepStable).toBe('always');

      const m1geo1Guide = rules.find((r) => r.id.includes('M1Geo1/Guide'));
      expect(m1geo1Guide).toBeDefined();
      expect(m1geo1Guide?.keepStable).toBe('always');

      const mPreset = rules.find((r) => r.id.includes('MPreset/'));
      expect(mPreset).toBeDefined();
      expect(mPreset?.keepStable).toBe('always');
    });

    it('should return only global rules for synths without specific config', () => {
      const rules = getSpecialParameterHandling('Diva');

      // Should only have global rules
      expect(rules.length).toBe(globalSpecialParameters.length);

      // Should NOT contain Zebralette3-specific rules
      const o1geo1 = rules.find((r) => r.id.includes('O1Geo1'));
      expect(o1geo1).toBeUndefined();
    });
  });

  describe('getSynthConfig', () => {
    it('should return config for Zebralette3', () => {
      const config = getSynthConfig('Zebralette3');
      expect(config).toBeDefined();
      expect(config?.synthName).toBe('Zebralette3');
      expect(config?.specialParameters.length).toBeGreaterThan(0);
    });

    it('should return undefined for unknown synth', () => {
      // @ts-ignore - Testing invalid synth name
      const config = getSynthConfig('UnknownSynth');
      expect(config).toBeUndefined();
    });
  });
});
