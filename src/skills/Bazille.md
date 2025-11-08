# u-he Bazille Synthesizer & `.h2p` Preset Format - Context Guide

## 1. Introduction to Bazille

Bazille is a powerful modular synthesizer created by u-he. Its core concept revolves around a hybrid digital and analog approach. While the filters are modeled on traditional analog hardware, the oscillators are unapologetically digital, combining **Phase Distortion (PD)** and **Phase Modulation (FM)** synthesis, technologies popularized in the 1980s. A unique **Fractal Resonance** feature adds another layer of digital sound-shaping capabilities.

Being modular, Bazille allows users to freely connect different components (modules) using virtual patch cables. The signal path is not fixed, offering immense flexibility. A typical patch might involve oscillators generating a sound that is then shaped by filters, modulated by LFOs and envelopes, and finally sent to the output. However, any output can be patched into almost any input, allowing for complex audio-rate modulation, feedback loops, and unconventional sound design.

## 2. The `.h2p` Preset File Structure

A Bazille preset is stored in a plain text `.h2p` file. It contains three main sections: Metadata, Header/Index definitions, and Parameter Blocks.

### 2.1. Metadata Block

This is a human-readable comment block at the beginning of the file, enclosed in `/*@Meta ... */`. It contains descriptive tags for Bazille's preset browser.

*   **`Bank`**: The sound bank or library the preset belongs to.
*   **`Author`**: The creator of the preset.
*   **`Description`**: A brief description of the sound.
*   **`Usage`**: Performance notes, e.g., how ModWheel (MW) or Aftertouch (AT) affect the sound.
*   **`Categories`**: Describes the preset by instrument type or usage (e.g., `Bass:Plucks`, `Pads:Evolving`).
*   **`Features`**: Technical classifications (e.g., `Mono`, `Poly`, `BPM`, `Glide`).
*   **`Character`**: Pairs of opposite tags describing the sound's timbre (e.g., `Bright`, `Dark`, `Clean`, `Dirty`).

### 2.2. Header & Index Definitions

These lines define the file format and create indexed lists for modulation and signal sources.

*   **`#AM=Bazille`**: Identifies the synthesizer.
*   **`#Vers=...`**: The version of the preset format.
*   **`#nm=31`**: Number of modulation sources defined.
*   **`#ms=...`**: Defines the **Modulation Source Index**. Each `#ms` line corresponds to an index, starting from 0. Modulation source parameters in the preset (e.g., `RMSrc`, `LMSrc`) use these index numbers.

#### Modulation Source Index Table (`#ms`)

| Index | Source Name  | Description                                                              |
| :---- | :----------- | :----------------------------------------------------------------------- |
| 0     | `none`       | No modulation source.                                                    |
| 1     | `ModWhl`     | MIDI Modulation Wheel (CC#01).                                           |
| 2     | `PitchW`     | MIDI Pitch Wheel.                                                        |
| 3     | `CtrlA`      | User-definable MIDI Control A.                                           |
| 4     | `CtrlB`      | User-definable MIDI Control B.                                           |
| 5     | `Gate`       | Note On/Off signal.                                                      |
| 6     | `Velocity`   | Note On velocity.                                                        |
| 7     | `Pressure`   | Aftertouch (Channel or Polyphonic).                                      |
| 8     | `KeyFollow`  | MIDI Note number, relative to a pivot point (KeyF 1).                    |
| 9     | `KeyFollow2` | Second Key Follow source, can have a different glide rate (KeyF 2).      |
| 10    | `Alternate`  | Toggles between +5V and -5V on each new note.                            |
| 11    | `Random`     | A single random value for each played voice.                             |
| 12    | `StackVoice` | Value derived from the voice number in a unison stack.                   |
| 13    | `Env1`       | Output of Envelope 1.                                                    |
| 14    | `Env2`       | Output of Envelope 2.                                                    |
| 15    | `Env3`       | Output of Envelope 3.                                                    |
| 16    | `Env4`       | Output of Envelope 4.                                                    |
| 17    | `LFO1 Tri`   | Triangle/Saw waveform output from LFO1.                                  |
| 18    | `LFO1 Sqr`   | Square/Pulse waveform output from LFO1.                                  |
| 19    | `LFO1 Rnd`   | Random (Sample & Hold) waveform output from LFO1.                        |
| 20    | `LFO1 Sine`  | Internal Sine wave from LFO1 (no output socket, must be selected here).  |
| 21    | `LFO2 Tri`   | Triangle/Saw waveform output from LFO2.                                  |
| 22    | `LFO2 Sqr`   | Square/Pulse waveform output from LFO2.                                  |
| 23    | `LFO2 Rnd`   | Random (Sample & Hold) waveform output from LFO2.                        |
| 24    | `LFO2 Sine`  | Internal Sine wave from LFO2.                                            |
| 25    | `Ramp1`      | Output of Ramp Generator 1.                                              |
| 26    | `Ramp2`      | Output of Ramp Generator 2.                                              |
| 27    | `MMap1`      | Output of Mapping Generator 1.                                           |
| 28    | `MMap2`      | Output of Mapping Generator 2.                                           |
| 29    | `CV1`        | External Control Voltage Input 1.                                        |
| 30    | `CV2`        | External Control Voltage Input 2.                                        |

---

### 2.3. Module / Signal Source Index

Bazille's modules are assigned a unique index number via the `Label=` parameter within their block. This allows outputs of one module to be patched as signal inputs to another (e.g., `In1A`, `InRM`, `FMSrc`).

#### Signal Source Index Table (`Label=`)

| Index | Source Module              | Output Description                                      |
| :---- | :------------------------- | :------------------------------------------------------ |
| 2     | `Multi1`                   | Output of Multiplex 1                                   |
| 3     | `Multi2`                   | Output of Multiplex 2                                   |
| 4     | `VCA1`                     | Output of VCA 1 (Output 1)                              |
| 5     | `VCA2`                     | Output of VCA 2 (Output 2)                              |
| 6     | `Seq1`                     | Output from Sequencer (Tap 1)                           |
| 7     | `ENV1`                     | Output of Envelope 1                                    |
| 8     | `ENV2`                     | Output of Envelope 2                                    |
| 9     | `ENV3`                     | Output of Envelope 3                                    |
| 10    | `ENV4`                     | Output of Envelope 4                                    |
| ...   | ...                        | *This is not a fixed list; the mapping is defined per-preset* |
| 15    | `Osc1`                     | Main output of Oscillator 1                             |
| 16    | `Osc2`                     | Main output of Oscillator 2                             |
| ...   | ...                        | Other outputs (e.g., Filter types) also have unique IDs. |
| 44    | `Filt1` -> LP24            | Filter 1, 24dB Lowpass output                           |
| 48    | `Out1B` (VCA1 input)       | Sum of signals at VCA 1's inputs                        |
| 66    | `MIDI & More` -> White Noise | White Noise generator output                            |

*Note: The specific mapping can vary. Refer to the `Label=` parameter in each module block of a given preset to understand its signal connections.*

---

## 3. Parameter Blocks (`#cm=...`)

Each `#cm=` block corresponds to a module or section of the synthesizer.

### `#cm=VCC` (Voice Control)

Global voice and tuning parameters.

*   `Voices`: (0-15) Maximum number of voices to play. `0` = 1 voice.
*   `Voicing`: (0=Poly, 1=Mono, 2=Legato, 5=Duo) Voice allocation mode.
*   `Mode`: Seems to duplicate `Voicing`. `0`=Poly, `1`=Mono/Legato.
*   `Porta`: (0-100) Glide (Portamento) Amount/Time.
*   `Porta2`: (-100 to 100) Glide Amount offset for even-numbered oscillators/filters.
*   `PortaM`: (0=Time, 1=Rate) Glide mode.
*   `PB`, `PBD`: (0-48) Pitch Bend range Up and Down in semitones.
*   `Drft`: (0 or 1) Activates (`1`) slight random detuning for all voices.
*   `Trsp`: (-24 to 24) Global pitch transpose in semitones.
*   `FTun`: (-100 to 100) Global fine tune in cents.
*   `Vc1`-`Vc8`: (-24 to 24) Pitch offset for each of the 8 possible unison stack voices, in semitones.

### `#cm=Osc1` - `#cm=Osc4` (Oscillators)

Four identical digital oscillators, the primary sound source.

*   **Pitch Section**
    *   `TMode`: (0-4) Selects the mode for the `Tune` knob. `0`=Semitone, `1`=Overtone, `2`=Undertone, `3`=Hertz, `4`=Clocked.
    *   `Tune`: (0-24) Main pitch/frequency value, interpreted by `TMode`.
    *   `FineTy`: (0-3) Selects the mode for the `Fine` (Modify) knob. `0`=Cents, `1`=5 Hz, `2`=Beats, `3`=Multiply.
    *   `Fine`: (-50 to 50) Fine-tuning/frequency modification value, interpreted by `FineTy`.
    *   `FMSrc`, `FMDpt`: Pitch modulation amount (unlabeled knob) and source selector.
*   **Phase / FM Section**
    *   `Reset`: (0-2) Waveform phase reset mode. `0`=Catch (free-running), `1`=Gate (resets on note-on), `2`=Random.
    *   `Phase`: (0-100) Manual phase offset.
    *   `PMSrc`: (Signal Source Index) Input for Phase/Frequency Modulation.
    *   `PMDpt`: (-100 to 100) Amount of modulation from `PMSrc`.
    *   `PMRes`: (0-6) Phase/FM modulation type. `0`=PM fine, `1`=PM medium, `2`=PM coarse, `3`=lin 100Hz, `4`=lin 1kHz, `5`=rel fine, `6`=rel coarse.
*   **Phase Distortion (PD) Section**
    *   `PDWv1`, `PDWv2`: (0-7) Wave selectors for the two alternating phase functions (Saw, Square, Impulse, 2pulse, Halfsaw, Res1, Res2, Res3). `0`=Saw.
    *   `PDVal`: (0-100) Amount of Phase Distortion.
    *   `PDSrc`: (Signal Source Index) Modulation input for PD amount.
    *   `PDDpt`: (-100 to 100) Modulation depth for PD.
*   **Fractal Resonance Section**
    *   `FType`: (0-3) Selects the 'window' shape for fractal resonance. `0`=Off, `1`=Saw, `2`=Tri, `3`=Max.
    *   `FVal`: (0-100) Amount of fractal resonance (cycles packed into the window).
    *   `FSrc`: (Signal Source Index) Modulation input for `FVal`.
    *   `FDpt`: (-100 to 100) Modulation depth for fractal resonance.
*   **Output Section**
    *   `Vol`: (0-100) Nominal level of the modulated signal output.
    *   `VMSc`: (Modulation Source Index) Source for amplitude modulation.
    *   `VMDpt`: (-100 to 100) Depth of amplitude modulation.

#### Oscillator Analysis Notes

*   **Coarse tuning is usually conservative.** In the sampled library (`tmp/paramsModel.json`), `Osc1/Tune` averages ≈4.3 semitones with the dataset dominated by octave steps (0, 12, 24). Treat large offsets or non-semitone values as intentional special cases; they often indicate layered transpositions or clocked modes.
*   **Fine detune centers on zero.** `Osc1/Fine` averages effectively 0, but excursions reach ±50. Any big deviation signals deliberate beating or audio-rate modulation—double-check `FineTy` to understand the scale.
*   **Phase distortion is a primary tone control.** `Osc1/PDVal` averages ≈42 with `PDDpt` around 13, so most presets lean on PD for overtone shaping. Large modulation depths usually come from low-index sources (`PDSrc` avg ≈8), i.e., envelopes, velocity, or KeyFollow.
*   **FM depth swings widely.** Although `Osc1/PMDpt` averages ≈12, it spans the full ±100 range. With `PMRes` averaging just over 2 (coarser PM tables), expect audible timbre shifts whenever `PMSrc` ≠ `0`. Watch the sign of `PMDpt` to understand whether the filter is being driven brighter or darker over time.
*   **Fractal resonance is rare.** `FType` averages under 1 and `FVal` ≈0.3, so most patches leave it off. Any non-zero fractal settings deserve extra scrutiny—they often explain metallic or noisy content.
*   **Mixer levels reveal importance.** `Osc1/Vol` averages ≈48 (with similar values on other oscillators), while `VMSc`/`VMDpt` sit near 12. If an oscillator sounds missing, confirm the volume isn’t near zero and that amplitude modulation isn’t muting it.

### `#cm=Filt1` - `#cm=Filt4` (Filters)

Four analog-modeled resonant filters.

*   `Cutoff`: (0-150) Filter cutoff frequency in semitones.
*   `FMSrc1`/`FMSrc2`: (Signal Source Index) Inputs for cutoff modulation.
*   `FMDpt1`/`FMDpt2`: (-150 to 150) Modulation amounts for cutoff.
*   `KeyFol`: (0-100) Amount of keyboard tracking for the cutoff.
*   `Res`: (0-100) Filter resonance amount.
*   `ResSrc`: (Signal Source Index) Input for resonance modulation.
*   `ResDpt`: (-100 to 100) Modulation amount for resonance.
*   `FMSrc`/`FBSrc`: (Signal Source Index) These are the two audio inputs for the filter. `FBSrc` is Input 2, `FMSrc` is Input 1.

#### Filter Analysis Notes

*   **Cutoff ranges drive the timbre.** In the sampled library (`tmp/paramsModel.json`), `Filt1/Cutoff` averages around 72 (mid range) while `Filt3`/`Filt4` sit wide open (≈138–144). Treat high static cutoffs as “always open” and look for negative `FMDpt` values that sweep them down; low cutoffs paired with large positive `FMDpt` values are almost always envelope-driven sweeps.
*   **Modulation depth matters more than the static value.** `FMDpt1` on `Filt1` averages ≈31 with frequent excursions up to ±150. Large depths indicate that the audible cutoff position is defined by `FMSrc1/2`, not the base knob. Track the sign: positive depths push the cutoff higher when the source rises; negative depths invert the motion.
*   **Key tracking is usually partial.** `KeyFol` averages ≈27, so most patches only follow the keyboard partially. A `KeyFol` near 0 with low cutoff will sound muted on higher notes unless modulation opens it; values >60 imply near-full tracking and more consistent brightness.
*   **Resonance is dynamic.** The static `Res` value for `Filt1` averages ≈21, but `ResDpt` swings across the full ±100 range. High `ResDpt` with a low base `Res` signals that an envelope or LFO is responsible for peaks or squelches—inspect `ResSrc` to understand when resonance spikes.
*   **Audio routing clarifies polarity.** `FMSrc`/`FBSrc` tell you which oscillator or utility feeds each filter input. When a filter sounds inactive, confirm it still receives audio; `FMSrc=0` means nothing is patched into Input 1.
*   **DC blocking hints at coloration.** `DCBlk` toggled to `1` (≈23% of the time) removes low-end bias after heavy resonance. If a preset feels thin despite high cutoff, check for `DCBlk=1`.
*   **Secondary filters stay brighter.** `Filt2/Cutoff` averages ≈26 with `Res` ≈12, while `Filt3` and `Filt4` average cutoffs above 137 but resonances below 4. Use this split to reason about serial vs. parallel routing: Filt1 often shapes the main tone, and downstream filters add subtle coloration unless their modulation depths are extreme.

### `#cm=ENV1` - `#cm=ENV4` (Envelopes)

Four identical ADSR envelope generators.

*   `Atk`, `Dec`, `Rel`: (0-100) Attack, Decay, and Release times.
*   `Sus`: (0-100) Sustain level.
*   `FR`: (-100 to 100) Fall/Rise. Causes the sustain stage to fall (negative values) or rise (positive values).
*   `Vel`: (0-100) Scales the envelope's overall level by note velocity.
*   `LMod`, `LMSrc`: Amp Mod amount and source, modulates the envelope's output level.
*   `RMod`, `RMSrc`: Rate Mod amount and source, modulates the speed of all envelope stages.
*   `Snappy`: (0 or 1) If `1`, makes Decay and Release more exponential.
*   `Trig`: (0-5) Trigger source. `0`=Gate, `1`=Loop, `2`=LFO1, `3`=LFO2, `4`=ModSeq1, `5`=ModSeq2.

#### Envelope Analysis Notes

*   **ENV1 is brisk but sustained.** In the sampled data (`tmp/paramsModel.json`), `ENV1/Atk` averages ≈11, `Dec` ≈48, `Sus` ≈63, and `Rel` ≈30. Expect a quick attack with a noticeable sustain tail—perfect for filter sweeps or the main VCA. When those numbers drop near zero, the preset is intentionally percussive.
*   **Velocity sensitivity is moderate.** `ENV1/Vel` averages ≈24, while `ENV3`/`ENV4` fall closer to 10 and 5. Strong velocity response therefore usually targets ENV1; if brightness or loudness ignores touch, confirm `Vel` is non-zero.
*   **Aux envelopes are snappier.** `ENV3/Atk` averages ≈6.5 with `Sus` ≈53, and `ENV2/Sus` averages ≈36. Designers typically repurpose these for modulation bursts—look for them driving oscillator FM or filter resonance.
*   **Rate modulation is rare.** `ENV1/RMod` and `ENV1/RMSrc` hover near zero/low indices, so any non-zero setting is a deliberate tempo-dependent tweak worth noting.
*   **Snappy mode is the exception.** With `ENV1/Snappy` averaging ≈0.13, most presets leave it off. If you need punchier transients, enabling it is an intentional design decision.

### `#cm=LFO1`, `#cm=LFO2` (Low-Frequency Oscillators)

Two dedicated LFOs for cyclic modulation.

*   `Rate`: (-5 to 5) LFO speed, interpreted by the `Sync` mode.
*   `Sync`: (Index) LFO rate mode. Selects between absolute times (seconds) and host-synced times (1/64 to 8/1, with dotted and triplet variations).
*   `Sym`: (0-100) `Wave` parameter. For triangle, morphs from falling saw to triangle to rising saw. For square, controls pulse width.
*   `Phse`: (0-100) The phase position where the LFO starts on a new note.
*   `FMS1`, `FMD1`: Rate Mod source and depth. Modulates the LFO speed.
*   `DMS1`, `DMD1`: Amp Mod source and depth. Modulates the LFO output level.
*   `Dly`: (0-100) Fades the LFO in from zero.

#### LFO Analysis Notes

*   **Rates skew slow.** In `tmp/paramsModel.json`, `LFO1/Rate` averages ≈0.49 (on the -5 to +5 scale), so most patches use gentle modulation. Values beyond ±3 usually indicate audio-rate or tremolo effects.
*   **Free-running dominates.** `LFO1/Sync` averages ≈1.2 with many negative entries, meaning unsynced or slow absolute times are the norm. When synced values (≥8) appear, expect tempo-locked movement.
*   **Wave shaping stays centered.** `LFO1/Sym` averages ≈49, so designers rarely bias the waveform strongly. Extreme symmetry settings are intentional (e.g., for pulse-width wobble).
*   **Depth modulation outweighs rate modulation.** `LFO1/DMD1` averages ≈28 while `FMD1` sits near 0.4. If you hear evolving amplitude changes, inspect `DMD1`/`DMS1` to understand the modulation source.
*   **Phase and delay are typically zeroed.** `Phse` and `Dly` both average around 3–4, meaning any large values were chosen for deliberate fade-ins or phase offsets.

### `#cm=Multi1` - `#cm=Multi4` (Multiplex)

Four flexible utility modules that can act as mixers, ring modulators, or AM processors.

*   `In1A`, `In1B`, `In2A`, `In2B`: (Signal Source Index) The four signal inputs.
*   `InRM`: (Signal Source Index) The modulation input (`Mod`).
*   `Gain12`: (-100 to 100) The left knob. Without a `Mod` input, it's a level control for inputs 1 & 2. With a `Mod` input, it crossfades between the dry sum of 1+2 and the Ring Modulated signal (Input 1 * Mod).
*   `Gain34`: (-100 to 100) The right knob. Similar to `Gain12` but for inputs 3 & 4. Crossfades between the dry sum of 3+4 and the Amplitude Modulated signal (Input 3 * (1 - Mod)).

#### Multiplex Analysis Notes

*   **Most patches use the Multi modules as mixers.** In `tmp/paramsModel.json`, `Gain12` and `Gain34` both average ≈90, well into the positive range. Values near 0 or negative stand out as deliberate ring/AM configurations.
*   **Mod inputs favor core controllers.** `InRM` averages ≈8 on the modulation index scale, pointing to frequent use of KeyFollow, envelopes, or velocity. If you need to trace complex AM, start with those low-index sources.
*   **Dry inputs matter.** Because `Gain` values sit high, the dry path dominates unless `InRM` is active. If a modulation effect seems missing, confirm the relevant `Gain` isn't pinned to 100 with an inactive mod source.

### `#cm=Seq1` (Modulation Sequencer)

A 16-step polyphonic sequencer with 8 snapshots.

*   `Time`: (0-2) Time Base for the sequencer speed (1/16, 1/1, 1s).
*   `Div`: (1-16) Divides the Time Base to accelerate the sequence.
*   `gate`: (0-2) Trigger mode. `0`=free, `1`=sync, `2`=gate.
*   `SnMo`: (-8 to 8) Rotate knob. If `SnMS` is 0, this sets the auto-rotation speed.
*   `SnMS`: (Modulation Source Index) Input for rotating the snapshot dial.
*   `SnMD`: (0-100) Modulation amount for rotation.
*   `Mul1`-`Mul4`: (1-16) Tap Speed Factors. Multiplies the step length for each of the 4 output taps.
*   `V1_1`...`V8_16`: (-100 to 100) The 16 slider values for each of the 8 snapshots. (V**S**_**N** where **S** is snapshot number and **N** is step number).

### `#cm=VCA1`, `#cm=VCA2` (Output VCAs)

The final stereo output stage.

*   `Vol`: (0-100) Channel volume.
*   `VCA`: (0-4) Selects the default envelope. `0`=Gate, `1`=Env1, `2`=Env2, `3`=Env3, `4`=Env4.
*   `PanSrc`: (Modulation Source Index) Source for pan modulation.
*   `PanDpt`: (-100 to 100) Pan position or modulation depth.

#### VCA Analysis Notes

*   **Output levels are moderately conservative.** In `tmp/paramsModel.json`, `VCA1/Vol` averages ≈41 and `VCA2/Vol` ≈34, so patches rely on filter drive or external gain for loudness. If a preset feels quiet, raising VCA volume is usually safe.
*   **ENV1 drives most amplitude.** `VCA1/VCA` averages just above 1, confirming Env1 as the default envelope. Any other value signals custom routings—important when diagnosing gate or pad behaviour.
*   **Pan modulation is uncommon.** `PanDpt` averages around -0.5 with `PanSrc` near index 5; significant stereo motion only happens when you see larger absolute depths or non-zero mod sources.
