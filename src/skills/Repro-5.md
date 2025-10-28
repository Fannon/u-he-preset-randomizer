# u-he Repro-5 Preset File Analysis for LLM Context

## 1. Introduction

This document provides a detailed breakdown of the `.txt` preset file format for the u-he Repro-5 software synthesizer. Its purpose is to serve as a technical guide for a Large Language Model (LLM) to understand the synth's architecture and how its parameters are stored. This will enable the LLM to read, interpret, modify, and generate valid Repro-5 preset files.

Repro-5 is a component-modeled emulation of a classic 5-voice polyphonic analog synthesizer. Its architecture consists of two oscillators, a mixer, a resonant low-pass filter, two ADSR envelopes (one for the filter, one for the amplifier), a global LFO, and a flexible modulation system, followed by a chain of five stereo effects.

## 2. Preset File Structure

A Repro-5 preset file is a plain text file with a specific structure. It contains three main parts:

### 2.1. Metadata Block (`/*@Meta ... */`)

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

### 2.2. Parameter Blocks (`#cm=...`)

This is the core of the preset. All synthesis and effect parameters are defined here. Each block represents a specific module or section of the synthesizer.

*   The format is `#cm=[ModuleName]` followed by `Key=Value` pairs on new lines.
*   For example, `#cm=OscA` contains all parameters for Oscillator A.

### 2.3. Compressed Binary Data (`$$$$...`)

The file ends with a block of seemingly random characters, starting with `$$$$`.

```
// Section for ugly compressed binary Data
// DON'T TOUCH THIS

$$$$6784
?gdgceneb:ajbbaiaa:eaaaaaaa:apaaaaaa:aaabaaaa:aeaaaaaa:aaaaiadp:
...
```

**Crucial Instruction for LLM**: This section contains non-human-readable, compressed data. It should **NEVER** be modified or generated. When creating or editing a preset, this entire block should be treated as opaque and preserved as-is from a source file, or omitted if generating from scratch (though this may result in an incomplete preset).

## 3. Detailed Parameter Reference

This section maps the parameters found in the preset files to their functions as described in the Repro-5 User Guide.

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

### **`#cm=Filter` - Filter**

(Manual Ref: Page 23)

*   `Cutoff=57.00`: Filter **CUTOFF** frequency.
*   `Reso=40.50`: Filter **RESONANCE**.
*   `KeyAmt=28.00`: **KEYBOARD AMOUNT**, how much the filter cutoff tracks the keyboard.
*   `EnvAmt=27.00`: **ENVELOPE AMOUNT**, how much the filter envelope modulates the cutoff.
*   `VMod=0`, `GMod=1`: Toggles modulation of the filter cutoff from the **VOICE MOD** and **WHEEL MOD** sections, respectively.
*   `EnvPol=0`: Filter envelope polarity. `0` = Positive (`+`), `1` = Inverted (`-`). (TWEAKS Page, Ref: p. 32)
*   `KTSrc=1`: Filter key tracking source. `0` = Key, `1` = Key+PitchBend. (TWEAKS Page, Ref: p. 32)

---

### **`#cm=FEnv` & `#cm=AEnv` - Envelopes**

(Manual Ref: Pages 23-24)

These blocks control the Filter Envelope and Amplifier Envelope, respectively. They share the same parameters.
*   `Atk=6.50`: **ATTACK** time.
*   `Dec=63.75`: **DECAY** time.
*   `Sus=100.00`: **SUSTAIN** level.
*   `Rel=22.72`: **RELEASE** time.
*   `VelDep=84.50`: Velocity modulation amount (**VEL** trimmer).

---

### **`#cm=...IC` - Integrated Circuit (Tweaks)**

These blocks represent the "Tweak" selectors that change the underlying component models. (Manual Ref: pp. 32-33)

*   `#cm=OscAIC`, `#cm=OscBIC`: `Chip=...` defines the **Oscillator Tweak** (e.g., 0=P5, 1=P1, 2=Ideal).
*   `#cm=FltrIC`: `Chip=...` defines the **Filter Tweak** (e.g., 0=Crispy, 1=Rounded, 2=Driven, 3=Poly).
*   `#cm=FEnvIC`, `#cm=AEnvIC`: `Chip=...` defines the **Envelope Tweak** (e.g., 0=Ideal, 1=Analog).

---

### **`#cm=MM1` to `#cm=MM4` - Modulation Matrix**

(Manual Ref: Pages 27-30)

These represent the four slots in the modulation matrix (2 visible slots, switchable to MM B for two more).

*   `Source=11`: The modulation source, selected by an index. The index maps to the `#ms` list at the top of the file (e.g., `1`=ModWhl, `10`=Velocity, `11`=Pressure).
*   `Dest1=LFO:Freq`: The modulation destination, specified as a string `Module:Parameter`.
*   `Depth1=22.00`: The modulation amount. Can be positive or negative.
*   `Curve1=2`, `Rect1=0`, `Qntze1=0`, `SH1=0`, `Slew1=0`: These are the **Slot Modifiers** (Curve, Rectify, Quantise, Sample & Hold, Slew Limiter). The values are indices corresponding to the options in the manual (p. 29-30).

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
