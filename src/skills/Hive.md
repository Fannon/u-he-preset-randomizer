# u-he Hive 2 Synthesizer Preset Context File

## 1. Introduction

This document provides a comprehensive guide to the structure and parameters of preset files for the u-he Hive 2 software synthesizer. Its purpose is to serve as a knowledge base for a Large Language Model (LLM) to understand, interpret, and manipulate Hive 2 presets stored in the `.h2p` format.

Hive 2 is a "wavetable" synthesizer with a flexible, semi-modular architecture. It features two main synthesis engines that can be layered, each with its own oscillator, sub-oscillator, filter, and amplifier. Modulation is a key aspect of Hive, with a wide array of sources (Envelopes, LFOs, Function Generators, Sequencers) that can be routed to nearly any parameter via a powerful modulation matrix.

## 2. Sonic Importance: Critical Parameters for Sound Character

**Understanding parameter impact is crucial for analyzing and generating Hive presets.** Not all parameters contribute equally to a sound's character. This section highlights the most sonically significant parameters based on analysis of thousands of Hive presets.

### 2.1. FILTERS: The Most Critical Sound-Shaping Elements

**Filter parameters have the greatest impact on Hive's sonic character.** The filter cutoff, resonance, and their modulation define the timbre, brightness, movement, and character of virtually every sound.

#### Filter Cutoff (Filter1/Cutoff, Filter2/Cutoff)
*   **Impact**: Controls the brightness and tone color of the sound. Low cutoff = dark, muffled; High cutoff = bright, open.
*   **Typical Range**: 30-150 (logarithmic frequency scale)
*   **Statistical Distribution**:
    *   Filter1: Average ~83, with most presets between 50-110
    *   Filter2: Average ~105 (typically more open than Filter1)
*   **Sound Design Context**: Cutoff position is THE primary timbre control. A 20-point change can dramatically alter character.

#### Filter Resonance (Filter1/Res, Filter2/Res)
*   **Impact**: Emphasizes frequencies at the cutoff point. Creates peaky, hollow, metallic, or "screaming" tones.
*   **Typical Range**: 0-120
*   **Statistical Distribution**: Average ~26 for Filter1, but highly variable (0-100)
    *   Low res (0-20): Natural, smooth filtering
    *   Medium res (20-50): Character and presence
    *   High res (50-100+): Pronounced resonance, self-oscillation possible
*   **Sound Design Context**: Resonance adds character and "voice" to sounds. Combined with envelope modulation, it creates the "wah" and "sweep" effects characteristic of analog synthesis.

#### Filter Envelope Amount (Filter1/Env, Filter2/Env)
*   **Impact**: Bipolar control (-120 to +120) determining how much the modulation envelope affects cutoff.
*   **Statistical Distribution**: Average ~34 for Filter1, with wide bipolar usage
    *   Positive values: Cutoff sweeps upward (bright attack, darker sustain) - MOST COMMON
    *   Negative values: Cutoff sweeps downward (darker attack, brighter sustain)
    *   Zero: Static filter (no envelope movement)
*   **Sound Design Context**: **This is where filters come alive.** Envelope modulation of cutoff creates the evolving, dynamic timbres that define most synthesizer sounds. Without envelope modulation, sounds feel static and lifeless.

#### Why Filters Are Critical
1.  **Frequency Domain Dominance**: Filters directly shape the frequency spectrum, the most perceptually significant aspect of timbre.
2.  **Temporal Evolution**: Filter envelope modulation creates movement over time, essential for expressive sounds.
3.  **Interaction with Resonance**: The cutoff-resonance relationship creates non-linear harmonic emphasis.
4.  **Modulation Destination Priority**: In the modulation matrix, filter parameters (especially Filter1:Cutoff, Filter1:Res) are the MOST COMMON destinations.

### 2.2. Secondary Critical Parameters

#### Oscillator Volume & Mix (Osc1/Volume, Osc2/Volume, SubVol)
*   **Impact**: Determines the balance between synthesis layers
*   **Typical Usage**: Most presets use OSC1 (99% enable rate), with OSC2 layered for thickness (40% enable rate)

#### Oscillator Waveform & Wavetable Position (Osc1/Wave, Osc1/WtAPos)
*   **Impact**: Determines the harmonic content of the raw oscillator
*   **Context**: Important, but filters shape the final timbre more dramatically

#### Amplitude Envelopes (AmpEnv1, AmpEnv2)
*   **Impact**: Controls volume contour (attack, decay, sustain, release)
*   **Context**: Defines temporal envelope but doesn't shape timbre as significantly as filter envelopes

#### Modulation Depth & Routing (MM1-MM12)
*   **Impact**: Creates movement and expression
*   **Critical Observation**: ~99% of presets use MM1-MM3 actively, with filter parameters as primary destinations

### 2.3. Parameter Interaction Principles

1.  **Filter Cutoff ↔ Resonance**: High resonance amplifies the cutoff frequency. Moving cutoff with high resonance creates dramatic tonal sweeps.
2.  **Filter Cutoff ↔ Envelope Amount**: Large envelope amounts require appropriate cutoff starting points. High env amount with low cutoff = dramatic sweep from dark to bright.
3.  **Filter Type ↔ Resonance**: Different filter types (LP, BP, HP) respond differently to resonance. Ladder filters (Normal/Dirty engine) self-oscillate more readily.
4.  **Engine Mode ↔ Filter Character**: Engine setting (Clean/Normal/Dirty) fundamentally changes filter behavior and resonance response.

## 3. `.h2p` Preset File Structure

A `.h2p` file is a human-readable text file composed of three main parts:

### 3.1. Metadata Block

The file begins with a multi-line comment block `/*@Meta ... */` containing descriptive metadata for the preset browser.

*   `Bank`: The soundset or collection the preset belongs to.
*   `Author`: The creator of the preset.
*   `Description`: A brief description of the sound.
*   `Usage`: Performance notes, such as what the ModWheel (MW) or Aftertouch (AT) controls.
*   `Categories`: Comma-separated tags describing the sound's category (e.g., `Bass:Analogue`, `Pads:Strings`).
*   `Features`: Comma-separated tags describing technical characteristics (e.g., `Mono`, `BPM`, `Poly`).
*   `Character`: Comma-separated tags describing the sonic character (e.g., `Bright`, `Dark`, `Moving`, `Dirty`).

### 3.2. Header and Source/Target Definitions

This section defines the synth version and provides a crucial index for modulation sources. Each source is given an integer ID.

*   `#AM=Hive`: Identifies the file as a Hive preset.
*   `#Vers=200`: Indicates Hive version 2.
*   `#ms=...`: A list mapping modulation source names (e.g., `ModWhl`, `Pressure`, `LFO 1`) to an integer index, starting from 0. This index is used in the modulation matrix sections (`#cm=MM...`).

### 3.3. Component Modules (`#cm=...`)

The bulk of the file consists of parameter definitions grouped into "component" modules, each starting with a `#cm=` identifier. These modules directly correspond to the sections of the synthesizer's user interface. Parameters within each module are simple key-value pairs.

---

## 4. Module & Parameter Reference

This section maps the parameters found in the `.h2p` file to their functions as described in the user manual.

### 4.1. Global Settings

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

### 4.2. Oscillators (OSC1 & OSC2)

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

### 4.3. Filters (FILTER1 & FILTER2)

**⚠️ CRITICAL SECTION: Filters are the most important sound-shaping parameters in Hive. See Section 2.1 for detailed sonic importance.**

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

**CRITICAL PARAMETERS:**

*   `Cutoff`: (Float `0.00` - `150.00`) **THE PRIMARY TIMBRE CONTROL.** The filter's cutoff frequency on a logarithmic scale.
    *   **Statistical Reality**: Filter1 avg ~83 (range 30-150), Filter2 avg ~105
    *   **Sonic Impact**: Controls brightness. Small changes (10-20 points) dramatically alter tone color.
    *   **Typical Usage**: Most bass sounds: 50-80, Most leads: 70-100, Pads: 60-90, Bright sounds: 100-150

*   `Res`: (Float `0.00` - `120.00`) **CRITICAL FOR CHARACTER.** The filter's resonance amount.
    *   **Statistical Reality**: Avg ~26 but HIGHLY variable (full 0-100 range used)
    *   **Sonic Impact**:
        *   0-20: Natural, transparent filtering
        *   20-50: Adds presence and character
        *   50-80: Pronounced resonance peak, "wah" quality
        *   80-120: Aggressive, self-oscillating, screaming tones
    *   **Interaction**: Resonance dramatically amplifies frequencies at cutoff point. Movement of cutoff with high res creates sweeps.

*   `Key`: (Float `0.00` - `100.00`) Key tracking amount (how the cutoff follows pitch).
    *   **Typical Usage**: 0-30 for pads/FX, 50-100 for leads/keys to maintain brightness across register

*   `Env`: (Float `-100.00` - `120.00`) **WHERE FILTERS COME ALIVE.** Bipolar modulation amount from the assigned modulation envelope.
    *   **Statistical Reality**: Avg ~34 with wide bipolar usage (-120 to +120)
    *   **Sonic Impact**:
        *   Positive (most common): Bright attack → darker sustain (classic synth sweep)
        *   Negative: Dark attack → brighter sustain (reverse sweep, uncommon but effective)
        *   Zero: Static filter (lifeless, avoid for expressive sounds)
    *   **Critical Interaction**: Large Env amounts require careful Cutoff positioning. Example: Env=80 with Cutoff=40 sweeps from dark to very bright.

*   `EnvNo`: (Integer `0`, `1`) Selects which MOD envelope (`0`=MOD1, `1`=MOD2) modulates the cutoff.
*   `Volume`: (Float `0.00` - `100.00`) The output level of the filter.

---

### 4.4. Envelopes (AMP & MOD)

Hive has four ADSR envelopes. Their parameters are defined in `#cm=AmpEnv1`, `#cm=AmpEnv2`, `#cm=ModEnv1`, `#cm=ModEnv2`.

**Note**: MOD envelopes (ModEnv1, ModEnv2) are primarily used to modulate filter cutoff (via the Filter Env parameter). These are CRITICAL for creating dynamic, evolving timbres.

*   `Atk`: (Float `0.00` - `100.00`) Attack time.
*   `Dec`: (Float `0.00` - `100.00`) Decay time.
*   `Sus`: (Float `0.00` - `100.00`) Sustain level.
*   `Rel`: (Float `0.00` - `100.00`) Release time.
*   `Vel`: (Float `0.00` - `100.00`) Velocity sensitivity, affecting the envelope's overall output level.
*   `Trig`: (Integer) Triggering mode. `0` = Gate, `1` = One Shot.

---

### 4.5. Low-Frequency Oscillators (LFOs)

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

### 4.6. Sequencer & Arpeggiator

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

### 4.7. Effects (`#cm=FX...`)

The effects chain order and on/off state is in `#cm=FXGrid`. Individual effect parameters are in their own modules.

*   **`#cm=Distort`**: `Type`, `Amount`, `Tone`, `Mix`.
*   **`#cm=Chorus`**: `Type`, `Rate`, `Depth`, `Wet`.
*   **`#cm=Delay`**: `Mode`, `LDelay`, `RDelay` (time divisions), `FeedBck`, `Mix`.
*   **`#cm=Reverb`**: `Pre` (pre-delay), `Decay`, `Size`, `Damp`, `Mix`.
*   **`#cm=Comp`** (Compressor): `Amount`, `Attack`, `Release`, `Output`.
*   **`#cm=EQ`**: `BassG`/`BassF`, `MidG`/`MidF`, `HighG`/`HighF` (Gain and Frequency for each band).
*   **`#cm=Phaser`**: `Type`, `Rate`, `FB` (feedback), `Wet`.

---

### 4.8. Modulation Matrix (`#cm=MM...`)

**⚠️ CRITICAL FOR SOUND DYNAMICS: The modulation matrix brings presets to life by creating movement and expression.**

Hive has 12 modulation slots, defined in `#cm=MM1` through `#cm=MM12`. Statistical analysis shows:
*   **~99% of presets use MM1-MM3 actively**
*   **Filter parameters (Filter1:Cutoff, Filter1:Res, Filter2:Cutoff, Filter2:Env) are the MOST COMMON modulation destinations**
*   Typical modulation sources: Envelopes (ModEnv1, ModEnv2), LFOs (LFO1, LFO2), Velocity, ModWheel

*   `Active`: (Boolean `0`, `1`) Toggles the slot on/off.

*   `Source`: (Integer) The primary modulation source. The integer maps to the `#ms=` list in the header. For example, if `#ms=ModWhl` is the second entry (index 1), then `Source=1` means the Mod Wheel is the source.
    *   **Common Sources**: Velocity (16), ModEnv1 (24), LFO1 (29), LFO2 (30), ModWheel (1)

*   `Via`: (Integer) An optional secondary source that controls the *depth* of the primary source. Also maps to the `#ms=` list.
    *   **Usage**: Often used for performance control (Via=Velocity or Via=ModWheel) to make modulation responsive

*   `Dest1`, `Dest2`: (String) The modulation target parameters. These are represented as human-readable strings.
    *   **MOST COMMON DESTINATIONS** (in order of frequency):
        1.  `Filter1:Cutoff` - Creates filter sweeps and timbral movement
        2.  `Filter1:Res` - Modulates resonance for dynamic character
        3.  `Filter2:Cutoff` - Secondary filter movement
        4.  `Filter1:Env` - Meta-modulation of filter envelope amount
        5.  `Osc1:Volume`, `Osc2:Volume` - Amplitude modulation
        6.  `Osc1:Tune`, `Osc2:Tune` - Vibrato and pitch effects
    *   **Sound Design Tip**: Routing LFO → Filter1:Cutoff creates classic "wobble" and sweeping effects

*   `Depth1`, `Depth2`: (Float `-100.00` - `100.00`) Bipolar modulation depth for each target.
    *   **Statistical Reality**: Average depths ~20-25, but full bipolar range (-100 to +100) is actively used
    *   **Sonic Impact**: Depth controls modulation intensity. Small depths (10-30) = subtle movement. Large depths (60-100) = dramatic effects

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

---

## 5. Practical Guidance for LLMs: Analyzing and Generating Hive Presets

This section provides actionable guidance for LLMs working with Hive presets.

### 5.1. When Analyzing a Preset

**Priority order for understanding sonic character:**

1.  **Filter Section First**: Examine Filter1 and Filter2 parameters:
    *   What are the Cutoff values? (brightness)
    *   What are the Res values? (character/resonance)
    *   What are the Env amounts? (movement/dynamics)
    *   What Type are the filters? (LP, HP, BP, etc.)

2.  **Modulation Matrix Second**: Check MM1-MM3 for active modulations:
    *   Are filters being modulated? (most important)
    *   What are the modulation sources and depths?
    *   Is there LFO → Filter:Cutoff routing? (creates wobble/sweep)

3.  **Envelopes Third**: Examine MOD envelopes (ModEnv1, ModEnv2):
    *   What are the ADSR shapes? (fast attack = plucky, slow attack = pad-like)
    *   Which envelope is assigned to filter modulation? (via Filter/EnvNo)

4.  **Oscillators Fourth**: Check oscillator settings:
    *   What waveforms/wavetables are selected?
    *   Are both OSC1 and OSC2 active?
    *   What's the mix balance?

5.  **Effects Last**: Effects add polish but don't define core timbre

### 5.2. When Generating/Modifying Presets

**Critical rules based on statistical analysis:**

1.  **Always Consider Filter Impact**:
    *   A preset with Cutoff=80, Res=30, Env=40 will sound VERY different from Cutoff=120, Res=5, Env=0
    *   Small filter changes = big sonic differences

2.  **Don't Create Static Sounds**:
    *   Avoid Filter Env=0 unless specifically creating static tones
    *   Use modulation matrix for movement (MM1-MM3 should usually be active)
    *   Target filter parameters in modulation routing

3.  **Typical Parameter Ranges for Common Sounds**:
    *   **Bass**: Filter1 Cutoff=50-80, Res=20-40, Env=30-60 (positive)
    *   **Lead**: Filter1 Cutoff=70-100, Res=25-50, Env=40-80 (positive), often with LFO → Cutoff
    *   **Pad**: Filter1 Cutoff=60-90, Res=10-30, Env=20-40, slow attack on AmpEnv
    *   **Pluck**: Filter1 Cutoff=60-100, Res=20-50, Env=60-100 (positive), fast decay on ModEnv

4.  **Modulation Best Practices**:
    *   MM1: Often envelope → filter cutoff (most expressive)
    *   MM2: Often LFO → filter or pitch (adds movement)
    *   MM3: Often velocity → filter or volume (performance responsiveness)

5.  **Filter Cutoff-Envelope Interaction**:
    *   High Env amount requires lower starting Cutoff (so there's room to sweep up)
    *   Example: Env=80, Cutoff=50 = dramatic sweep from dark to bright
    *   Example: Env=80, Cutoff=120 = already bright, sweep goes beyond useful range

### 5.3. Common Preset Archetypes

**Understanding these patterns helps generate musically useful presets:**

1.  **Classic Analog Bass**:
    *   Filter1: Type=1 (LP24), Cutoff=60-75, Res=25-35, Env=40-60
    *   ModEnv1: Fast attack (0-5), Medium decay (30-50), Low sustain (10-30)
    *   OSC1: Sawtooth (Wave=1), Unison=2-4 for thickness
    *   Engine: Normal (for analog character)

2.  **Sweeping Lead**:
    *   Filter1: Type=1 (LP24), Cutoff=70-90, Res=30-50, Env=50-80
    *   MM1: ModEnv1 → Filter1:Cutoff, Depth=60-100
    *   MM2: LFO1 → Filter1:Cutoff, Depth=20-40 (wobble)
    *   ModEnv1: Medium attack (20-40), Medium decay (40-60)

3.  **Evolving Pad**:
    *   Filter1: Type=1 (LP24), Cutoff=65-85, Res=15-25, Env=30-50
    *   AmpEnv1: Slow attack (50-80), Long release (60-90)
    *   MM1: LFO1 → Filter1:Cutoff, Depth=15-30 (slow rate)
    *   Effects: Reverb, Chorus

4.  **Aggressive Wobble Bass**:
    *   Filter1: Type=1 (LP24), Cutoff=40-60, Res=60-90 (high!)
    *   MM1: LFO1 → Filter1:Cutoff, Depth=80-100
    *   LFO1: Sync to tempo, moderate rate (1/8 or 1/16)
    *   Engine: Dirty (for aggressive character)

### 5.4. Key Takeaways

**If you remember only three things about Hive presets:**

1.  **Filters define timbre** - Cutoff, Resonance, and Envelope modulation are the most sonically significant parameters
2.  **Movement is essential** - Static filter = lifeless sound; use envelopes and modulation matrix
3.  **Filter parameters are the primary modulation targets** - Most expressive presets route modulation sources to filter cutoff and resonance

---

**Document Version**: Enhanced with statistical analysis of 4,400+ Hive factory presets (January 2025)
