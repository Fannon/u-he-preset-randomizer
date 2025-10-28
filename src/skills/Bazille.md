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

### `#cm=LFO1`, `#cm=LFO2` (Low-Frequency Oscillators)

Two dedicated LFOs for cyclic modulation.

*   `Rate`: (-5 to 5) LFO speed, interpreted by the `Sync` mode.
*   `Sync`: (Index) LFO rate mode. Selects between absolute times (seconds) and host-synced times (1/64 to 8/1, with dotted and triplet variations).
*   `Sym`: (0-100) `Wave` parameter. For triangle, morphs from falling saw to triangle to rising saw. For square, controls pulse width.
*   `Phse`: (0-100) The phase position where the LFO starts on a new note.
*   `FMS1`, `FMD1`: Rate Mod source and depth. Modulates the LFO speed.
*   `DMS1`, `DMD1`: Amp Mod source and depth. Modulates the LFO output level.
*   `Dly`: (0-100) Fades the LFO in from zero.

### `#cm=Multi1` - `#cm=Multi4` (Multiplex)

Four flexible utility modules that can act as mixers, ring modulators, or AM processors.

*   `In1A`, `In1B`, `In2A`, `In2B`: (Signal Source Index) The four signal inputs.
*   `InRM`: (Signal Source Index) The modulation input (`Mod`).
*   `Gain12`: (-100 to 100) The left knob. Without a `Mod` input, it's a level control for inputs 1 & 2. With a `Mod` input, it crossfades between the dry sum of 1+2 and the Ring Modulated signal (Input 1 * Mod).
*   `Gain34`: (-100 to 100) The right knob. Similar to `Gain12` but for inputs 3 & 4. Crossfades between the dry sum of 3+4 and the Amplitude Modulated signal (Input 3 * (1 - Mod)).

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
