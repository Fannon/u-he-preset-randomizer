# Repro-1 Preset Analysis Guide

## Purpose

This guide helps you analyze Repro-1 presets by understanding how parameters shape the sound. Use this to identify the sonic character of presets and understand design choices.

## Critical Sound-Shaping Elements

### 1. FILTER - The Primary Tone Shaper (★★★★★ MOST IMPORTANT)

The filter is THE defining element of most Repro-1 sounds. Pay special attention to these parameters:

**Filter/Cutoff** (avg: 24, range: 0-100)
- **Low (0-30)**: Dark, warm, muffled tones - MOST COMMON in factory presets
- **Medium (30-60)**: Balanced, present sounds
- **High (60-100)**: Bright, aggressive, cutting tones
- Impact: Completely transforms the tonal balance

**Filter/Reso** (avg: 22, range: 0-100)
- **Low (0-20)**: Smooth, natural filtering - MOST COMMON
- **Medium (20-50)**: Adds character and emphasis at cutoff frequency
- **High (50-100)**: Strong resonant peak, self-oscillation possible, aggressive character
- Impact: Defines sharpness and emphasis of the filter character

**Filter/EnvAmt** (avg: 35, range: 0-100) ★ CRITICAL FOR DYNAMICS
- Controls how much the Filter Envelope modulates the cutoff frequency
- **0**: Static filter (no movement)
- **30-60**: Moderate filter sweep - MOST COMMON for dynamic sounds
- **60-100**: Dramatic filter sweeps, evolving timbres
- Impact: Creates the sense of movement and articulation in the sound

**Filter/KeyAmt** (avg: 34, range: 0-100)
- Controls keyboard tracking (note: 75 = perfect tracking)
- **0**: No tracking - same brightness across keyboard
- **30-40**: Subtle brightness variation - COMMON in factory presets
- **75**: Perfect tracking - filter follows keyboard pitch
- Impact: Affects how brightness changes across the keyboard

### 2. MODULATION MATRIX - Where the Magic Happens (★★★★)

**Most Common Modulation Destinations (from 1227 presets):**
1. **Filter:Cutoff** - THE #1 modulation target
2. **Filter:Reso** - Second most common
3. **Filter:EnvAmt** - Adds dynamic control to filter movement
4. **Filter:KeyAmt** - Less common but powerful

**When analyzing modulations, look for:**
- Velocity → Filter:Cutoff (brightness responds to playing dynamics)
- LFO → Filter:Cutoff (vibrato/wobble effects)
- ModWheel → Filter:Cutoff/Reso (expressive control)
- Filter Envelope → Filter:Cutoff (via Filter/EnvAmt, this is the standard path)

The modulation depth (MM1/Depth1, MM2/Depth1) ranges -100 to +100:
- Small depths (±1 to ±20): Subtle modulation, adds life
- Medium depths (±20 to ±60): Noticeable movement
- Large depths (±60 to ±100): Dramatic, obvious modulation

## Preset File Structure

Presets use simple key-value format:
```
Repro-1 {
  parameter_name: value
}
```

### 3. ENVELOPES - Shaping the Sound Over Time (★★★★)

**Filter Envelope (FEnv)** - Controls filter movement
- Works with Filter/EnvAmt to create dynamic timbral changes
- `FEnv_Attack`: How quickly brightness increases after note-on
- `FEnv_Decay`: How quickly brightness drops to sustain level
- `FEnv_Sustain`: Brightness level while key is held
- `FEnv_Release`: How long brightness takes to fade after note-off

**Common Filter Envelope Patterns:**
- **Pluck/Percussive**: Fast attack, medium decay, low sustain (brightness fades quickly)
- **Pad/Sustained**: Slow attack, long decay, high sustain (slowly evolving brightness)
- **Classic Synth Bass**: Fast attack, medium-long decay, medium sustain

**Amplifier Envelope (AEnv)** - Controls volume over time
- `AEnv_Attack`: How quickly volume rises
- `AEnv_Decay`: How quickly volume drops to sustain
- `AEnv_Sustain`: Volume level while key is held
- `AEnv_Release`: How long sound continues after key release

### 4. OSCILLATORS - The Raw Sound Source (★★★)

**Shape Selection Impact:**
- `VCO1_Shape`, `VCO2_Shape`:
  - **0**: Off
  - **1**: Sawtooth (bright, buzzy, rich harmonics)
  - **2**: Pulse (hollow, nasal at 50% width)
  - **3**: Saw + Pulse (thick, rich)
  - **4**: Triangle (soft, mellow - VCO2 only)

**Detuning for Width:**
- `VCO2_Tune`: Detune by ±7 to ±12 semitones for thick, chorused sounds
- `VCO2_Fine`: Small detune (±0.05 to ±0.15) creates subtle beating/movement

**Sync for Harmonics:**
- `VCO1_Sync`: When enabled, creates complex, aggressive harmonics (great for leads)

### 5. LFO - Periodic Modulation (★★★)

**LFO/Freq** (avg: 54, range: 0-100)
- Low speeds (0-30): Slow sweeps, evolving textures
- Medium (30-70): Vibrato, moderate wobble - MOST COMMON
- High (70-100): Fast tremolo/aggressive modulation

**Waveforms:**
- `LFO/Triang`: 1 = enabled (smooth, rounded modulation - VERY COMMON, 85% of presets)
- `LFO/Saw`: 1 = enabled (ramp modulation - 13% of presets)
- `LFO/Sqre`: 1 = enabled (stepped modulation - 10% of presets)

**LFO/Mode**:
- 0 = free-running rate (80% of presets)
- 1 = tempo-synced (20% of presets)

## Quick Reference: Parameter Impact Ratings

**★★★★★ CRITICAL** - These define the core sound:
- Filter/Cutoff, Filter/Reso, Filter/EnvAmt
- Filter Envelope (when EnvAmt > 0)

**★★★★ VERY IMPORTANT** - Shape the character:
- Modulation Matrix destinations
- Amplifier Envelope
- Filter/KeyAmt

**★★★ IMPORTANT** - Color and variation:
- Oscillator shapes and tuning
- LFO speed and routing
- Effects (Jaws, Lyrebird, Drench)

**★★ MODERATE** - Refinement:
- Mixer levels
- Glide settings
- Velocity sensitivity

**★ SUBTLE** - Fine-tuning:
- Microtuning
- MIDI controls
- Advanced tweaks

## Analysis Workflow

When analyzing a Repro-1 preset:

1. **Start with the FILTER** - Check cutoff, resonance, envelope amount
2. **Check MODULATION** - What's modulating the filter? How much?
3. **Examine ENVELOPES** - Filter and amp envelope shapes
4. **Review OSCILLATORS** - Waveforms, tuning, sync
5. **Check LFO** - Speed, waveform, what it's modulating
6. **Effects** - Which are enabled, how heavily used

## Complete Parameter Reference

### Oscillators
- `VCO1_Shape`, `VCO2_Shape`: Waveform (0=off, 1=saw, 2=pulse, 3=both, 4=triangle for VCO2)
- `VCO1_Octave`, `VCO2_Octave`: Octave range (0-3)
- `VCO1_Tune`, `VCO2_Tune`: Pitch in semitones (-12 to +12)
- `VCO1_Fine`, `VCO2_Fine`: Fine tune in cents (-0.20 to +0.20)
- `VCO1_PW`, `VCO2_PW`: Pulse width (0-100)
- `VCO1_Sync`: Oscillator sync (0=off, 1=on)
- `VCO2_Range`: Frequency range (0=normal, 1=lo-freq/LFO mode)
- `VCO2_KbdMode`: Keyboard tracking (0=on, 1=off)

### Mixer
- `Mix_OscA`, `Mix_OscB`, `Mix_Noise`: Level for each source (0-100)
- `Mix_Feedback`: Source select (0=noise, 1=feedback)

### Filter (See Section 1 for detailed analysis guidance)
- `Filter/Cutoff`: Cutoff frequency (0-100)
- `Filter/Reso`: Resonance (0-100)
- `Filter/EnvAmt`: Filter envelope modulation depth (0-100)
- `Filter/KeyAmt`: Keyboard tracking amount (0-100, 75=perfect tracking)
- `Filter/ModDW`: Modulation destination wheel (0=direct, 1=off, 2=wheel)

### Envelopes (See Section 3 for patterns)
**Filter Envelope:**
- `FEnv_Attack`, `FEnv_Decay`, `FEnv_Sustain`, `FEnv_Release` (0-100)
- `FEnv_Vel`: Velocity sensitivity (0-100)

**Amp Envelope:**
- `AEnv_Attack`, `AEnv_Decay`, `AEnv_Sustain`, `AEnv_Release` (0-100)
- `AEnv_Vel`: Velocity sensitivity (0-100)

### LFO (See Section 5 for details)
- `LFO/Freq`: Rate (0-100)
- `LFO/Mode`: 0=rate, 1=tempo-sync
- `LFO/Triang`, `LFO/Saw`, `LFO/Sqre`, `LFO/InvSaw`: Waveform enables (0/1)

### Modulation Matrix (MM1-MM8)
- `MM#/Source`: Modulation source (0-15, see modulation sources)
- `MM#/Dest1`: Destination parameter (string identifier, e.g., "Filter:Cutoff")
- `MM#/Depth1`: Modulation amount (-100 to +100)
- `MM#/Curve1`: Response curve (0-4)

**Key Modulation Sources:**
- 0=none, 1=ModWheel, 2=PitchBend, 5=LFO, 11=Velocity, 12=Aftertouch, 14=Filter Envelope, 15=Amp Envelope

### Performance Controls
- `MIDI/Glide`: Portamento rate (0-100)
- `MIDI/Tune`: Master tuning in semitones (-12 to +12)
- `MIDI/PWRng+`, `MIDI/PWRng-`: Pitch bend range up/down (0-48 semitones)
- `MIDI/Trigger`: Retrigger mode (0=normal, 1=retrigger)

### Effects (Brief Reference)
- **Jaws (Wavefolder)**: `FX_Jaws_On`, `FX_Jaws_Folds`, `FX_Jaws_Teeth`
- **Lyrebird (Delay)**: `FX_Lyrebird_On`, `FX_Lyrebird_Mix`, `FX_Lyrebird_Time`, `FX_Lyrebird_Feedback`
- **Drench (Reverb)**: `FX_Drench_On`, `FX_Drench_Mix`, `FX_Drench_Decay`
- **Sonic Conditioner**: `FX_SoCo_On`, `FX_SoCo_Gain`, `FX_SoCo_Width`

### Arpeggiator/Sequencer
- `Arp/Status`: Mode (0=off, 1=up, 2=up/down)
- `Seq/Status`: Sequencer on/off
- `Seq1/NumStps`: Pattern length (1-32)

## Key Insights from Factory Preset Analysis (1227 presets)

**Filter is King:**
- Average cutoff: 24 (most sounds are darker/warmer than you might expect)
- Average resonance: 22 (moderate resonance is common)
- Average envelope amount: 35 (moderate filter movement)
- Filter:Cutoff is THE most common modulation destination

**Common Modulation Strategies:**
- Velocity → Filter:Cutoff (dynamic response)
- LFO → Filter:Cutoff (movement/vibrato)
- Filter Envelope shapes the brightness envelope (via Filter/EnvAmt)

**LFO Usage:**
- 85% use triangle wave (smooth modulation)
- 80% use free-running (not tempo-synced)
- Average speed around 54 (moderate rates)

**Envelope Shapes:**
- Most presets use moderate attack/decay times
- Percussive vs sustained sounds primarily determined by amp envelope sustain level
