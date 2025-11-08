# Understanding u-he Zebra 2 Presets (.h2p Format)

## 1. Introduction

This document provides a comprehensive guide for understanding the structure and parameters of preset files for the u-he Zebra 2 software synthesizer. Zebra 2 is a powerful semi-modular synthesizer known for its flexibility and sound quality. Its presets are stored in a human-readable text format with the extension `.h2p`.

This guide maps the parameters found in the `.h2p` files to their functions as described in the Zebra 2 user manual, enabling a Large Language Model to interpret, generate, and modify these presets effectively. Observed value ranges and averages mentioned below come from the aggregated statistics in `tmp/paramsModel.compact.json`, providing practical context for how factory and third-party presets typically deploy each control.

## 2. The .h2p Preset File Structure

A Zebra 2 `.h2p` file is organized into several distinct sections:

1.  **Meta Block (`/*@Meta ... */`)**: A multi-line comment at the beginning of the file containing descriptive metadata about the preset, such as the `Author`, `Description`, `Usage` instructions for performance controllers (like Modwheel `MW` or Aftertouch `AT`), and descriptive `Categories`.

2.  **Header Information**: Lines beginning with a `#` that define global settings and metadata for the synth engine.
    *   `#AM=ZebraHZ`: Identifies the file as a ZebraHZ (The Dark Zebra) preset.
    *   `#Vers=...`: The version of the software the preset was saved with.
    *   `#ms=...`: A list that defines the available **Modulation Sources** and maps them to an index number. This is crucial for understanding the modulation matrix.

3.  **Module Parameters (`#cm=...`)**: The core of the preset. Each section begins with `#cm=` followed by the module's name (e.g., `OSC1`, `VCF1`, `ENV1`). Subsequent lines define the parameters for that module and their values.

4.  **Modulation Matrix**: There are two types of modulation routing definitions:
    *   **XY Pad Matrix (`MT/ML/MR`)**: Defines the targets for the four XY pads. `MT` specifies the target, `ML` the value at the minimum position of the controller, and `MR` the value at the maximum position.
    *   **Main Modulation Matrix (`MMT/MMS/MMD`)**: Defines general-purpose modulation routings. `MMT` is the target, `MMS` is the source index (referencing the `#ms` list), and `MMD` is the modulation depth/amount.
    *   In practice, the majority of routings target filter cutoff or resonance. When you see `VCF#:Cut` or `VCF#:Res` listed in `MMT`, inspect the matching `MMS` index in `#ms` to identify whether velocity, envelopes, LFOs, or performance controls are driving the movement.

5.  **Compressed Binary Data (`$$$$...`)**: An encoded block of data at the end of the file. **This section must not be altered or interpreted**. It contains information about user-drawn waveforms and other complex data. When modifying a file, this block should be preserved exactly as it is.

## 3. Module & Parameter Mapping

The following sections detail the parameters for each major module as they appear in the `.h2p` file.

### 3.1. Global Settings

These settings control the overall behavior of the synth patch.

#### **Voice Circuit (`#cm=VCC`)**
| Parameter | Description | Value Range / Notes |
| :--- | :--- | :--- |
| `Voices` | Polyphony mode. `0`=Mono, `1`=Poly, `2`=Legato. | Integer. |
| `Porta` | Glide/Portamento time. | `0.00` (off) to `100.00`. |
| `Drft` | Voice Drift. Emulates analog pitch instability. | `0` (off) or `1` (on). |
| `Trsp` | Global transpose in semitones. | Integer, e.g., `-12`, `0`, `12`. |

#### **Arpeggiator / Sequencer (`#cm=VCC`)**
This module is complex. The core parameters are:
| Parameter | Description | Value Range / Notes |
| :--- | :--- | :--- |
| `Mode` | Voice mode. Set to `3` to enable the Arpeggiator. | See `VCC` above. |
| `ArSc` | Sync rate for the arpeggiator steps (e.g., 1/16, 1/8). | Index mapping to rhythmic values. |
| `ArLL` | Arpeggiator Length in steps. | `1` to `16`. |
| `ArOrd` | Order of note playback. | `0`=as played, `1`=by note. |
| `Agte1`-`16` | Gate time for each step. `4`=tie. | `0` to `4`. |
| `Atrp1`-`16` | Transposition for each step in semitones. | e.g., `-12`, `0`, `7`. |
| `AMDpt1`-`16`| Value for the `ArpMod` modulation source for each step. | `-100.00` to `100.00`. |

### 3.2. Generators

These are the primary sound sources.

#### **Oscillators (`#cm=OSC1` - `OSC4`)**
| Parameter | Description | Value Range / Notes |
| :--- | :--- | :--- |
| `Wave` | Waveform type (Saw, Square, Triangle, etc.). | Integer index. `0` is Saw. |
| `Tune` | Coarse pitch in semitones. | e.g., `-12.00`, `0.00`, `7.00`. |
| `Dtun` | Fine pitch detuning in cents. | `-50.00` to `50.00`. |
| `WNum` | Selects a wave from the loaded waveset (1-16). | `1.00` to `16.00`. |
| `Vol` | Oscillator volume. | `0.00` to `200.00`. |
| `Pan` | Stereo panning. | `-100.00` (L) to `100.00` (R). |
| `SFX1`/`SFX2` | Spectral Effect types applied to the waveform. | Index corresponding to effects like *Formant*, *Brilliance*. |
| `FX1Dt`/`FX2Dt`| Amount of the corresponding Spectral Effect. | `-200.00` to `200.00`. |
| `TMSrc`/`TMDpt`| Tune Modulation Source and Depth. `TMSrc` is a modulator index. | `TMSrc`: Index, `TMDpt`: Amount. |

`OSC1/Tune` averages about **-4** semitones in the dataset, pointing to frequent octave-down layering, while `OSC1/Vol` averages near **89** (on a 0-200 scale). If you find an oscillator block but the associated mixer (`Mix#`, `VMix`, or `MMix#`) holds the level at zero, that source is disabled despite the parameter values.

#### **Frequency Modulation Oscillators (`#cm=FMO1` - `FMO4`)**
Used for classic FM synthesis.
| Parameter | Description | Value Range / Notes |
| :--- | :--- | :--- |
| `Wave` | The waveform of the modulator. | `0`=Sine, `1`=Triangle, etc. |
| `Tune` | Pitch ratio relative to the note played. | Integer-based for harmonic ratios. |
| `FM` | FM Amount/Depth. | `0.00` to `100.00`. |
| `Vol` | Output volume of this FM Operator. | `0.00` to `200.00`. |

#### **Noise Generators (`#cm=Noise1`, `Noise2`)**
| Parameter | Description | Value Range / Notes |
| :--- | :--- | :--- |
| `Type` | Type of noise. | `0`=White, `1`=Pink. |
| `F1` | LP Filter Cutoff for the noise. | `0.00` to `100.00`. |
| `F2` | HP Filter Cutoff for the noise. | `0.00` to `100.00`. |
| `Vol` | Output volume. | `0.00` to `200.00`. |

#### **Comb Filters (`#cm=Comb1` - `Comb4`)**
Physical modeling modules used for plucked/bowed strings, flutes, etc.
| Parameter | Description | Value Range / Notes |
| :--- | :--- | :--- |
| `Tune` | The fundamental pitch of the resonator. | Semitones. |
| `FB` | Feedback amount. Creates sustain and changes timbre. | `0.00` to `100.00`. |
| `Damp` | Damping. A low-pass filter in the feedback loop. | `0.00` to `100.00`. |
| `Tne` | Tone. Controls the character of the sound. | `-100.00` to `100.00`. |
| `Dist` | Distortion within the feedback loop. | `0.00` to `100.00`. |
| `Vol` / `Dry`| Mix between the processed (Wet) and unprocessed (Dry) signal. | `0.00` to `100.00`. |

### 3.3. Filters & Processors

These modules shape the sound from the generators.

#### **VCF / XMF (Filters)**
These are the main filters. XMFs (`#cm=XMF1`, `XMF2`) are more complex and CPU-intensive than VCFs (`#cm=VCF1`-`VCF6`).
| Parameter | Description | Value Range / Notes |
| :--- | :--- | :--- |
| `Typ` | Filter type (Lowpass, Highpass, Bandpass, etc.). | Integer index. |
| `Cut` | Cutoff frequency, scaled to MIDI notes. | `0.00` to `150.00`. |
| `Res` | Resonance at the cutoff frequency. | `0.00` to `100.00`. |
| `Drv` | Drive/Saturation added to the filter. | `0.00` to `100.00`. |
| `KeyScl` | Key Follow. How much the cutoff tracks the keyboard. | `0.00` (off) to `100.00` (full). |
| `FM1`/`FS1` | FM Amount and Source for modulating the cutoff at audio rates. | `FM1`: Amount, `FS1`: Modulator Index. |

**Filter focus tips**
- `VCF1/Cut` tends to sit around **85** (mid brightness) while `XMF1/Cut` averages **121**. Values below 40 usually rely on envelopes or modulation to open the filter; values above 110 indicate intentionally bright or aggressive patches.
- `VCF1/Res` averages about **15**, so higher settings are deliberate accent choices. `XMF` resonance averages closer to **5**, meaning peaks on XMFs often come from modulation rather than the base value.
- Check `KeyScl` (average ~20 on VCF1, ~9 on VCF2) to see whether brightness tracks the keyboard. Values above 60 suggest the designer wanted consistent brightness across octaves.
- `FM#` depths average roughly **27** with a +/-150 range. Resolve `FS#` through the `#ms` list to learn which envelopes, LFOs, or XY pads are animating cutoff or resonance; this modulation often defines the preset's movement more than the static value.

### 3.4. Modulators

These modules create control signals to animate parameters.

#### **Envelopes (`#cm=ENV1` - `ENV4`)**
| Parameter | Description | Value Range / Notes |
| :--- | :--- | :--- |
| `Atk` | Attack time. | `0.00` to `100.00`. |
| `Dec` | Decay time. | `0.00` to `100.00`. |
| `Sus` | Sustain level. | `0.00` to `100.00`. |
| `Rel` | Release time. | `0.00` to `100.00`. |
| `Vel` | Velocity sensitivity. Modulates the envelope's overall output level. | `0.00` (none) to `100.00` (full). |
| `Slope` | Curve of the envelope segments (linear to exponential). | `-100.00` to `100.00`. |

`ENV1` statistics cluster around `Atk` at roughly **16**, `Dec` near **47**, `Sus` close to **51**, `Rel` about **34**, and `Vel` around **27**. Short attacks with medium decays dominate factory content, so noticeably longer times usually signal pads or evolving textures. Check whether `ENV1` is routed to `VCF#:Cut` (via `MMS`/`MMD`) because that pairing is the primary driver of dynamic brightness.

#### **Low-Frequency Oscillators (`#cm=LFO1` - `LFO4` and `LFOG`, `LFOG2`)**
LFOs are per-voice, while LFOGs are global.
| Parameter | Description | Value Range / Notes |
| :--- | :--- | :--- |
| `Wave` | LFO waveform shape (Sine, Triangle, Saw, Random, etc.). | Integer index. |
| `Sync` | Sync mode. `>0`=Tempo Synced, `<0`=Free Running in Hz. | Integer index. |
| `Rate` | LFO speed. | Depends on `Sync`. |
| `Amp` | LFO amplitude/depth. | `0.00` to `100.00`. |
| `Phse` | Phase offset. The starting point of the waveform. | `0.00` to `100.00`. |

`LFO1` typically runs around `Rate` **107** with `Sync` near **2** (light tempo sync) and `Amp` around **87**. Expect clearly audible movement unless the depth is attenuated in the modulation matrix. Always verify whether the destination is `VCF#:Cut` or `VCF#:Res`, because low-rate sweeps paired with high resonance are a common design strategy.

#### **Multi-Stage Envelope Generators (`#cm=MSEG1` - `MSEG8`)**
Complex, user-drawable envelopes/LFOs. Their shape is stored in the binary data section.
| Parameter | Description | Value Range / Notes |
| :--- | :--- | :--- |
| `TmUn` | Time Unit for the stages. | `0-3` (Seconds, 16th, Quarters, Notes). |
| `Atk`, `Lpt`, `Rel` | Rate multipliers for the Attack, Loop, and Release sections. | `-8.00` to `8.00`. |
| `Vel` | Velocity sensitivity for the MSEG's output level. | `0.00` to `100.00`. |

### 3.5. Effects (FX Grid)

Modules found in the FX grid section, which are typically global effects.

#### **Delay (`#cm=Delay1`, `Delay2`)**
| Parameter | Description | Value Range / Notes |
| :--- | :--- | :--- |
| `Mix` | Dry/Wet mix of the delay effect. | `0.00` to `100.00`. |
| `FB` | Feedback amount. | `0.00` to `100.00`. |
| `Sync1`-`4`| Sync rate for each of the four delay taps. | Integer index. |
| `T0`-`3` | Time multiplier for each tap. | `0.00` to `100.00`. |
| `Pan1`-`4` | Pan position for each tap. | `-100.00` to `100.00`. |

#### **Reverb (`#cm=Rev1` and `#cm=NuRev1`)**
| Parameter | Description | Value Range / Notes |
| :--- | :--- | :--- |
| `Wet` / `Mix` | Amount of reverb effect. | `0.00` to `100.00`. |
| `Size` | Size of the simulated room. | `0.00` to `100.00`. |
| `Decay` / `FB` | Length of the reverb tail. | `0.00` to `100.00`. |
| `Damp` | High-frequency damping. | `0.00` to `100.00`. |

## 4. How an LLM Should Use This Guide

*   **To understand a preset**: Read the `.h2p` file section by section. Start with the filter blocks - note `Cut`, `Res`, `KeyScl`, and any modulation targeting them - then move on to oscillators, envelopes, and FX. Use the tables above to translate each parameter value. To resolve modulation, find the `#ms` list to identify sources and examine the corresponding `MT`/`MMT` entries.
*   **To modify a preset**: To change the filter cutoff, locate the `#cm=VCF1` block and change the value of the `Cut` parameter. To make an envelope's attack longer, find the corresponding `#cm=ENV...` block and increase the `Atk` value.
*   **To create a preset**: Start with a simple `.h2p` file (like an `init` preset). Add `#cm` blocks for the modules you want to use (e.g., `#cm=OSC1`, `#cm=OSC2`, `#cm=VCF1`, `#cm=ENV1`). Set their parameters according to the desired sound. Add modulation by creating `MMT`/`MMS`/`MMD` entries.
*   **Important Constraint**: **NEVER modify, delete, or generate the content in the `$$$$...` binary data block.** If you are creating a preset from scratch that requires custom MSEG or Oscillator waveforms, it's best to omit this section and let the synthesizer generate a default one. If modifying a file, leave this section untouched at the end of the file.
