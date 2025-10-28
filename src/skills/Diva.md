# Understanding u-he Diva `.h2p` Preset Files

## 1. Introduction

This document provides a detailed breakdown of the `.h2p` preset file format for the u-he Diva software synthesizer. Its purpose is to serve as a technical reference for an LLM to understand, analyze, generate, and modify Diva presets. The information is compiled by mapping the parameters and values in the text-based preset files to the features and controls described in the Diva User Guide (v1.4.8).

## 2. Preset File Structure

A `.h2p` file is a text file containing key-value pairs that define every parameter of a synth patch. It is structured into several distinct sections.

### 2.1. Metadata Block

The file begins with a multi-line comment block containing descriptive metadata for use in Diva's preset browser.

```
/*@Meta

Bank:
'Diva Factory 1.0'
Author:
'Howard Scarr'
Usage:
'MW = wobble'
Categories:
'Bass:Sub'
Features:
'Mono, Dry, Percussive, Glide'
Character:
'Dark, Constant, Clean, Phat, Modern'

*/
```

*   **`Bank`**: The sound bank or collection the preset belongs to.
*   **`Author`**: The name of the sound designer.
*   **`Usage`**: Performance notes, explaining how to use controllers like the Mod Wheel (`MW`) or Aftertouch (`AT`).
*   **`Categories`**: Describes the preset's instrument type or genre (e.g., `Bass:Sub`, `Pads:Rhythmic`).
*   **`Features`**: Technical classifications of the sound (e.g., `Mono`, `Poly`, `BPM`, `Percussive`).
*   **`Character`**: Subjective descriptions of the sound's timbre and feel (e.g., `Dark`, `Moving`, `Vintage`).

### 2.2. Header and Modulation Sources

Following the metadata, global identifiers and the full list of modulation sources are defined.

*   **`#AM=Diva`**: Identifies the synthesizer.
*   **`#Vers=...`**: The preset format version.
*   **`#nm=24`**: Declares the number of modulation sources available (24 in this case).
*   **`#ms=...`**: A list of all 24 modulation sources. The order of this list is crucial, as parameters ending in `Src` (e.g., `FMSrc`) use a zero-based index from this list.

### 2.3. Module Configuration (`#cm=...`)

The bulk of the file consists of module blocks, each starting with `#cm=` followed by the module name (e.g., `#cm=OSC`, `#cm=VCF1`). These blocks contain the parameter settings for that specific part of the synthesizer.

### 2.4. Binary Data Block

The file ends with a block of compressed binary data, which should not be modified.
`$$$$...`

---

## 3. Modulation Source Mapping

Parameters that select a modulation source (e.g., `FMSrc`, `ModSrc`, `DMS1`) use a 0-based index referring to the `#ms` list defined at the top of the preset file.

| Index | Preset Name | Manual Name / Function |
| :---: | :--- | :--- |
| 0 | `none` | No modulation |
| 1 | `ModWhl` | Modulation Wheel (MIDI CC #01) |
| 2 | `PitchW` | Pitch Wheel / Bender |
| 3 | `CtrlA` | Control A (User-definable MIDI CC, default Breath CC #02) |
| 4 | `CtrlB` | Control B (User-definable MIDI CC, default Expression CC #11) |
| 5 | `Gate` | Note On/Off status |
| 6 | `Velocity` | Note On velocity |
| 7 | `Pressure` | Channel Pressure (Aftertouch) or Polyphonic Aftertouch |
| 8 | `KeyFollow` | MIDI note number, pivoting around E2 |
| 9 | `KeyFollow2` | `KeyFollow` with Glide2 offset |
| 10 | `Alternate` | Flips between two values per voice |
| 11 | `Random` | A random value per played MIDI note |
| 12 | `StackVoice` | Stack Index (-1 to +1 spread across stacked voices) |
| 13 | `VoiceMap` | General-purpose voice offsets from the TRIMMERS panel |
| 14 | `Env1` | Envelope 1 (typically for amplitude) |
| 15 | `Env2` | Envelope 2 (typically for modulation) |
| 16 | `LFO1` | LFO 1 (typically for vibrato) |
| 17 | `LFO2` | LFO 2 (general purpose) |
| 18 | `Rectify` | Rectify processor output |
| 19 | `Invert` | Invert processor output |
| 20 | `Quant` | Quantise processor output |
| 21 | `Lag` | Lag processor (slew) output |
| 22 | `Adder` | Add processor output |
| 23 | `Multiply` | Multiply processor output |

---

## 4. Detailed Parameter Reference

This section maps the parameters within each `#cm` module block to their functions.

### 4.1. Main Output & Voice Control

#### `#cm=main`
| Parameter | UI Name | Description |
| :--- | :--- | :--- |
| `CcOp` | Output | The final master volume control for the patch. |

#### `#cm=VCC` (Voice Control Configuration)
| Parameter | UI Name | Description & Value Mapping |
| :--- | :--- | :--- |
| `Voices` | Voices | Sets the maximum number of voices (polyphony). 0-7 corresponds to 2, 3, 4, 5, 6, 8, 12, 16 voices. |
| `Mode` | Mode | Sets the voice mode. `0`: poly, `1`: mono, `2`: legato, `3`: duo, `4`: poly2. |
| `Prior` | Note Priority | Note priority for Mono/Legato modes. `0`: last, `1`: lowest, `2`: highest. |
| `Porta` | Glide | The rate of portamento (pitch slide). |
| `PortaM` | GlideMode | `0`: time (constant time), `1`: rate (constant speed). |
| `Trsp` | Transpose | Global pitch transpose in semitones. |
| `FTun` | Fine | Global fine-tuning in fractions of a semitone. |
| `Drft` | Voice Drift | (Found in Trimmers panel) The amount of slow, random pitch wavering. |
| `PB` | PitchBend Up | Pitch bend up range in semitones (e.g., `2` = 2 semitones). |
| `PBD` | PitchBend Down | Pitch bend down range in semitones. |

### 4.2. Oscillators (`#cm=OSC`)

This is the main sound generation module. The available parameters change significantly based on the selected `Model`.

| Parameter | UI Name | Description & Value Mapping |
| :--- | :--- | :--- |
| `Model` | Oscillator Model | Selects the core oscillator type. `1`: Triple VCO, `2`: Dual VCO, `3`: DCO, `4`: Dual VCO Eco, `5`: Digital. |
| `Drift` | Voice Drift | Controls slow, random pitch fluctuation for an analog feel. (Visible in Trimmers panel) |

---
**Model 1: Triple VCO** (Manual p.23-24)
*   Three continuously variable waveform oscillators with FM and sync.
| Parameter | UI Name | Description |
| :--- | :--- | :--- |
| `Tune2`, `Tune3` | Detune (Osc 2/3) | Detunes oscillators 2 and 3 relative to oscillator 1. Value is `0.00` at center. |
| `VtoD` | Octave Switches | Sets the base octave for each oscillator. The `VtoD` value is a bitmask representing the switch positions. |
| `Vol1`, `Vol2`, `Vol3` | Volume (Osc 1/2/3) | Volume levels for the three oscillators in the Mixer section. |
| `Noise` | Noise Volume | The volume of the Pink/White noise generator. |
| `NoiseC` | Noise Type | Selects noise color. `0`: Pink, `1`: White. |
| `Wave1`, `Wave2`, `Wave3` | Waveform | Continuously variable waveform from ramp to narrow pulse. `5.00` is triangle. |
| `FM` | FM 1->2/3 | Amount of frequency modulation from Oscillator 1 to Oscillators 2 and 3. |
| `Sync2`, `Sync3` | Sync (Osc 2/3) | Toggles hard-sync for Osc 2 and 3 to Osc 1. `0`: Off, `1`: On. |
| `SM1On`, `SM2On`, `SM3On` | Shape Mod Switches | Activates waveform modulation for each oscillator. `0`: Off, `1`: On. |
| `Sh1Src` | Shape Mod Source | Selects the modulation source for waveform modulation (LFO2 by default). |
| `Sh1Dpt` | Shape Mod Amount | Sets the intensity and polarity of waveform modulation. |
| `Fback` | Feedback | Controls the amount of signal fed back from post-filter into the mixer. (Found in `#cm=VCF1`) |

---
**Model 3: DCO** (Manual p.27)
*   A single oscillator with multiple, mixable, synchronized waveforms plus a sub-oscillator.
| Parameter | UI Name | Description |
| :--- | :--- | :--- |
| `Trsp` | Transpose | Main oscillator octave switch. |
| `PW` | Pulse Width | The manual pulse width for pulse waveforms. |
| `PWMSrc` | PWM Source | Modulation source for Pulse Width Modulation (LFO2 by default). |
| `PWMDpt` | PWM Amount | The depth of the Pulse Width Modulation. |
| `PWShp` | Pulse Selector | Selects the Pulse waveform shape (index from 0-4). |
| `SawShp` | Sawtooth Selector | Selects the Sawtooth waveform shape (index from 0-4). |
| `SubShp` | Sub Osc Selector | Selects the Sub-oscillator waveform shape (index from 0-5). |
| `Vol1` | Sub-oscillator Level | The volume of the sub-oscillator. |
| `Noise` | Noise Level | The volume of the noise generator. |

*(Note: Parameters for other oscillator models like Dual VCO, ECO, and Digital follow a similar logic, mapping controls from the UI to named parameters.)*

### 4.3. Filters (`#cm=HPF` & `#cm=VCF1`)

Diva has two filter stages: a pre-filter (HPF or Feedback) and the main filter (VCF).

#### `#cm=HPF` (High-pass Filters / Feedback)
| Parameter | UI Name | Description & Value Mapping |
| :--- | :--- | :--- |
| `Model` | HPF Model | Selects the module type. `0`: No HPF (Just Feedback), `1`: HPF Post, `2`: HPF Pre, `3`: HPF Bite. |
| `Freq` | Frequency / Feedback | Controls cutoff frequency for HPF models, or feedback amount for the "No HPF" model. |
| `Res` | Resonance / Peak | Controls resonance for HPF Pre/Bite models. |
| `FMSrc` | Mod Source | Modulation source for cutoff/feedback. |
| `FMDpt` | Mod Amount | Modulation depth for cutoff/feedback. |

#### `#cm=VCF1` (Main Voltage Controlled Filter)
| Parameter | UI Name | Description & Value Mapping |
| :--- | :--- | :--- |
| `Model` | Filter Model | Selects the main filter type. `1`: Ladder, `2`: Cascade, `3`: Multimode, `4`: Bite, `5`: Uhbie. |
| `Freq` | Cutoff | The filter's cutoff frequency. |
| `Res` | Resonance / Emphasis / Peak | The filter's resonance amount. |
| `FMSrc` | Mod Source 1 | The first modulation source for cutoff (ENV 2 by default). |
| `FMDpt` | Mod Amount 1 | The amount of modulation from source 1. |
| `FM2Src` | Mod Source 2 | The second modulation source for cutoff (LFO 2 by default). |
| `FM2Dpt` | Mod Amount 2 | The amount of modulation from source 2. |
| `KeyScl` | KYBD | Key-tracking amount for the cutoff frequency. |
| `FFM` | Filter FM | Bipolar filter FM amount from Oscillator 1 (Ladder, Cascade, Multimode models). |
| `LMode` | Filter Slope | Sets the filter slope. `0`: 24dB, `1`: 12dB (Ladder/Cascade models). |
| `SkRev` | Filter Type/Revision | Selects mode for Multimode (LP4/LP2/HP/BP) or revision for Bite filters. |
| `Fback` | Feedback | Amount of post-filter signal feedback (used with Triple VCO oscillator). |

### 4.4. Envelopes & Amplifier

#### `#cm=ENV1` & `#cm=ENV2`
| Parameter | UI Name | Description & Value Mapping |
| :--- | :--- | :--- |
| `Model` | Envelope Model | `0`: ADS (shared D/R), `1`: Analogue, `2`: Digital. |
| `Atk` | Attack | Attack time. |
| `Dec` | Decay | Decay time. |
| `Sus` | Sustain | Sustain level. |
| `Rel` | Release | Release time. |
| `Vel` | Velocity | Amount envelope level is scaled by MIDI velocity. |
| `KeyFlw` | KYBD | Amount envelope times are scaled by MIDI note number. |
| `Crve` | Curve | The 'C' button for the Digital model, affecting the envelope shape. `0`: Off, `1`: On. |
| `Quant` | Quantize | The 'Q' button for the Digital model, creating a "steppy" envelope. `0`: Off, `1`: On. |

#### `#cm=VCA1` (Voltage Controlled Amplifier)
| Parameter | UI Name | Description & Value Mapping |
| :--- | :--- | :--- |
| `VCA` | VCA Source | `1`: Env1, `0`: Gate. |
| `Vol` | Volume | Amplifier gain control; can be used to add subtle drive. |
| `Pan` | Pan | Stereo panning position. |
| `ModSrc` | Vol Mod Source | Modulation source for volume. |
| `ModDpt` | Vol Mod Amount | Modulation depth for volume. |
| `PanSrc` | Pan Mod Source | Modulation source for panning. |
| `PanDpt` | Pan Mod Amount | Modulation depth for panning. |

### 4.5. LFOs (`#cm=LFO1` & `#cm=LFO2`)

| Parameter | UI Name | Description & Value Mapping |
| :--- | :--- | :--- |
| `Sync` | Sync / Rate | LFO rate. Values > 0 are tempo-synced (e.g., `13`=1/4), values < 0 are free-running in Hz. |
| `Rate` | Rate (Offset) | Fine-tunes the LFO rate relative to the main Sync setting. |
| `Wave` | Waveform | `0`: sine, `1`: triangle, `2`: saw up, `3`: saw down, `4`: sqr hi-lo, `5`: sqr lo-hi, `6`: rand hold, `7`: rand glide. |
| `Trig` | Restart | `0`: sync, `1`: gate, `2`: single, `3`: random. |
| `Dly` | Delay | The fade-in time for the LFO. |
| `Polar` | Polarity | `0`: Bipolar (-1 to +1), `1`: Unipolar (0 to +1). |
| `DMS1` | Depth Mod Source | Modulation source for the LFO's overall level (amplitude). |
| `DMD1` | Depth Mod Amount | The amount of LFO level modulation. |
| `FMS1` | Rate Mod Source | Modulation source for the LFO's rate (frequency). |
| `FMD1` | Rate Mod Amount | The amount of LFO rate modulation. |

### 4.6. Effects (`#cm=FX1` & `#cm=FX2`)

Diva has two serial effects slots. The configuration for both is stored in the preset, even if they are turned off.

| Parameter | UI Name | Description |
| :--- | :--- | :--- |
| `Module` | Effect Type | A string defining the active effect for the slot (e.g., `'Delay1'`, `'Plate2'`, `'Chorus1'`). |

Each effect type has its own set of parameters stored in a corresponding block (e.g., `#cm=Plate1`, `#cm=Delay1`).

#### Example: `#cm=Delay1` Parameters
| Parameter | UI Name | Description |
| :--- | :--- | :--- |
| `LDel`, `CDel`, `RDel` | Left, Center, Right | Delay times for the three taps, relative to host tempo. |
| `CVol`, `SVol` | Center Vol, Side Vol | Volume for the center and stereo (L/R) taps. |
| `FeedB` | Feedback | The amount of signal regeneration. |
| `HP`, `LP` | HP, LP | Cutoff frequencies for high-pass and low-pass filters in the feedback path. |
| `Wow` | Wow | Simulates slow tape wobble. |
| `Dry` | Dry | The level of the unprocessed signal. |

---
## 5. Conclusion

This guide provides a foundational context for an LLM to interpret Diva's `.h2p` preset format. By cross-referencing the parameter names in the preset files with the descriptions of the synthesizer's modules, it is possible to understand the function of each value and how it contributes to the final sound. This enables advanced tasks such as patch analysis, targeted sound modification, and novel preset generation.
