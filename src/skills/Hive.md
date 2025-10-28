# u-he Hive 2 Synthesizer Preset Context File

## 1. Introduction

This document provides a comprehensive guide to the structure and parameters of preset files for the u-he Hive 2 software synthesizer. Its purpose is to serve as a knowledge base for a Large Language Model (LLM) to understand, interpret, and manipulate Hive 2 presets stored in the `.h2p` format.

Hive 2 is a "wavetable" synthesizer with a flexible, semi-modular architecture. It features two main synthesis engines that can be layered, each with its own oscillator, sub-oscillator, filter, and amplifier. Modulation is a key aspect of Hive, with a wide array of sources (Envelopes, LFOs, Function Generators, Sequencers) that can be routed to nearly any parameter via a powerful modulation matrix.

## 2. `.h2p` Preset File Structure

A `.h2p` file is a human-readable text file composed of three main parts:

### 2.1. Metadata Block

The file begins with a multi-line comment block `/*@Meta ... */` containing descriptive metadata for the preset browser.

*   `Bank`: The soundset or collection the preset belongs to.
*   `Author`: The creator of the preset.
*   `Description`: A brief description of the sound.
*   `Usage`: Performance notes, such as what the ModWheel (MW) or Aftertouch (AT) controls.
*   `Categories`: Comma-separated tags describing the sound's category (e.g., `Bass:Analogue`, `Pads:Strings`).
*   `Features`: Comma-separated tags describing technical characteristics (e.g., `Mono`, `BPM`, `Poly`).
*   `Character`: Comma-separated tags describing the sonic character (e.g., `Bright`, `Dark`, `Moving`, `Dirty`).

### 2.2. Header and Source/Target Definitions

This section defines the synth version and provides a crucial index for modulation sources. Each source is given an integer ID.

*   `#AM=Hive`: Identifies the file as a Hive preset.
*   `#Vers=200`: Indicates Hive version 2.
*   `#ms=...`: A list mapping modulation source names (e.g., `ModWhl`, `Pressure`, `LFO 1`) to an integer index, starting from 0. This index is used in the modulation matrix sections (`#cm=MM...`).

### 2.3. Component Modules (`#cm=...`)

The bulk of the file consists of parameter definitions grouped into "component" modules, each starting with a `#cm=` identifier. These modules directly correspond to the sections of the synthesizer's user interface. Parameters within each module are simple key-value pairs.

---

## 3. Module & Parameter Reference

This section maps the parameters found in the `.h2p` file to their functions as described in the user manual.

### 3.1. Global Settings

#### `#cm=Ctrl` (Control)

Global settings affecting the entire patch.

*   `Engine`: Sets the global synth character. This is a critical parameter that changes the behavior of oscillators, filters, and envelopes.
    *   `0`: **Clean**: Linear, precise, non-distorting. Uses State Variable filters.
    *   `1`: **Normal**: Emulates classic analog synths. S-curve envelopes and a self-oscillating Ladder filter.
    *   `2`: **Dirty**: Emulates a Korg MS-20 style signal path. Uses oversampled Steiner-Parker filters that can be very aggressive.

#### `#cm=VCC` (Voice Control)

Parameters related to voice allocation, pitch, and tuning.

*   `Voices`: (Integer `0`-`15`) Sets the maximum number of voices (polyphony) from 2 to 16. Stored as `N-1`. So, `Voices=5` means 6 voices.
*   `Mode`: (Integer `0`-`3`) Sets the voice mode.
    *   `0`: **poly**: Standard polyphonic mode.
    *   `1`: **mono**: Monophonic with envelope retriggering on every note.
    *   `2`: **legato**: Monophonic without envelope retriggering for overlapping notes.
    *   `3`: **duo**: Oscillator 1 plays the lowest note, Oscillator 2 plays the highest.
*   `PortaM`: (Integer `0`, `1`) Glide (Portamento) mode.
    *   `0`: **Rate**: Constant rate glide; time depends on the interval between notes.
    *   `1`: **Time**: Constant time glide; time is independent of the interval.
*   `Porta`: (Float `0.00` - `100.00`) The amount/time of the glide effect.
*   `Trsp`: (Integer `0`-`24`) Global transpose in semitones. A value of `7` corresponds to `0` semitones in the UI, so the stored value is `UI Value + 7`.
*   `FTun`: (Float `-100.00` - `100.00`) Global fine-tuning in cents.
*   `PB`, `PBD`: (Integers) Pitch bend up and down range in semitones.

---

### 3.2. Oscillators (OSC1 & OSC2)

Parameters are defined in `#cm=Osc1` and `#cm=Osc2`.

*   `Wave`: (Integer `0`-`8`) Selects the oscillator's waveform.
    *   `0`: Sine
    *   `1`: Sawtooth
    *   `2`: Triangle
    *   `3`: Square
    *   `4`: Pulse (PWM capable)
    *   `5`: Half Pulse
    *   `6`: Narrow Pulse
    *   `7`: White Noise
    *   `8`: Pink Noise
    *   `9`: Wavetable
*   `Unison`: (Integer `1`-`16`) Number of unison voices (detuned copies) for the oscillator.
*   `Octave`: (Integer `-3` - `3`) Coarse tuning in octaves.
*   `Semi`: (Integer `-12` - `12`) Coarse tuning in semitones.
*   `Detune`: (Float `0.00` - `100.00`) If `Unison=1`, acts as a fine tune. If `Unison > 1`, controls the amount of detuning between the unison voices.
*   `Width`: (Float `0.00` - `100.00`) Stereo spread of the unison voices.
*   `Pan`: (Float `-100.00` - `100.00`) Stereo position.
*   `Volume`: (Float `0.00` - `100.00`) Output level of the main oscillator.
*   `Vibrato`: (Float `0.00` - `100.00`) Amount of pitch modulation from the global Vibrato LFO.
*   `Trigger`: (Integer `0`-`2`) Oscillator phase restart mode.
    *   `0`: **reset**: Phase resets to 0 on each note.
    *   `1`: **random**: Phase starts at a random position.
    *   `2`: **flow**: Free-running phase.

#### Sub-Oscillator Parameters (within OSC module)

*   `SubWave`: (Integer `0`-`9`) Waveform for the sub-oscillator. Same mapping as `Wave`, plus `9`: **like Osc**.
*   `SubTune`: (Float `-36.00` - `36.00`) Fine-tuning of the sub-oscillator relative to the main oscillator.
*   `SubVol`: (Float `0.00` - `100.00`) Output level of the sub-oscillator.

---

### 3.3. Filters (FILTER1 & FILTER2)

Parameters are defined in `#cm=Filter1` and `#cm=Filter2`.

*   `Type`: (Integer `0`-`10`) Selects the filter algorithm.
    *   `0`: Bypass
    *   `1`: Lowpass 24dB
    *   `2`: Lowpass 12dB
    *   `3`: Bandpass
    *   `4`: Highpass
    *   `5`: Bandreject
    *   `6`: Peaking
    *   `7`: Comb
    *   `8`: Dissonant
    *   `9`: Reverb
    *   `10`: Sideband
*   `inO1`, `inS1`, `inO2`, `inS2`: (Booleans `0`, `1`) Input routing toggles for OSC1, SUB1, OSC2, SUB2 into this filter.
*   `inF`: (Boolean `0`, `1`) Present only in `Filter2`. Routes the output of Filter 1 into Filter 2 (serial routing).
*   `Cutoff`: (Float `0.00` - `150.00`) The filter's cutoff frequency.
*   `Res`: (Float `0.00` - `120.00`) The filter's resonance amount.
*   `Key`: (Float `0.00` - `100.00`) Key tracking amount (how the cutoff follows pitch).
*   `Env`: (Float `-100.00` - `120.00`) Bipolar modulation amount from the assigned modulation envelope.
*   `EnvNo`: (Integer `0`, `1`) Selects which MOD envelope (`0`=MOD1, `1`=MOD2) modulates the cutoff.
*   `Volume`: (Float `0.00` - `100.00`) The output level of the filter.

---

### 3.4. Envelopes (AMP & MOD)

Hive has four ADSR envelopes. Their parameters are defined in `#cm=AmpEnv1`, `#cm=AmpEnv2`, `#cm=ModEnv1`, `#cm=ModEnv2`.

*   `Atk`: (Float `0.00` - `100.00`) Attack time.
*   `Dec`: (Float `0.00` - `100.00`) Decay time.
*   `Sus`: (Float `0.00` - `100.00`) Sustain level.
*   `Rel`: (Float `0.00` - `100.00`) Release time.
*   `Vel`: (Float `0.00` - `100.00`) Velocity sensitivity, affecting the envelope's overall output level.
*   `Trig`: (Integer) Triggering mode. `0` = Gate, `1` = One Shot.

---

### 3.5. Low-Frequency Oscillators (LFOs)

Parameters for the two main LFOs are in `#cm=LFO1` and `#cm=LFO2`. The global vibrato LFO is in `#cm=VLFO`.

*   `Wave`: (Integer `0`-`7`) LFO waveform shape.
    *   `0`: sine
    *   `1`: triangle
    *   `2`: saw up
    *   `3`: saw down
    *   `4`: sqr hi-lo
    *   `5`: sqr lo-hi
    *   `6`: rand hold (stepped random)
    *   `7`: rand glide (smooth random)
*   `Sync`: (Integer) Time base for the LFO speed (host-synced or free-running in seconds).
*   `Trig`: (Integer `0`-`3`) Restart mode.
    *   `0`: **sync**: Restarts in sync with the host timeline.
    *   `1`: **single**: Restarts on the first note of a legato phrase.
    *   `2`: **gate**: Restarts on every note.
    *   `3`: **random**: Restarts at a random phase on every note.
*   `Phse`: (Float `0.00` - `100.00`) The starting phase of the LFO waveform.
*   `Rate`: (Float `-5.00` - `5.00`) Speed multiplier relative to the `Sync` time base.
*   `Polar`: (Boolean `0`, `1`) `1` makes the LFO unipolar (positive values only).
*   `Dly`: (`#cm=VLFO` only) Delay/fade-in time for the global vibrato.

---

### 3.6. Sequencer & Arpeggiator

These share a common clock (`#cm=CLK`).

#### `#cm=CLK` (Clock)

*   `Base`: (Integer `0`-`3`) The base clock division: `0`=1/32, `1`=1/16, `2`=1/8, `3`=1/4.
*   `Mult`: (Float `50.00` - `200.00`) Clock speed multiplier.
*   `Swing`: (Float `0.00` - `100.00`) Swing amount. `50.00` is triplet swing.

#### `#cm=ARP` (Arpeggiator)

*   `OnOff`: (Boolean `0`, `1`) Toggles the arpeggiator on/off.
*   `Dir`: (Integer `0`-`5`) Arpeggio direction (up, down, up/down, etc.).
*   `Oct`: (Integer `1`-`4`) Number of octaves the arpeggio spans.
*   `Order`: (Integer `0`-`3`) Order in which notes are played across octaves (serial, round, leap, repeat).

#### `#cm=SEQ` (Sequencer)

*   `Mode`: (Integer `0`-`3`) Sequencer operating mode. `0`=Off, `1`=MOD, `2`=Run (►), `3`=REC.
*   `Steps`: (Integer `2`-`16`) The number of steps in the sequence.
*   `GT01` - `GT16`: (Integer `0`-`2`) Gate state for each step. `0`=Rest, `1`=Note, `2`=Tie.
*   `TR01` - `TR16`: (Integer `-24` - `24`) Transposition value for each step.
*   `Vel01` - `Vel16`: (Integer `0`-`127`) Velocity value for each step.
*   `XP01` - `XP16`: (Integer `0`-`100`) "Mod" value for each step, sent to the `SeqMod` modulation source.

---

### 3.7. Effects (`#cm=FX...`)

The effects chain order and on/off state is in `#cm=FXGrid`. Individual effect parameters are in their own modules.

*   **`#cm=Distort`**: `Type`, `Amount`, `Tone`, `Mix`.
*   **`#cm=Chorus`**: `Type`, `Rate`, `Depth`, `Wet`.
*   **`#cm=Delay`**: `Mode`, `LDelay`, `RDelay` (time divisions), `FeedBck`, `Mix`.
*   **`#cm=Reverb`**: `Pre` (pre-delay), `Decay`, `Size`, `Damp`, `Mix`.
*   **`#cm=Comp`** (Compressor): `Amount`, `Attack`, `Release`, `Output`.
*   **`#cm=EQ`**: `BassG`/`BassF`, `MidG`/`MidF`, `HighG`/`HighF` (Gain and Frequency for each band).
*   **`#cm=Phaser`**: `Type`, `Rate`, `FB` (feedback), `Wet`.

---

### 3.8. Modulation Matrix (`#cm=MM...`)

Hive has 12 modulation slots, defined in `#cm=MM1` through `#cm=MM12`.

*   `Active`: (Boolean `0`, `1`) Toggles the slot on/off.
*   `Source`: (Integer) The primary modulation source. The integer maps to the `#ms=` list in the header. For example, if `#ms=ModWhl` is the second entry (index 1), then `Source=1` means the Mod Wheel is the source.
*   `Via`: (Integer) An optional secondary source that controls the *depth* of the primary source. Also maps to the `#ms=` list.
*   `Dest1`, `Dest2`: (String) The modulation target parameters. These are represented as human-readable strings, e.g., `Filter1:Cutoff`, `Osc1:PWidth`.
*   `Depth1`, `Depth2`: (Float `-100.00` - `100.00`) Bipolar modulation depth for each target.
*   `Curve1`, `Curve2`: (Integer `0`-`4`) Maps the modulation signal to an S-curve, from `0` (very compressed) to `4` (very expanded). `2` is linear.
*   `Rect1`, `Rect2`: (Integer `0`-`5`) Rectification mode (e.g., half-wave, full-wave). `0` is none.
*   `Slew1`, `Slew2`: (Integer `0`-`3`) Slew Limiter (smoothes sharp transitions). `0`=off, `1`=fast, `2`=smooth, `3`=slow.

#### Modulation Source ID Mapping (deduced from `#ms` list)

*   `0`: none
*   `1`: ModWhl
*   `2`: PitchW
*   `3`: CtrlA
*   `4`: CtrlB
*   `...` (continues for X/Y pads)
*   `13`: Sequencer
*   `14`: SeqMod
*   `15`: Gate
*   `16`: Velocity
*   `17`: Pressure (Aftertouch)
*   `18`: KeyFollow
*   `...` (continues for internal sources)
*   `23`: Amp Envelope 1
*   `24`: Mod Envelope 1
*   `...` (and so on for all sources listed in the header)

By cross-referencing this index with the `Source` and `Via` integer values in a preset file, the LLM can determine the complete modulation routing.
