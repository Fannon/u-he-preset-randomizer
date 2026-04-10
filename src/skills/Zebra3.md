# Zebra 3 Preset Engineering Guide

This guide is for analyzing, generating, and editing u-he Zebra 3 presets in `.h2p` format.

**Priority warning:** In Zebra 3, the sound is usually defined first by the oscillator engine, then by its direct modulation, then by oscillator FX / filters, and only then by global effects. Do not treat Zebra 3 like a subtractive synth with "oscillator -> filter -> FX" only. The oscillator source, renderer, curve position, and modulation architecture carry much more of the identity.

## 1. What Makes Zebra 3 Special

The Zebra 3 user guide describes Zebra 3 as a "wireless modular synthesizer". In practice, that means:

- Audio modules are arranged on a 4-lane grid.
- Modulators do not live in the grid; they appear when used.
- Almost every visible control can be modulated.
- Some parameters support **direct modulation inside the module**, which the manual states is calculated at higher resolution than matrix routing.

For preset work, that gives Zebra 3 three important layers:

1. **Core tone generation**
   Oscillators, FMOs, noise, exciters, combs, modal resonators.
2. **Per-module movement**
   Direct modulation on pitch, curve morph, filter cutoff, FM amount, etc.
3. **Global patch logic**
   Mod matrix, MSEGs, Mappers, Math modules, lane mixer, FX grid.

If a patch sounds "alive", the cause is usually in layer 2 or 3, not just in static parameter values.

## 2. Preset File Structure

Zebra 3 presets are plain text `.h2p` files with a strict block structure.

### 2.1 Metadata block

The file starts with a `/*@Meta ... */` comment block. Common fields:

- `Bank`
- `Author`
- `Description`
- `Usage`
- `Categories`
- `Features`
- `Character`

These are useful for intent. Read `Usage` first when present: it often tells you which matrix routes matter musically.

### 2.2 Header block

Typical Zebra 3 headers from the factory presets:

```text
#AM=Zebra3
#Vers=1
#Endian=little
#nm=42
#ms=...
#nv=9
#mv=...
```

Meaning:

- `#AM=Zebra3`: synth identifier
- `#Vers=1`: preset format version
- `#Endian=little`: encoding hint
- `#nm=42`: number of modulation sources defined in the `#ms` list
- `#ms=...`: modulation source index table
- `#nv` / `#mv`: additional visible modulation-source declarations used by the UI

### 2.3 Module blocks

The real patch content is stored in repeated `#cm=...` blocks:

```text
#cm=Osc1
Pitch=0.00
Pos=50.00
PosSrc=18
PosDpt=32.00
...
```

Important characteristics:

- The file is parsed linearly.
- A block continues until the next `#cm=` line.
- Parameter names must remain exact.
- Matrix destinations are string-encoded, e.g. `Dest1=Filter1:Cut`.

### 2.4 Binary / encoded tail

Like other modern u-he synths, Zebra 3 presets may end with encoded curve/layout data.

- Preserve it.
- Do not rewrite or "clean up" encoded tail content manually.
- If the task is only to change parameters, edit the plain-text block values and leave the encoded section untouched.

## 3. Modulation Source Index Map

The example Zebra 3 presets in `tmp/Zebra 3/*.h2p.txt` use this source list:

```text
0 none, 1 ModWhl, 2 PitchW, 3 CtrlA, 4 CtrlB, 5 CtrlC, 6 CtrlD, 7 KeyFollow
8 Gate, 9 Trigger, 10 Velocity, 11 Release, 12 Hold Pedal, 13 Pressure
14 Constant, 15 Random, 16 Alternate, 17 ModNoise, 18 LFO 1, 19 LFO 2, 20 LFO 3, 21 LFO 4
22 MSEG 1, 23 MSEG 2, 24 MSEG 3, 25 MSEG 4, 26 Envelope 1, 27 Envelope 2, 28 Envelope 3, 29 Envelope 4
30 ModMath 1, 31 ModMath 2, 32 ModMath 3, 33 ModMath 4, 34 Mapper 1, 35 Mapper 2, 36 Mapper 3, 37 Mapper 4
38 Pitch 1, 39 Pitch 2, 40 Pitch 3, 41 Pitch 4
```

Interpretation shortcuts:

- `14 Constant`, `15 Random`, `16 Alternate`, `17 ModNoise` are common "movement without performance" sources.
- `18-29` are the main internal animation sources.
- `38-41` are special pitch-domain sources and often matter more than plain `KeyFollow`.

## 4. The Heart Of Zebra 3: Oscillator Engine First

The Zebra 3 manual explicitly emphasizes its unique oscillators. That is the right center of gravity for analysis.

### 4.1 Why the oscillator matters most

In Zebra 3, the oscillator is not "just a waveform source". It includes:

- two interpretation modes: `Curve Geometry` vs `Curve Spectrum`
- two rendering modes: `Wavetable` vs `Additive Synth`
- direct high-resolution motion via curve morph / position
- built-in oscillator FX that often behave like spectral filters, warpers, animators, or pseudo-filters

That means a Zebra 3 patch can get brighter, harsher, more vocal, more metallic, or more animated **before** it ever hits a filter.

### 4.2 Parameter hierarchy for fast analysis

When reading a Zebra 3 patch, inspect these in order:

1. `Osc1/Source`, `Osc1/Render`
2. `Osc1/Pos`, `Osc1/PosSrc`, `Osc1/PosDpt`
3. `Osc1/Voices`, `Osc1/Detune`, `Osc1/Width`
4. `Osc1FX1/FX`, `Osc1FX1/Value`, `Osc1FX1/Depth`
5. `Osc1FX2/FX`, `Osc1FX2/Value`, `Osc1FX2/Depth`
6. `Filter1/*` and `Filter2/*`
7. `Env1/*`, `Env2/*`
8. `MM1-MM32`
9. `GridAmp`, `GridMix`, `MainMix`
10. `Delay1`, `ModFX1`, `Dist1`, `Comp1`

### 4.3 How to read common oscillator combinations

- `Source=Curve Geometry` + `Render=Wavetable`
  Read this as classic Zebra wavetable behavior. Expect movement from `Pos`, unison spread, and oscillator FX.

- `Source=Curve Spectrum` + `Render=Additive`
  Read this as a spectral/additive patch. Expect brighter, more metallic, or more inharmonic results, especially when `SpecDis`, `SpecNos`, or oscillator FX are active.

- High `PosDpt` or matrix modulation to `Osc1:Pos`
  This usually means the timbre is intentionally animated, not static.

- `Voices > 1` with nonzero `Width`
  The patch likely relies on spread and motion more than raw waveform complexity.

- Heavy oscillator FX with moderate filter settings
  The timbre may be primarily shaped pre-filter.

## 5. Data-Driven Norms From `tmp/paramsModel.compact.json`

Use the model file to distinguish "normal" from "deliberately extreme".

### 5.1 Oscillator norms

- `Osc1/Pitch`: usually centered, with common octave drops. avg `-2.86`, min `-48`, max `48`.
- `Osc1/Pos`: middle of the timeline is common. avg `46.40`.
- `Osc1/PosDpt`: motion is common, but not always huge. avg `22.20`, range `-100..100`.
- `Osc1/Vol`: moderate output, not maxed. avg `46.72`.
- `Osc1/Voices`: unison is common. avg `8.50`, range `1..16`.
- `Osc1/Detune`: usually subtle, sometimes extreme. avg `3.24`.
- `Osc1/Width`: moderate stereo spread is normal. avg `55.25`.
- `Osc1/SpecDis`: spectral distortion is used a lot. avg `45.86`.
- `Osc1/SpecNos`: spectral noise is also common. avg `42.93`.
- `Osc1/Source`: the corpus is split between geometry and spectrum modes. avg `0.50`.
- `Osc1/Render`: the corpus is split between wavetable and additive renderers. avg `0.50`.

Practical reading:

- Zebra 3 factory-style sounds do **not** keep everything static.
- Midpoint settings are common because the sound is often defined by modulation depth, not by an extreme static knob position.
- Unison is common enough that "1 voice only" is a stylistic choice, not the default assumption.

### 5.2 Oscillator FX norms

- `Osc1FX1/Value`: avg `44.40`. FX are usually used in moderate territory.
- `Osc1FX1/Depth`: avg `5.75`. Static shaping is more common than wild modulation.
- `Osc1FX2/Value`: avg `42.75`. The second FX is also active but rarely maxed.
- `Osc1FX2/Depth`: avg `7.32`. Movement is present, but often controlled.

The manual states that oscillator FX cover spectral, warping, windowing, and animation effects. Treat them as a major sound-design stage, not an afterthought.

### 5.3 Filter norms

- `Filter1/Cut`: mid-to-open cutoff is common. avg `72.33`, range `0..150`.
- `Filter1/Res`: clearly audible resonance is normal. avg `41.45`.
- `Filter1/Drv`: drive is used heavily. avg `47.88`.
- `Filter1/FM1`: the first cutoff modulation path is important. avg `25.38`.
- `Filter1/FM2`: the second cutoff modulation path is usually lighter. avg `12.24`.
- `Filter1/KeyScl`: partial key follow is normal. avg `44.44`.

Interpretation:

- In Zebra 3, cutoff alone is not enough. Read cutoff together with `FM1/FS1` and `FM2/FS2`.
- Moderate-to-high drive is common, so "clean filter only" is not the default character.

### 5.4 Envelope and LFO norms

- `Env1/Attack`: avg `34.95`. The factory corpus leans slower than a pure synth-brass baseline.
- `Env1/Decay`: avg `55.91`. Decay is often meaningful, not minimal.
- `Env1/Sustain`: avg `47.02`. Mixed corpus: many plucks and many sustaining sounds.
- `Env1/Release`: avg `48.37`. Release is usually audible.
- `Env1/Vel`: avg `52.88`. Velocity response is strong and common.
- `LFO1/Rate`: avg `-0.19`. LFO motion is generally slow to medium.
- `LFO1/DlyTime`: avg `26.42`. Delayed or faded starts are common.
- `LFO1/Amp`: avg `41.01`. Moderate depth is typical.

Practical reading:

- Zebra 3 presets often use envelopes for shape and expressiveness, not just for "gate open/close".
- Slow or delayed modulation is common in pads and evolving presets.

### 5.5 Physical-modeling module norms

- `Comb1/Damp`: avg `47.75`. Mid damping is common.
- `Comb1/FB`: avg `22.44`. Feedback is used, but not usually extreme.
- `Comb1/Dry`: avg `44.26`. Blending dry signal is normal.
- `Comb1/Dist`: avg `37.08`. Dirty comb tones are common.
- `Modal1/Blend`: avg `50.03`. Dual-profile blending is often centered.
- `Modal1/Decay`: avg `53.27`. Ring is substantial.
- `Modal1/HPF`: avg `41.99`. Low-end cleanup is common.
- `Modal1/Positn`: avg `41.38`. Strike position is usually off-center but not extreme.

Physical modeling in Zebra 3 is not niche. Factory patches use it enough that Comb and Modal blocks should be read as first-class tone shapers.

## 6. Manual-Grounded Module Notes

### 6.1 Oscillator (`#cm=Osc1`, `Osc2`, ...)

The manual distinguishes:

- `Curve Geometry`: time-domain waveform design
- `Curve Spectrum`: frequency-domain harmonic design
- `Wavetable`: classic frame-scanning playback
- `Additive Synth`: up to 1024 sine partials

Important file parameters:

- `Source`: Geometry vs Spectrum. Major identity switch.
- `Render`: Wavetable vs Additive. Major identity switch.
- `Pitch`: coarse tuning, often octave-based.
- `Pos`: curve morph / timeline position, one of the most important motion targets.
- `PosSrc` / `PosDpt`: direct modulation of `Pos`. Prefer for high-resolution timbral animation.
- `Voices`: unison count, only meaningful in wavetable mode.
- `Detune`: fine or unison spread. Tightens or widens character.
- `Width`: stereo width, most useful with unison.
- `SpecDis`: spectral distortion. Great for metallic, clustered, bell-like tones.
- `SpecNos`: spectral noise. Adds instability, breath, and grit.
- `Vol`: output level. Keep headroom for later drive and filter stages.

Key insight from the manual:

- Direct modulation of oscillator position operates at higher resolution than modulation matrix routing.

That means:

- For smooth wavetable motion, prefer `PosSrc` + `PosDpt`.
- Use the matrix when you need extra logic such as `Via`, quantize, rectify, or sample-and-hold.

### 6.2 Oscillator FX (`#cm=Osc1FX1`, `Osc1FX2`, ...)

The manual groups oscillator FX into:

- Spectral effects
- Warping effects
- Windowing effects
- Animation effects

Useful file parameters:

- `FX`: effect type selector. Defines the whole role of the slot.
- `Value`: main effect amount, usually the first thing to tweak.
- `Source` / `Depth`: direct modulation of effect amount. Good for movement without burning matrix slots.
- `Morph`: secondary shape-dependent behavior, often changes the character more than raw amount.
- `Center`: center or bias for many effect types. Important for asymmetry.
- `Trigger`: trigger behavior for animated FX. Useful for rhythmic restarts.

Manual-grounded tips:

- Zebra 3's oscillator FX are often more efficient than adding extra downstream modules for equivalent brightness or animation.
- The manual warns that using morphed curves inside oscillator FX can raise CPU noticeably.

### 6.3 Filter (`#cm=Filter1` - `Filter6`)

The manual describes Zebra 3 filters as pitch-aware and semitone-based rather than Hz-first.

Core file parameters:

- `Mode`: filter model or slope selector. Read this before interpreting cutoff.
- `Cut`: cutoff, semitone-oriented rather than purely Hz-based.
- `Res`: resonance, often central to character.
- `Drv`: drive, a strong tone shaper in Zebra 3.
- `FM1` / `FS1`: first cutoff modulation pair. Appears to be the main cutoff modulation depth/source pair.
- `FM2` / `FS2`: second cutoff modulation pair. Appears to be the secondary cutoff modulation depth/source pair.
- `KeySrc` / `KeyScl`: pitch source and key follow. Important for musical tracking.

The manual's filter palette includes clean and colored models such as:

- `Linear`
- `Vanilla`
- `SVF`
- `Ladder`
- `Cascade`
- `Impossible C`
- `Excite`
- `Mid Drive`
- `Old Drive`
- `Yellow`
- `Allpass`
- `Phaser`

Interpretation patterns:

- Low `Cut` + positive `FM1` from an envelope usually means subtractive sweep / pluck logic.
- High `Drv` + mid `Res` often matters more than small cutoff changes.
- `Allpass` and `Phaser` should not be read as "ordinary filters"; they are motion/color processors.
- `Yellow` is explicitly warned as unique and potentially very loud.

### 6.4 Envelopes (`#cm=Env1` - `Env4`)

The manual describes Zebra 3 envelopes as ADSR with extras, including:

- classic `Gate` mode
- `One Shot`
- external retriggering via modulation sources
- two "variation" controls

Relevant file parameters:

- `Attack`, `Decay`, `Sustain`, `Release`: ADSR stages, the main articulation shape.
- `Vel`: velocity response, frequently important in the corpus.
- `TrigMd`: trigger mode. Changes basic behavior more than small time tweaks.
- `TrigSrc`: trigger source. Can make the envelope rhythmic or event-driven.
- `Var1Typ`, `Var1Dpt`: unipolar variation. Covers Delay, Hold, Init, Stack, Overshoot style roles.
- `Var2Typ`, `Var2Dpt`: bipolar variation. Covers Gain, Key Scale, Feedback, Stretch style roles.

Useful manual hints:

- For fastest possible onset, the manual recommends using `Init`-style behavior rather than only shrinking attack.
- Envelopes can be retriggered by non-keyboard sources, which is unusual and musically powerful.

### 6.5 MSEG, LFO, Mapper, Math

These are where Zebra 3 becomes distinctly "programmable".

#### MSEG (`#cm=MSEG1` - `MSEG4`)

The manual describes MSEGs as up to 8 morphable curves with loops. Use them for:

- rhythmic modulation
- custom envelope shapes
- envelope/LFO hybrids

Key file parameters:

- `TimeBse`
- `Trigger`
- `Attack`
- `Loop`
- `Release`
- `RelMode`
- `CMorph`
- `MrphSrc`
- `MrphDpt`

Best use:

- rhythmic filter animation
- wavetable travel that is more intentional than an LFO
- evolving pads with separate attack/loop/release behavior

#### LFO (`#cm=LFO1` - `LFO4`)

The manual highlights:

- `Free`, `Sync`, `Reset`, `Single`, `Random` trigger styles
- absolute and tempo-synced time bases
- `Symmetry`, `Slew`, delayed fade-ins, and "Spice" behaviors

Key file parameters:

- `Timebse`
- `Trig`
- `Wave`
- `Symtry`
- `Polar`
- `Rate`
- `DlyType`
- `DlyTime`
- `Amp`
- `AmpSrc`
- `AmpDpt`

Best use:

- slow position drift on pads
- square/random stepping with matrix slew or quantize
- delayed vibrato or tremolo for expressive leads

#### Mapper (`#cm=MMap1` - `MMap4`)

The manual positions Mappers as 128-value lookup tables for:

- note-based remapping
- stepped modulation
- round-robin style variation
- sequenced pitch logic

Stats hint:

- `MMap1/Mode` avg `1.50`
- `MMap1/Stps` avg `62.00`

Use Mappers when motion should feel intentional and repeatable rather than smooth.

#### Math (`#cm=MMath1` - `MMath4`)

The manual shows Math blocks doing things like:

- multiply
- crossfade
- slew
- sample hold
- highpass
- delay
- LFO generation
- trigger chance

This is the right place to combine controllers into musically meaningful logic before they hit the matrix.

### 6.6 FMO, Noise, Exciter, Comb, Modal

#### FMO (`#cm=FMO1` - `FMO4`)

The manual describes Zebra 3's FMO as DX-style FM, actually linear phase modulation, with richer routing than older FM synths.

Key file parameters:

- `Pitch`: coarse tune, the main pitch anchor.
- `Ratio`: carrier/modulator relation. Integer-ish ratios give classic FM structure.
- `FM`: FM index, the main brightness and complexity amount.
- `FMSrc`, `FMDpt`: modulation of FM amount. Good for dynamic timbre.
- `FB`, `FBSrc`, `FBDpt`: feedback amount and movement. Great for bite, grit, and growl.
- `Ext`, `ExtSrc`, `ExtDpt`: external modulation or input blend. Useful for hybrid FM behavior.
- `Vol`: carrier or output volume. Controls final contribution.

Stats highlight:

- `FMO1/FM` avg `30.01`
- `FMO1/FB` avg `32.79`
- `FMO1/Ext` avg `38.38`

So factory-style FM is often moderate and blended, not pure maximum-index chaos.

#### Noise (`#cm=Noise1`, `Noise2`)

The manual explicitly says the noise module can act like a pitched or percussive source, not just a constant hiss bed. It can also replace an Exciter in some patches.

#### Exciter (`#cm=Excitr1`, `Excitr2`)

Treat this as a transient generator for plucks, hits, and physical-model excitation. It is especially useful when feeding Comb or Modal modules.

#### Comb (`#cm=Comb1` - `Comb4`)

The manual gives Zebra 3's Comb several modes, including simple, complex, dissonant, blown, and reverb-like behaviors.

Key file parameters:

- `Mode`
- `Damp`
- `FB`
- `Tune`
- `Detn`
- `Dry`
- `Vol`
- `Dist`
- `Tone`
- `Flavour`
- `Partial`
- `PTilt`
- `Ratio`
- `Diffuse`

Best use:

- plucks and strings
- hollow resonances
- blown / brass / flute-like overtones
- metallic feedback textures

#### Modal Resonator (`#cm=Modal1`, ...)

The manual warns that the modal resonator can get very loud. Believe that warning.

Key file parameters:

- `Blend`
- `Density`
- `Tune`
- `Detune`
- `HPF`
- `Positn`
- `Decay`
- `Key2D`
- `Normal`
- `Absorpt`
- `Dispers`
- `Volume`

Best use:

- bells, mallets, struck objects
- wooden or metallic body resonance
- physically plausible decay behavior
- adding "object" identity to otherwise synthetic excitation

## 7. Sound Design Recipes

These are practical Zebra 3 strategies, not just abstract descriptions.

### 7.1 Wide wavetable pad

- Start with `Curve Geometry` + `Wavetable`.
- Use `Voices` 4-8 and `Width` around the corpus norm or slightly above it.
- Keep `Pos` in the middle third and modulate it slowly with `PosSrc` / `PosDpt`.
- Use slow `Env1` attack and release.
- Add either `Filter1` motion or oscillator FX movement, not both at full intensity.
- Send into `Delay1` / `ModFX1` / reverb-like FX bus routing for space.

### 7.2 Modern lead

- Use mono or legato behavior in `Logic1`.
- Keep oscillator settings focused, not overly wide.
- Prefer direct pitch vibrato or dedicated performance routes through the matrix.
- Use one strong identity shaper: oscillator FX, filter drive, or FM - not all at once.
- Map `Pressure` or `ModWhl` to a single expressive target such as vibrato depth, cutoff, or FX amount.

### 7.3 Bell, tine, or glass hit

- Prefer `Curve Spectrum` + `Additive`, or use `FMO1`.
- Use moderate-to-high `SpecDis`, clusters, or FM ratio relationships.
- Keep `Sustain` low and let decay carry the sound.
- Use `Modal1` or `Comb1` for body resonance.
- Avoid too much low-end; modal and comb tones can get muddy quickly.

### 7.4 Physical pluck

- Feed `Exciter` or `Noise` into `Comb1`.
- Keep `Damp` around the middle, then bias from there.
- Use short envelopes and moderate feedback.
- Blend some `Dry` back in if the comb loses too much attack.
- Negative comb feedback is a deliberate special effect, not a default safe value.

### 7.5 Rhythmic or sequenced patch

- Use `MSEG` loops or `Mapper` increment/quantize logic.
- Use matrix `Quantize`, `Rectify`, `SH`, and `Slew` deliberately.
- Animate one or two important targets: `Osc1:Pos`, `Filter1:Cut`, `GridAmp:Vol1`, etc.
- Keep the rhythm source simple. Complex motion gets messy quickly if several looped modulators fight each other.

## 8. Editing Rules For LLMs

When modifying Zebra 3 presets, follow these rules:

1. Read `Usage` and the active matrix slots before changing sound-shaping parameters.
2. Inspect oscillator architecture before touching filters or effects.
3. Prefer direct modulation fields for oscillator position, pitch, filter cutoff, and other high-resolution targets.
4. Use matrix slots when you need `Via`, `Quantize`, `Rectify`, `SH`, or `Slew`.
5. Preserve exact module names, parameter IDs, and destination strings.
6. Do not edit encoded tail data unless the task is specifically about rebuilding curve/layout data.
7. Be conservative with `Yellow`, modal resonance, comb feedback, and aggressive distortion: the manual explicitly warns these can get loud fast.

## 9. Fast Analysis Workflow

When analyzing a new Zebra 3 preset, use this order:

1. Metadata and `Usage`
2. Grid architecture: which generators/processors are active
3. `Osc1` / `Osc2` source, renderer, position, and direct modulation
4. Oscillator FX
5. `Filter1` / `Filter2`
6. `Env1`, `Env2`, `LFO1`, `MSEG1`, `Mapper1`, `MMath1`
7. Matrix slots actually assigned
8. `GridAmp`, `GridMix`, `MainMix`
9. Delay / modulation FX / distortion / compression

If you need to decide what matters most in one sentence:

**In Zebra 3, first identify how the oscillator is being interpreted and animated, then read how the patch routes that motion through oscillator FX, filters, and the matrix.**
