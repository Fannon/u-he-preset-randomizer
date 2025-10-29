# Understanding u-he Diva `.h2p` Preset Files

## 1. Introduction

This document provides a detailed breakdown of the `.h2p` preset file format for the u-he Diva software synthesizer. Its purpose is to serve as a technical reference for an LLM to understand, analyze, generate, and modify Diva presets. The information is compiled by mapping the parameters and values in the text-based preset files to the features and controls described in the Diva User Guide (v1.4.8).

**CRITICAL INSIGHT:** When analyzing Diva presets, the filter parameters (VCF1) are THE most important sound-shaping elements. Filter cutoff, resonance, and their modulation sources/depths determine the fundamental character of the sound more than any other module. Always examine these parameters first when analyzing a preset.

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

## 4. Filter Analysis: The Most Critical Module

**The VCF1 (Main Filter) module is THE primary sound-shaping element in Diva presets.** When analyzing a preset, always examine the filter parameters first, as they have more impact on the final sound than oscillators, envelopes, or effects.

### 4.1. Filter Parameter Importance Hierarchy

1. **VCF1/Freq (Cutoff Frequency)** - The single most important parameter
   - Range: 30-150, Typical average: ~74
   - Determines the fundamental brightness/darkness of the sound
   - MUST be analyzed in combination with modulation to understand the actual frequency sweep range

2. **VCF1/Res (Resonance/Emphasis)** - Second most critical parameter
   - Range: 0-100, Typical average: ~29 (but highly variable!)
   - Dramatically affects timbre: 0 = smooth, >50 = aggressive/metallic, >80 = self-oscillation territory
   - Low resonance (~0-20): Clean, transparent filtering
   - Medium resonance (~20-50): Classic analog character
   - High resonance (~50-100): Aggressive, pronounced peak, potential screaming/whistling

3. **VCF1/FMDpt (Primary Modulation Depth)** - Critical for sound movement
   - Range: -120 to +120, Typical average: ~40
   - **Nearly all presets use significant filter modulation** - this is not optional!
   - Positive values: Modulation opens the filter (typically from envelope)
   - Negative values: Modulation closes the filter (rare, special effects)
   - The ACTUAL filter frequency range = Static Freq ± (FMDpt * modulation source level)

4. **VCF1/FMSrc (Primary Modulation Source)** - Defines filter movement character
   - Most common: Index 15 (ENV2) - creates classic attack/decay filter sweeps
   - Also common: Index 17 (LFO2) - creates cyclic filter movement
   - Index 0 (none) - static filter, no movement (rare in musical presets)

5. **VCF1/FM2Dpt & VCF1/FM2Src (Secondary Modulation)** - Adds complexity
   - Average depth: ~15 (about half of primary modulation)
   - Often uses velocity (index 6), mod wheel (index 1), or LFO1 (index 16)
   - Creates dynamic, performance-controllable filter behavior

### 4.2. Analyzing Filter Settings in Practice

When you see a preset with:
- `VCF1/Freq = 68`, `VCF1/Res = 45`, `VCF1/FMSrc = 15` (ENV2), `VCF1/FMDpt = 60`

**Interpret as:**
- **Base cutoff**: 68 (medium-bright static frequency)
- **Resonance**: 45 (moderate-to-strong emphasis, classic analog character)
- **Filter sweep**: Envelope 2 will sweep the filter from ~8 (68-60) to ~128 (68+60)
  - This is a WIDE sweep from very dark to very bright
  - The envelope's attack/decay/sustain determines the speed and shape of this sweep
- **Result**: This preset will have a strong "wah" filter opening characteristic typical of analog bass/lead sounds

### 4.3. Common Filter Patterns

**Classic Bass Sound:**
- Low static Freq (40-60), High FMDpt (60-100), ENV2 as source
- The filter starts closed and sweeps open with the envelope

**Pad/String Sound:**
- Medium-high Freq (80-100), Low-medium FMDpt (10-40), Slow ENV2
- Gentle, slow filter movement for evolving textures

**Pluck Sound:**
- Medium Freq (60-80), Medium-high FMDpt (40-70), Fast ENV2 attack/decay
- Quick filter snap that decays rapidly

**Static/Organ Sound:**
- Any Freq, FMDpt = 0 or very low (<10), Res often 0
- Minimal or no filter movement

### 4.4. HPF (High-Pass Filter) Role

The HPF is secondary to VCF1 but important for:
- Removing low-end rumble (typical Freq: 40-60, Res: 0-20)
- Creating thin, aggressive tones (Freq: 80-120, Res: 20-60)
- Average HPF Res is much lower (~11) than VCF1 Res (~29)
- Often used subtly; many presets use HPF Model 0 (no HPF, just feedback)

---

## 5. Detailed Parameter Reference

This section maps the parameters within each `#cm` module block to their functions.

### 5.1. Main Output & Voice Control

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

### 5.2. Oscillators (`#cm=OSC`)

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

### 5.3. Filters (`#cm=HPF` & `#cm=VCF1`)

**CRITICAL: See Section 4 for comprehensive filter analysis guidance. This section provides technical parameter mappings; Section 4 explains how to interpret them for sound analysis.**

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

**This is THE most important module in the preset. Always analyze these parameters first.**

| Parameter | UI Name | Description & Value Mapping | Typical Values |
| :--- | :--- | :--- | :--- |
| `Model` | Filter Model | Selects the main filter type. `1`: Ladder, `2`: Cascade, `3`: Multimode, `4`: Bite, `5`: Uhbie. | Varies by sound design choice |
| `Freq` | Cutoff | **[CRITICAL]** The filter's static cutoff frequency. Range: 30-150. | Avg: ~74. See Section 4.2 for interpretation. |
| `Res` | Resonance / Emphasis / Peak | **[CRITICAL]** The filter's resonance amount. Range: 0-100. | Avg: ~29. <20=clean, 20-50=analog, >50=aggressive |
| `FMSrc` | Mod Source 1 | **[CRITICAL]** The primary modulation source for cutoff. Index from `#ms` list. | Most common: 15 (ENV2) |
| `FMDpt` | Mod Amount 1 | **[CRITICAL]** The primary modulation depth. Range: -120 to +120. | Avg: ~40. Defines filter sweep range. |
| `FM2Src` | Mod Source 2 | Secondary modulation source for cutoff. Index from `#ms` list. | Common: 1 (ModWhl), 6 (Velocity), 16/17 (LFOs) |
| `FM2Dpt` | Mod Amount 2 | Secondary modulation depth. Range: -120 to +120. | Avg: ~15. Adds dynamic control. |
| `KeyScl` | KYBD | Key-tracking: how much cutoff follows MIDI note number. Higher notes = brighter. | 0-100, often 0 or 20-40 |
| `FFM` | Filter FM | Bipolar filter FM amount from Oscillator 1 (Ladder, Cascade, Multimode models). | Usually 0 or low values |
| `LMode` | Filter Slope | Sets the filter slope. `0`: 24dB (steep), `1`: 12dB (gentle). | Varies by design |
| `SkRev` | Filter Type/Revision | Selects mode for Multimode (LP4/LP2/HP/BP) or revision for Bite filters. | Model-dependent |
| `Fback` | Feedback | Amount of post-filter signal feedback (used with Triple VCO oscillator). | 0-100, use sparingly |

**Analysis Workflow:** Always examine VCF1 in this order:
1. Check `Freq` (base cutoff)
2. Check `Res` (resonance character)
3. Check `FMSrc` and `FMDpt` (primary modulation - defines the sweep)
4. Calculate effective frequency range: Freq ± FMDpt
5. Check `FM2Src` and `FM2Dpt` (secondary modulation - adds expression)
6. Cross-reference `FMSrc`/`FM2Src` with their respective envelope/LFO settings

### 5.4. Envelopes & Amplifier

**Important:** Envelope 2 (ENV2) is typically the primary filter modulation source. When analyzing a preset with filter modulation, always examine ENV2's ADSR settings to understand the filter's temporal behavior.

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

### 5.5. LFOs (`#cm=LFO1` & `#cm=LFO2`)

**Note:** LFO2 (index 17) is commonly used as a secondary filter modulation source for vibrato/wobble effects.

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

### 5.6. Effects (`#cm=FX1` & `#cm=FX2`)

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
## 6. Conclusion & Analysis Priority

This guide provides a foundational context for an LLM to interpret Diva's `.h2p` preset format.

**When analyzing ANY Diva preset, follow this priority order:**

1. **VCF1 Filter (Section 4)** - Start here ALWAYS
   - Freq, Res, FMSrc, FMDpt - these define 70% of the sound character
   - Calculate the effective filter frequency range

2. **ENV2 (if used for filter mod)** - Second priority
   - Attack, Decay, Sustain, Release - defines filter movement timing
   - This envelope shapes the filter sweep from step 1

3. **Oscillators (Section 5.2)** - Third priority
   - Waveforms, detune, FM, sync - defines the raw harmonic content
   - Remember: filters shape this content dramatically

4. **ENV1 & VCA (Section 5.4)** - Fourth priority
   - Amplitude envelope shapes overall volume
   - Usually simpler and less impactful than filter envelope

5. **Everything else** - Final considerations
   - LFOs, effects, HPF, etc. - add polish and movement

**Key Insight:** A preset with simple oscillators and sophisticated filter settings will sound far more interesting than one with complex oscillators and static filtering. The filter IS the sound.
