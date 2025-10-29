# u-he Repro-5 Preset File Analysis for LLM Context

## 1. Introduction

This document provides a detailed breakdown of the `.txt` preset file format for the u-he Repro-5 software synthesizer. Its purpose is to serve as a technical guide for a Large Language Model (LLM) to understand the synth's architecture and how its parameters are stored. This will enable the LLM to read, interpret, modify, and generate valid Repro-5 preset files.

Repro-5 is a component-modeled emulation of a classic 5-voice polyphonic analog synthesizer. Its architecture consists of two oscillators, a mixer, a resonant low-pass filter, two ADSR envelopes (one for the filter, one for the amplifier), a global LFO, and a flexible modulation system, followed by a chain of five stereo effects.

## 2. Sound Design Hierarchy - Critical Parameters

When analyzing Repro-5 presets, understand that certain parameters have disproportionate impact on the final sound:

### 2.1. PRIMARY Sound Shapers (Most Critical)

1. **Filter Cutoff & Resonance** - THE most important timbral controls
   - Cutoff (avg: 32.4, range: 0-100): Determines brightness and harmonic content
   - Resonance (avg: 20.5, range: 0-100): Adds emphasis at cutoff frequency, can self-oscillate at high values
   - These two parameters alone define the fundamental character of most presets

2. **Filter Envelope Modulation** - Shapes the sound over time
   - EnvAmt (avg: 37.7, range: 0-100): Controls how much the filter envelope affects cutoff
   - Filter Envelope ADSR creates the dynamic movement in the sound
   - This is what makes a sound "plucky", "sweeping", or "static"

3. **Filter Keyboard Tracking** - Makes the filter respond to pitch
   - KeyAmt (avg: 47.8, range: 0-100): Higher values make bright notes brighter, dark notes darker
   - Critical for maintaining timbral balance across the keyboard

### 2.2. SECONDARY Sound Shapers

4. **Oscillator Mix & Tuning** - Basic harmonic content
   - Oscillator waveforms (Saw, Rect, Tri) and their mix ratios
   - Detuning between oscillators creates thickness

5. **Amplifier Envelope** - Overall volume contour
   - Shapes attack, sustain, and release of the sound

6. **Modulation Routing to Filter** - Additional movement
   - VMod (22.6% of presets): Voice modulation to filter
   - GMod (36.9% of presets): Global/wheel modulation to filter
   - Modulation Matrix routing to Filter:Cutoff or Filter:Reso

### 2.3. Preset Analysis Priority

When analyzing a preset, examine in this order:
1. **Filter section first** (Cutoff, Reso, KeyAmt, EnvAmt, modulation sources)
2. Filter Envelope (how it modulates the filter)
3. Oscillator configuration (waveforms, tuning, mix)
4. Amplifier Envelope (overall shape)
5. Modulation routing (especially to filter parameters)
6. Effects chain (color and space)

## 3. Preset File Structure

A Repro-5 preset file is a plain text file with a specific structure. It contains three main parts:

### 3.1. Metadata Block (`/*@Meta ... */`)

This block contains human-readable information about the preset, used for categorization within preset browsers.

```
/*@Meta

Bank: 'Repro-5 Generated'
Author: 'Simon Heimler'
Description: 'Generated on 2024-06-30 06:58:33...'
Usage: 'Unstable feedback-like. Needs careful playing...'
Categories: 'Keys:Keys'
Features: 'Modulated'
Character: 'Dirty'

*/
```

*   **`Bank`, `Author`, `Description`, `Usage`**: String values for organizational purposes.
*   **`Categories`**: Describes the preset's instrument type. Follows a `Main:Sub` format (e.g., `Bass:Analogue`, `Keys:Plucks`).
*   **`Features`**: Technical classifications (e.g., `Modulated`, `Poly`).
*   **`Character`**: Sonic character tags (e.g., `Bright`, `Dark`, `Dirty`).

### 3.2. Parameter Blocks (`#cm=...`)

This is the core of the preset. All synthesis and effect parameters are defined here. Each block represents a specific module or section of the synthesizer.

*   The format is `#cm=[ModuleName]` followed by `Key=Value` pairs on new lines.
*   For example, `#cm=OscA` contains all parameters for Oscillator A.

### 3.3. Compressed Binary Data (`$$$$...`)

The file ends with a block of seemingly random characters, starting with `$$$$`.

```
// Section for ugly compressed binary Data
// DON'T TOUCH THIS

$$$$6784
?gdgceneb:ajbbaiaa:eaaaaaaa:apaaaaaa:aaabaaaa:aeaaaaaa:aaaaiadp:
...
```

**Crucial Instruction for LLM**: This section contains non-human-readable, compressed data. It should **NEVER** be modified or generated. When creating or editing a preset, this entire block should be treated as opaque and preserved as-is from a source file, or omitted if generating from scratch (though this may result in an incomplete preset).

## 4. Detailed Parameter Reference

This section maps the parameters found in the preset files to their functions as described in the Repro-5 User Guide.

**IMPORTANT**: Parameters are listed alphabetically by module, but remember the sound design hierarchy from Section 2 - always prioritize filter parameters when analyzing presets.

---

### **`#cm=main` - Main Settings**

*   `CcOp=100.00`: Corresponds to the main **OUTPUT** knob on the GUI. A value of `100.00` is the default 100% volume.

---

### **`#cm=LFO` - Low Frequency Oscillator**

(Manual Ref: Page 26)

*   `Mode=0`: Controls **HOST SYNC**. `0` = Off (rate is in Hz), `1` = On (rate is synced to tempo).
*   `Freq=57.00`: The LFO **RATE**. The range and unit depend on `Mode`.
*   `Sqre=0`, `Triang=1`, `Saw=0`: Toggles for the LFO **SHAPE**. `1` = On, `0` = Off. Multiple shapes can be active simultaneously.
*   `InvSaw=0`: Inverts the sawtooth waveform. (TWEAKS Page, Ref: p. 31)
*   `NoDC=0`: LFO DC/NO DC jumper. `0` = DC (unipolar square/saw), `1` = NO DC (bipolar square/saw). (TWEAKS Page, Ref: p. 31)

---

### **`#cm=GMod` - Wheel Mod Section**

(Manual Ref: Page 26) This corresponds to the **WHEEL MOD** panel.

*   `SrcMix=0.00`: **SOURCE MIX** knob, blending between LFO (`0.00`) and Noise (`100.00`).
*   `LowLim=3.00`, `UppLim=3.00`: Sets the lower and upper modulation limits, controlled by the small triangles next to the virtual mod wheel. (Ref: p. 7)
*   `NoiseSH=0`: Toggles the type of noise used in the source mix. `0` = Pink Noise, `1` = Sample & Hold. (TWEAKS Page, Ref: p. 31)

---

### **`#cm=Voice` - Voice Configuration**

*   `NVoices=8`: Sets the maximum number of voices (**VOICES** setting). (Ref: p. 6)
*   `MCAct=1`: Activates the **MCORE** (multicore) button. `1` = On, `0` = Off.

---

### **`#cm=Logic1` & `#cm=Logic2` - Voice Behavior**

(Manual Ref: TWEAKS Page, p. 32)

*   `ReAlloc=1`: **POLY VOICE / REALLOCATE** jumper. `1` = ON (same note triggers same voice), `0` = OFF (round-robin).
*   `Prio=1`: **UNISON / NOTE PRIO** jumper. Sets note priority (`0`=Low, `1`=High, `2`=Last).

---

### **`#cm=Glide`**

(Manual Ref: Page 22)

*   `Amt=0.00`: The amount of portamento/slur between notes when Unison is active.

---

### **`#cm=OscA` & `#cm=OscB` - Oscillators**

(Manual Ref: Pages 20-21)

*   `Oct=3`: **OCTAVE** switch for the oscillator.
*   `Freq=0.00`: **FREQUENCY** knob, for coarse tuning (+/- 12 semitones).
*   `Fine=0.20`: Fine-tunes the oscillator pitch (+/- 20 cents).
*   `SawOn=1`, `RectOn=1`, `TriOn=1`: Waveform **SHAPE** selection buttons. `1` = On, `0` = Off. `TriOn` is only available for Osc B.
*   `PWidth=50.00`: **PULSE WIDTH** knob.
*   `Sync=0`: **SYNC** button (only on Osc A). Forces Osc A's waveform to reset with Osc B's.
*   `LowFrq=1`: **LO FREQ** button (only on Osc B). Turns the oscillator into an LFO.
*   `KPitch=0`: **KYBD** button (only on Osc B). `1` enables keyboard tracking, `0` disables it (pitch is constant).
*   `VModFM=0`, `VModPWM=1`: Destinations for the **VOICE MOD** section. `1` enables modulation of Frequency (FM) or Pulse Width (PWM) by the amount set in `#cm=VMod`.
*   `GModFM=1`, `GModPWM=0`: Destinations for the **WHEEL MOD** section. `1` enables modulation from the global mod wheel source mix.

---

### **`#cm=MIX` - Mixer**

(Manual Ref: Page 22)

*   `OscA=61.00`, `OscB=59.50`, `Noise=0.00`: Volume levels for each sound source.
*   `NoiFB=0`: Selects the function of the Noise knob. `0` = **NOISE**, `1` = **FEEDBACK**. (TWEAKS Page, Ref: p. 32)

---

### **`#cm=Filter` - Filter (⚠️ MOST CRITICAL MODULE)**

(Manual Ref: Page 23)

**The filter is the single most important sound-shaping module in Repro-5.** These parameters define the fundamental character and evolution of the sound more than any other section.

#### Core Filter Parameters (HIGHEST PRIORITY)

*   **`Cutoff`** (avg: 32.4, range: 0-100): Filter **CUTOFF** frequency - the primary timbral control
    - Low values (0-30): Dark, muffled, bass-heavy sounds
    - Mid values (30-60): Balanced, warm character (most common)
    - High values (60-100): Bright, harsh, opens up harmonics
    - Example: `Cutoff=57.00`

*   **`Reso`** (avg: 20.5, range: 0-100): Filter **RESONANCE** - emphasis at the cutoff frequency
    - Low values (0-30): Subtle emphasis, natural sound (most common)
    - Mid values (30-60): Pronounced "wah" character
    - High values (60-100): Self-oscillation, screaming resonance, adds tuned overtone
    - Example: `Reso=40.50`

#### Filter Modulation (VERY HIGH PRIORITY)

*   **`EnvAmt`** (avg: 37.7, range: 0-100, can be negative): **ENVELOPE AMOUNT** - how much the filter envelope modulates the cutoff
    - Positive values: Filter opens over time (sweeps upward)
    - Negative values: Filter closes over time (sweeps downward)
    - Zero: Static filter (no envelope modulation)
    - This parameter creates the "movement" and "animation" in a sound
    - Example: `EnvAmt=27.00`

*   **`KeyAmt`** (avg: 47.8, range: 0-100): **KEYBOARD AMOUNT** - how much the filter cutoff tracks keyboard pitch
    - Low values (0-30): Filter stays static across keyboard, darker in high notes
    - Mid values (30-60): Moderate tracking (typical for many sounds)
    - High values (60-100): Strong tracking, maintains brightness across keyboard
    - Essential for keeping timbral balance across the range
    - Example: `KeyAmt=28.00`

#### Additional Modulation Sources

*   **`VMod`** (22.6% of presets use this): Toggle for **VOICE MOD** section modulating filter cutoff
    - `0` = Off, `1` = On
    - When active, allows per-voice modulation from sources like velocity, envelopes, etc.

*   **`GMod`** (36.9% of presets use this): Toggle for **WHEEL MOD** section modulating filter cutoff
    - `0` = Off, `1` = On
    - When active, allows global modulation (LFO, mod wheel, noise) to affect filter

#### Advanced Filter Settings

*   **`EnvPol`** (rarely used - 2.9% of presets): Filter envelope polarity
    - `0` = Positive (`+`) - standard behavior
    - `1` = Inverted (`-`) - envelope works in reverse
    - (TWEAKS Page, Ref: p. 32)

*   **`KTSrc`** (91% use Key+PitchBend): Filter key tracking source
    - `0` = Key only
    - `1` = Key + PitchBend (most common)
    - (TWEAKS Page, Ref: p. 32)

#### Filter Analysis Guidelines

When analyzing a preset's filter:
1. Check Cutoff and Reso first - these define the base timbre
2. Check EnvAmt - does the filter sweep? How much?
3. Check Filter Envelope (FEnv section) - what's the shape of the sweep?
4. Check KeyAmt - does brightness change across the keyboard?
5. Check VMod/GMod - are there additional modulation sources?
6. Look at Modulation Matrix - is anything else modulating Filter:Cutoff or Filter:Reso?

---

### **`#cm=FEnv` - Filter Envelope (⚠️ CRITICAL for Filter Modulation)**

(Manual Ref: Pages 23-24)

**The Filter Envelope shapes how the filter cutoff changes over time.** When Filter:EnvAmt is non-zero, this envelope is applied to the filter cutoff, creating the characteristic "sweep" of analog synth sounds.

*   **`Atk`** (avg: 30.9, range: 0-100): **ATTACK** time - how quickly filter opens after note-on
    - Short (0-20): Immediate, percussive filter opening (plucks, hits)
    - Medium (20-50): Moderate sweep (pads, evolving sounds)
    - Long (50-100): Slow bloom (atmospheric, swells)
    - Example: `Atk=6.50`

*   **`Dec`** (avg: 61.6, range: 0-100): **DECAY** time - how quickly filter moves from peak to sustain
    - Short: Snappy, quick return to sustain brightness
    - Long: Gradual fade of the filter sweep
    - Example: `Dec=63.75`

*   **`Sus`** (avg: 34.3, range: 0-100): **SUSTAIN** level - held filter brightness while note is held
    - Low (0-30): Filter closes significantly after attack (common for plucks)
    - High (60-100): Filter stays mostly open (pads, sustained sounds)
    - Example: `Sus=100.00`

*   **`Rel`** (avg: 57.4, range: 0-100): **RELEASE** time - how quickly filter closes after note-off
    - Short: Immediate cutoff
    - Long: Extended tail with changing brightness
    - Example: `Rel=22.72`

*   **`VelDep`** (avg: 35.4, range: 0-100): **Velocity** modulation amount of the envelope
    - Controls how much key velocity affects the envelope intensity
    - High values make the filter more responsive to playing dynamics
    - Example: `VelDep=84.50`

**Analysis Tip**: The Filter Envelope only matters when Filter:EnvAmt is non-zero. The EnvAmt sets the intensity, while this envelope sets the shape.

### **`#cm=AEnv` - Amplifier Envelope**

(Manual Ref: Pages 23-24)

Controls the overall volume contour of the sound. Same parameters as Filter Envelope:

*   **`Atk`** (avg: 27.4, range: 0-97): **ATTACK** time
*   **`Dec`** (avg: 61.7, range: 0-100): **DECAY** time
*   **`Sus`** (avg: 57.3, range: 0-100): **SUSTAIN** level
*   **`Rel`** (avg: 56.7, range: 0-100): **RELEASE** time
*   **`VelDep`** (avg: 21.5, range: 0-100): Velocity modulation amount (**VEL** trimmer)

**Note**: While the Amplifier Envelope is important for overall dynamics, the Filter Envelope has more impact on the perceived character and evolution of the sound.

---

### **`#cm=...IC` - Integrated Circuit (Tweaks)**

These blocks represent the "Tweak" selectors that change the underlying component models. (Manual Ref: pp. 32-33)

*   `#cm=OscAIC`, `#cm=OscBIC`: `Chip=...` defines the **Oscillator Tweak** (e.g., 0=P5, 1=P1, 2=Ideal).
*   `#cm=FltrIC`: `Chip=...` defines the **Filter Tweak** (e.g., 0=Crispy, 1=Rounded, 2=Driven, 3=Poly).
*   `#cm=FEnvIC`, `#cm=AEnvIC`: `Chip=...` defines the **Envelope Tweak** (e.g., 0=Ideal, 1=Analog).

---

### **`#cm=MM1` to `#cm=MM4` - Modulation Matrix**

(Manual Ref: Pages 27-30)

The Modulation Matrix provides flexible routing of modulation sources to destinations. These slots are especially important when routing to **Filter:Cutoff** or **Filter:Reso** for additional timbral movement.

**Each matrix slot (MM1-MM4) represents one modulation routing:**

*   **`Source`**: The modulation source, selected by index mapping to the `#ms` list at the top of the file
    - Common sources: `1`=ModWhl, `6`=LFO, `10`=Velocity, `11`=Pressure, `14`=Filter Envelope, `15`=Amp Envelope
    - Example: `Source=11` (Pressure)

*   **`Dest1`**: The modulation destination, specified as `Module:Parameter` string
    - **CRITICAL DESTINATIONS**: `Filter:Cutoff`, `Filter:Reso` (adds dynamic filter movement)
    - Other common: `LFO:Freq`, `OscA:PWidth`, `OscB:Freq`, effect parameters
    - Example: `Dest1=Filter:Cutoff`

*   **`Depth1`**: The modulation amount (can be positive or negative)
    - Positive: Increases the destination parameter
    - Negative: Decreases the destination parameter
    - Range typically -100 to +100
    - Example: `Depth1=22.00`

*   **Slot Modifiers** (Advanced - shape the modulation signal):
    - `Curve1`: Modulation curve shape (0-4, where 2=linear)
    - `Rect1`: Rectification (0-5)
    - `Qntze1`: Quantization (0-20)
    - `SH1`: Sample & Hold (0 or 8)
    - `Slew1`: Slew Limiter (0-3)
    - (See manual p. 29-30 for details)

**Filter Modulation Priority**: When analyzing modulation routing, **prioritize checking for destinations to Filter:Cutoff and Filter:Reso** as these have the most dramatic impact on sound character. Common examples:
- LFO → Filter:Cutoff (creates vibrato-like timbral movement)
- Velocity → Filter:Cutoff (brighter when played harder)
- ModWheel → Filter:Reso (performance control of resonance)

---

### **`#cm=FXGrid` - Effects Chain**

(Manual Ref: Page 35)

*   `Grid=10`: A bitmask representing the on/off state of the five main effects in the chain.
*   `GByp=0`: The global effects bypass button (`1` = Bypassed/Dry, `0` = Active/Wet).

Below are the parameter blocks for each individual effect.

### **`#cm=Dist` - Distortion** (Ref: p. 34)
*   `Type=2`: Selects the distortion algorithm (e.g., 0=Soft Clip, 1=Hard Clip, 2=Foldback, 3=Corrode).
*   `Amount=9.00`: Input gain or, in Corrode mode, **RATE**.
*   `Tone=50.00`: Tone control or, in Corrode mode, **CRUSH**.
*   `Mix=100.00`: Dry/Wet mix balance.

### **`#cm=Velvet` - Tape Saturation** (Ref: p. 36)
*   `ingain=20.00`: **INPUT GAIN**, controls the amount of saturation.
*   `hssmute=0`: **HISS MUTE** button. `1`=On.

### **`#cm=Lyrebrd` - Lyrebird Delay** (Ref: p. 37)
*   `Sync=0`: **Sync** selector (Chorus, Unsync, Sync 1/16, etc.).
*   `Flave=0`: **Flavour** selector (Clean, Bright, Dark).
*   `Mode=1`: **MODE** switch (Echo, Pingpong, Swing, Groove).
*   `Mod=1`: **MODULATION** switch (Off, Min, Med, Max).
*   `Time=2.14`: **TIME** knob.
*   `Regen=0.00`: **REGEN** knob (feedback).
*   `Mix=22.50`: **MIX** knob (Dry/Wet).

### **`#cm=ResQ` - Resonator / Equalizer** (Ref: p. 38)
*   `Mode=1`: Switches between **RES** (`1`) and **EQ** (`0`) modes.
*   `BassF`, `MidF`, `HighF`: **FREQUENCY** knobs for the three bands.
*   `BassG`, `MidG`, `HighG`: **GAIN** knobs (in EQ mode).
*   `BassVol`, `MidVol`, `HighVol`: **VOLUME** knobs (in RES mode).
*   `Q/Res=18.00`: **Q / RES** knob.

### **`#cm=Drench` - Reverb** (Ref: p. 39)
*   `Pre=44.00`: **PRE DELAY** time.
*   `Decay=0.00`: **DECAY** time (reverb tail length).
*   `Tone=-50.00`: **TONE** control (tilt filter).
*   `Mix=20.00`: **DRY/WET** knob.

### **`#cm=SoniCon` - Sonic Conditioner** (Ref: p. 40)
*   `Gain=6.00`: **GAIN** knob (output level/saturation).
*   `Trans=0.00`: **TRANSIENT** knob (adds or reduces punch).
*   `Width=100.00`: **WIDTH** knob (stereo spread).

---

## 5. Practical Preset Analysis Examples

This section demonstrates how to analyze Repro-5 presets following the sound design hierarchy.

### Example 1: Classic Analog Bass

```
#cm=Filter
Cutoff=24.00
Reso=35.00
KeyAmt=28.00
EnvAmt=45.00
VMod=0
GMod=0

#cm=FEnv
Atk=0.00
Dec=35.00
Sus=5.00
Rel=15.00
```

**Analysis (Filter-First Approach):**
1. **Filter Cutoff (24)**: Low cutoff = dark, bass-heavy sound ✓
2. **Filter Reso (35)**: Moderate resonance adds "punch" and character ✓
3. **Filter EnvAmt (45)**: Significant positive envelope modulation = filter opens then closes
4. **Filter Envelope**: Fast attack (0), medium decay (35), low sustain (5) = classic "pluck" envelope
5. **Result**: A punchy analog bass with a percussive filter sweep that adds attack transient

**Key Insight**: The combination of low Cutoff + moderate Reso + fast attack filter envelope creates the characteristic analog bass "thump."

### Example 2: Evolving Pad

```
#cm=Filter
Cutoff=55.00
Reso=12.00
KeyAmt=65.00
EnvAmt=25.00
VMod=0
GMod=1

#cm=FEnv
Atk=45.00
Dec=60.00
Sus=75.00
Rel=80.00

#cm=GMod
SrcMix=0.00
LowLim=3.00
UppLim=43.52

#cm=MM1
Source=6
Dest1=Filter:Cutoff
Depth1=18.00
```

**Analysis (Filter-First Approach):**
1. **Filter Cutoff (55)**: Mid-range cutoff = balanced starting brightness
2. **Filter Reso (12)**: Low resonance = smooth, natural sound (good for pads)
3. **Filter EnvAmt (25)**: Moderate envelope modulation = gentle opening
4. **Filter Envelope**: Slow attack (45), long decay/sustain/release = gradual evolution
5. **GMod = 1**: Global modulation wheel can affect filter (performance control)
6. **MM1**: LFO (source 6) → Filter:Cutoff with depth 18 = slow cyclic filter movement
7. **Result**: A lush, evolving pad with slow filter bloom and cyclic LFO movement

**Key Insight**: Multiple modulation sources to the filter (envelope + LFO + mod wheel) create complex, evolving timbral movement.

### Example 3: Bright Lead

```
#cm=Filter
Cutoff=78.00
Reso=40.00
KeyAmt=85.00
EnvAmt=0.00
VMod=1
GMod=1

#cm=VMod
OscBAmt=50.00
EnvAmt=30.00
```

**Analysis (Filter-First Approach):**
1. **Filter Cutoff (78)**: High cutoff = bright, open sound
2. **Filter Reso (40)**: Noticeable resonance = pronounced "wah" character, adds harmonics
3. **Filter KeyAmt (85)**: Strong keyboard tracking = maintains brightness across range
4. **Filter EnvAmt (0)**: NO filter envelope modulation = static filter (brightness doesn't change over time)
5. **VMod = 1**: Voice modulation affects filter (check VMod section)
6. **Result**: A bright, aggressive lead with static filter but performance modulation available

**Key Insight**: High Cutoff + High Reso + Zero EnvAmt = static bright timbre. The character comes from the resonant peak, not filter movement.

---

## 6. Common Preset Analysis Mistakes to Avoid

1. **Don't analyze parameters in file order** - Always start with Filter section
2. **Don't ignore EnvAmt** - A filter envelope is meaningless if EnvAmt = 0
3. **Don't overlook modulation routing** - Check MM1-MM4 for Filter:Cutoff or Filter:Reso destinations
4. **Don't focus only on oscillators** - Oscillators provide raw material, but the filter shapes the sound
5. **Don't forget the relationship** - Filter EnvAmt sets intensity, Filter Envelope sets shape
6. **Don't miss VMod/GMod toggles** - These enable additional modulation sources to the filter

---

## 7. Summary: Filter-Centric Analysis Workflow

When analyzing any Repro-5 preset, follow this workflow:

1. **Read Filter section**
   - What's the Cutoff? (bright/dark)
   - What's the Reso? (natural/resonant)
   - What's the EnvAmt? (static/sweeping)
   - What's the KeyAmt? (tracking/static)

2. **If EnvAmt ≠ 0, read Filter Envelope (FEnv)**
   - What's the Attack? (fast pluck/slow bloom)
   - What's the Decay/Sustain? (how it settles)
   - What's the Release? (tail behavior)

3. **Check modulation routing**
   - Is VMod or GMod enabled?
   - Are MM1-MM4 routing to Filter:Cutoff or Filter:Reso?
   - What are the modulation sources and depths?

4. **Only then examine other sections**
   - Oscillators (waveforms, tuning, mix)
   - Amplifier Envelope (volume shape)
   - LFO (if it's modulating something)
   - Effects (color and space)

**Remember**: In Repro-5, the filter is king. Master the filter analysis, and you'll understand 70% of what makes a preset sound the way it does.
