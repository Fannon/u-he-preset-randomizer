# Skill: Expert Zebralette 3 Sound Design & Preset Engineering

This comprehensive guide enables the analysis, creation, and modification of u-he Zebralette 3 presets (`.h2p` files). It synthesizes technical specifications from the user manual, statistical data from existing presets, and advanced sound design principles.

---

## 1. File Structure & Syntax (`.h2p`)

[cite_start]Zebralette 3 presets use a proprietary text-based format[cite: 146]. The file is read linearly, but parameters are grouped logically by module prefixes.

### A. Metadata Block
[cite_start]Located at the top of the file, enclosed in `/*@Meta ... */`[cite: 2134].
* [cite_start]**Fields**: `Bank`, `Author`, `Description`, `Usage`, `Categories`, `Features`, `Character`[cite: 148].
* [cite_start]**Best Practice**: Always include `Categories` to ensure the preset appears correctly in the browser's smart folders[cite: 1604].

### B. Global Headers
[cite_start]These define the plugin version and basic configuration[cite: 2134].
* `#AM=Zebralette3`: Identifies the plugin.
* `#Vers=1`: Preset format version.
* `#nm=...`: Number of modulation sources (usually 18 or 20).
* `#ms=...`: List of modulation sources available in the matrix (e.g., `ModWhl`, `LFO 1`).

### C. Parameter Lines
[cite_start]Format: `ModulePrefix/ParameterName=Value` (e.g., `OSC1/Pitch=0.00`)[cite: 2134].
* **Values**: Usually floating-point.
* **Prefixes**: `OSC1` (Oscillator), `LFO1`/`LFO2` (LFOs), `Env1` (Envelope), `MSEG1` (Multi-Segment Envelope), `MM1`-`MM6` (Modulation Matrix), `Delay`, `Reverb`.

### D. Curve Data
[cite_start]At the end of the file, you will find compressed binary data strings (e.g., `$$$$282420...`)[cite: 2134].
* [cite_start]**Function**: These store the vector graphics for the Oscillator curves, MSEG shapes, and LFO user shapes[cite: 36, 37].
* **Guidance**: Do not attempt to manually edit these strings. To "create" a waveform via text, focus on modulating the `OSC1/Pos` (position) or modifying the `OSC1/Source` type, rather than generating raw binary curve data.

---

## 2. Module Analysis & Parameter Logic

### A. The Oscillator (`OSC1`)
[cite_start]Zebralette 3 is a single-oscillator synth that uses "Curve Sets"[cite: 66].

* [cite_start]**`Source`**: Defines how the curve is interpreted[cite: 180].
    * `0` (**Curve Geometry**): Wavetable synthesis. [cite_start]The curve is the waveform itself[cite: 182].
    * `1` (**Curve Spectrum**): Additive synthesis. [cite_start]The curve represents the amplitude of harmonics (1-1024)[cite: 182].
* **`Render`**:
    * `0` (**Wavetable**): Classic rendering. [cite_start]Supports `Unison` (up to 16 voices) for "supersaw" effects[cite: 186, 188].
    * `1` (**Additive**): Sum of sine waves. [cite_start]Supports `Spectral Distortion` for inharmonic sounds[cite: 186, 211].
* **Key Parameters**:
    * `Pos` (Position): Scans through the wavetable index (0-100). [cite_start]*Crucial for motion.* [cite: 323, 324]
    * [cite_start]`Pitch`: Coarse tuning (+/- 48 semitones)[cite: 207].
    * [cite_start]`Detune`: Unison detuning amount (only active if `Unison` > 1 or `Render=Additive`)[cite: 209].
    * `SpecDis` (Spectral Distortion): Stretches or compresses harmonics. [cite_start]High values create metallic/bell tones[cite: 211].
    * [cite_start]`SpecNos` (Spectral Noise): Adds chaotic spectral jitter, useful for "breath" or "bowing" textures[cite: 219].

### B. Oscillator Effects (`Osc1FX1` / `Osc1FX2`)
[cite_start]Since Zebralette 3 lacks a standard VCF (Voltage Controlled Filter), these slots perform filtering and spectral manipulation[cite: 66, 347].

* [cite_start]**Common Types (`FX` integer)**[cite: 391, 392, 404, 405, 409]:
    * `3` (**Curve Filter**): Acts as a flexible filter. [cite_start]The "Curve" defines the frequency response[cite: 416].
    * [cite_start]`17` (**Spectral Focus**): Enhances specific harmonics (Odd, Even, Octaves)[cite: 432].
    * [cite_start]`10` (**Distortion**): Waveshaping options like `Wrap`, `Fold`, `Clip` (listed as Warping Effects)[cite: 472].
* **Control**:
    * [cite_start]`Value`: The main control (e.g., Cutoff Frequency)[cite: 367].
    * [cite_start]`Depth`: Amount of effect applied[cite: 367].
    * [cite_start]`Source`: Can use `Guides` or the `Curve Set` itself to shape the effect[cite: 371].

### C. Modulation Sources (`LFO` / `Env` / `MSEG`)
* [cite_start]**`Env1` (ADSR)**: The main amp/filter envelope[cite: 823].
    * **Guidance**: `Attack` < 1.0 for percussive sounds; `Attack` > 20.0 for pads. [cite_start]`Sustain` = 100 for organs/leads, 0 for plucks[cite: 827, 828].
* [cite_start]**`MSEG1`**: A complex, draw-able envelope/LFO[cite: 863].
    * [cite_start]**Usage**: Can act as a rhythmic looper (`Loop` points enabled) or a custom attack curve[cite: 877].
* **`LFO1` / `LFO2`**:
    * [cite_start]**Waveforms**: Sine, Triangle, Saw, Square, Random Hold/Glide[cite: 832, 833].
    * [cite_start]**Sync**: `Sync` ensures the LFO stays in time with the host tempo (e.g., `1/8`, `1/4`)[cite: 845].

### D. The Matrix (`MM1` - `MM6`)
[cite_start]This connects sources to targets[cite: 1139].
* [cite_start]**Structure**: `Source` -> `Via` (optional scaler) -> `Depth` -> `Target`[cite: 1142].
* [cite_start]**Example**: `Source=LFO1`, `Target=OSC1:Pitch`, `Depth=10` creates vibrato[cite: 856].
* [cite_start]**Slot Modifiers**[cite: 1177]:
    * [cite_start]`Rectify`: Forces values to be positive (unipolar)[cite: 1185].
    * [cite_start]`Quantize`: Steps the modulation (useful for musical intervals)[cite: 1197].
    * [cite_start]`Slew`: Smooths out jagged modulation[cite: 1207].

---

## 3. Sound Design Strategy & Guidance

### General Principles
1.  **Movement**: A static oscillator sounds dull. [cite_start]Always route `LFO1` or `Env1` to `OSC1/Pos` (Wavetable Position) or `Osc1FX1/Value` (Filter Cutoff)[cite: 1720, 2028].
2.  **Volume Management**: The `OSC1/Vol` parameter often defaults to `~42`. [cite_start]If using heavy distortion or high resonance (`Curve Filter`), reduce this to avoid digital clipping[cite: 216].
3.  **Spectral Character**: Use `SpecDis` (Spectral Distortion) cautiously. [cite_start]Small amounts add "bite"; large amounts create non-musical, metallic dissonance[cite: 211, 262].

### Category-Specific Recipes

#### **Bass**
* [cite_start]**Oscillator**: `Source=0` (Wavetable), `Pitch=-12` or `-24`[cite: 207].
* [cite_start]**Envelope**: `Attack=0` (Instant), `Decay=30-50`, `Sustain=0-30`[cite: 828].
* **Filter**: Use `Osc1FX1=3` (Curve Filter). [cite_start]Modulate `Osc1FX1/Value` with `Env1` (Depth ~50)[cite: 416].
* [cite_start]**Voicing**: Set `VCC/Mode=2` (Mono) to prevent muddy low-end[cite: 822].

#### **Pad**
* [cite_start]**Oscillator**: `Source=0`, `Unison=2` or `4`, `Detune=15-25`[cite: 188, 209].
* [cite_start]**Envelope**: `Attack=30+` (Slow fade-in), `Release=40+`[cite: 828].
* [cite_start]**Effects**: `Reverb` active (`Mix=30+`, `Size=100`)[cite: 1046, 1061].
* [cite_start]**Modulation**: Route a slow `LFO` to `OSC1/Pos` or `OSC1/SpecMrf` for evolving textures[cite: 236, 1720].

#### **Lead**
* [cite_start]**Oscillator**: `Pitch=0` or `12`[cite: 207]. [cite_start]`Unison` can be used for "supersaw" leads[cite: 188].
* [cite_start]**Envelope**: `Sustain=100`[cite: 828].
* [cite_start]**Expression**: Map `ModWheel` to `LFO1/Depth`, and route `LFO1` to `OSC1/Pitch` (Vibrato)[cite: 856, 1141].
* [cite_start]**FX**: Use `Delay` (`Mode=1` Ping-Pong) for space[cite: 1004].

#### **Pluck**
* **Envelope**: `Decay=20-40`, `Sustain=0`. [cite_start]This is the definition of a pluck[cite: 828].
* **Filter**: Essential. `Osc1FX1=3`. [cite_start]Modulate `Value` heavily with `Env1` to create the "thwack" transient[cite: 416].
* [cite_start]**Spectral**: `SpecDecay` effect works well here to simulate natural string damping[cite: 517].

---

## 4. Statistical "Norms" (from `paramsModel.json`)

Use these ranges to validate if a generated value is "normal" or "extreme".

| Parameter | Common Range | Extreme/Rare | Notes |
| :--- | :--- | :--- | :--- |
| `VCC/Voices` | 1 (Mono), 5-6 (Poly) | 16 | [cite_start]High polyphony eats CPU[cite: 189]. |
| `Env1/Attack` | 0 - 10 | > 80 | [cite_start]Most sounds need fast attacks[cite: 828]. |
| `OSC1/Vol` | 30 - 60 | > 90 | [cite_start]High volume risks clipping[cite: 216]. |
| `Reverb/Mix` | 20 - 50 | 100 | [cite_start]100 is wet-only (rare)[cite: 1072]. |
| `LFO/Rate` | -2 to +2 | > 4 | [cite_start]Values are logarithmic[cite: 837]. |
| `MM/Depth` | -50 to +50 | +/- 100 | [cite_start]Max depth is very strong[cite: 1214]. |

---

## 5. Workflow for LLM Assistance

When helping the user, follow this decision tree:

1.  **Analyze Request**: Is it a modification ("make it brighter") or a creation ("make a bass")?
2.  **Select Parameters**:
    * [cite_start]*Brighter* -> Increase `Osc1FX/Value`, add `SpecDis`, or increase `High Shelf` in EQ (if available/simulated)[cite: 211, 418].
    * [cite_start]*Softer* -> Increase `Env1/Attack`, lower `Osc1FX/Value`[cite: 828].
    * [cite_start]*Wider* -> Increase `OSC1/Width`, `Delay/Width`, or `Unison`[cite: 217, 1024].
3.  **Apply Statistical Check**: Is the proposed value within common ranges? (e.g., don't set Volume to 100 unless requested).
4.  [cite_start]**Output Format**: Present the changes clearly, referencing the module and parameter name exactly as they appear in the `.h2p` file[cite: 2134].
