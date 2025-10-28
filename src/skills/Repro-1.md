# Repro-1 Preset Format Reference Guide

## Overview

Repro-1 is a software synthesizer that emulates a classic monophonic analog synthesizer from the early 1980s. It features component-level modeling of Curtis chips (3340 oscillator, 3320 filter, and 3310 envelope). Presets are stored in `.h2p` format as human-readable text files.

## Preset File Structure

Presets are stored in a simple key-value format:
```
Repro-1 {
  parameter_name: value
  // comments can appear with //
}
```

## Core Synthesis Parameters

### Oscillators

#### Oscillator A
- `VCO1_Octave`: Octave setting (0-3, representing 4 octave range)
- `VCO1_Tune`: Frequency/pitch adjustment (-12.00 to +12.00 semitones)
- `VCO1_Fine`: Fine tuning trimmer (-20 to +20 cents, stored as -0.20 to +0.20)
- `VCO1_Shape`: Wave shape switches (0=off, 1=saw, 2=pulse, 3=both)
- `VCO1_PW`: Pulse width (0.00 to 100.00)
- `VCO1_Sync`: Sync switch (0=off, 1=on)

#### Oscillator B  
- `VCO2_Octave`: Octave setting (0-3)
- `VCO2_Tune`: Frequency adjustment (-12.00 to +12.00)
- `VCO2_Fine`: Fine tuning (-0.20 to +0.20)
- `VCO2_Shape`: Wave shape (0=off, 1=saw, 2=pulse, 3=both, 4=triangle)
- `VCO2_PW`: Pulse width (0.00 to 100.00)
- `VCO2_KbdMode`: Keyboard tracking (0=on, 1=off)
- `VCO2_Range`: Frequency range (0=normal, 1=lo freq for LFO use)

### Mixer
- `Mix_OscA`: Oscillator A level (0.00 to 100.00)
- `Mix_OscB`: Oscillator B level (0.00 to 100.00) 
- `Mix_Noise`: Noise/feedback level (0.00 to 100.00)
- `Mix_Feedback`: Feedback switch (0=noise, 1=feedback)

### Filter
- `VCF_Cutoff`: Filter cutoff frequency (0.00 to 100.00)
- `VCF_Resonance`: Filter resonance (0.00 to 100.00)
- `VCF_EnvAmount`: Envelope modulation amount (0.00 to 100.00)
- `VCF_KbdAmount`: Keyboard tracking amount (0.00 to 100.00, 75.00 = perfect tracking)
- `VCF_Tweak`: Filter model (0=Crispy, 1=Rounded, 2=Driven, 3=Poly)

### Envelopes

#### Filter Envelope
- `FEnv_Attack`: Attack time (0.00 to 100.00)
- `FEnv_Decay`: Decay time (0.00 to 100.00)
- `FEnv_Sustain`: Sustain level (0.00 to 100.00)
- `FEnv_Release`: Release time (0.00 to 100.00)
- `FEnv_Vel`: Velocity sensitivity trimmer (0.00 to 100.00)
- `FEnv_Tweak`: Envelope mode (0-4: Normal, High Sustain, One Shot, Piano 1, Piano 2)

#### Amplifier Envelope
- `AEnv_Attack`: Attack time (0.00 to 100.00)
- `AEnv_Decay`: Decay time (0.00 to 100.00)
- `AEnv_Sustain`: Sustain level (0.00 to 100.00)
- `AEnv_Release`: Release time (0.00 to 100.00)
- `AEnv_Vel`: Velocity sensitivity (0.00 to 100.00)
- `Curve`: Volume curve trimmer (0.00 to 100.00)
- `AEnv_Tweak`: Envelope mode (0-4)

### LFO
- `LFO_Wave`: LFO waveform (0=off, 1=saw, 2=square, 3=triangle, combinations possible)
- `LFO_Sync`: Sync mode (0=rate, 1=clock)
- `LFO_Phase`: Phase/polarity (0.00 to 100.00)
- `LFO_Delay`: LFO delay (not visible in main UI)

### Modulation
- `ModWheel`: Mod wheel position (0.00 to 100.00)
- `MW_LfoDepth`: LFO to mod wheel depth (0.00 to 100.00)
- `MW_OscBDepth`: Osc B to mod wheel depth (0.00 to 100.00)
- `MW_FEnvDepth`: Filter env to mod wheel depth (0.00 to 100.00)

#### Modulation Routing
Format: `Mod_Source_Dest: value` where value is routing switch position
- Values: 0=direct, 1=off, 2=wheel
- Sources: Lfo, OscB, FEnv
- Destinations: OscAFreq, OscAPW, OscBFreq, OscBPW, Cutoff

Examples:
- `Mod_Lfo_OscAFreq`: LFO to Osc A frequency routing
- `Mod_OscB_Cutoff`: Osc B to filter cutoff routing

### Mode/Glide
- `Mode_Glide`: Glide rate (0.00 to 100.00)
- `Mode_Legato`: Legato mode (0=normal, 1=auto)
- `Mode_Retrigger`: Retrigger mode (0=normal, 1=retrig)  
- `Mode_Repeat`: Repeat switch (0=off, 1=on)
- `Mode_Drone`: Drone mode (0=off, 1=on)

### Clock/Arpeggiator/Sequencer
- `Clock`: Clock division (see table below)
- `Arp_Mode`: Arpeggiator mode (0=off, 1=up, 2=up/down)
- `Arp_Latch`: Latch switch (0=off, 1=on)
- `Arp_Sync`: Sync source (0=lfo, 1=key, 2=clock)

#### Clock Values
```
0: 8/1      8: 1/3      16: 1/12     24: 1/32 trip
1: 6/1      9: 1/4 dot   17: 1/16     25: 1/48
2: 4/1      10: 1/4      18: 1/16 trip 26: 1/48 trip
3: 3/1      11: 1/4 trip 19: 1/16 dot 27: 1/64
4: 2/1      12: 1/6      20: 1/24     28: 1/64 trip
5: 2/1 trip 13: 1/8      21: 1/24 trip
6: 2/1 dot  14: 1/8 trip 22: 1/32
7: 1/1      15: 1/8 dot  23: 1/32 dot
```

### Sequencer
- `Seq_Mode`: Sequencer mode (0=off, 1=play pattern 1, 2=play pattern 2, 3=play 1+2)
- `Seq_Host`: Host sync (0=off, 1=on)
- `Seq_Length1`: Pattern 1 length (1-32)
- `Seq_Length2`: Pattern 2 length (1-32)

#### Pattern Data Format
- `Seq1_Step##_Mode`: Step type (0=note, 1=tie, 2=rest)
- `Seq1_Step##_Note`: Note offset (-36 to +36)
- `Seq1_Step##_Vel`: Velocity (1-127)
- `Seq1_Step##_Glide`: Glide on/off (0=off, 1=on)

### Effects

#### JAWS Wavefolder
- `FX_Jaws_On`: Effect on/off
- `FX_Jaws_Folds`: Fold amount (0.00 to 100.00)
- `FX_Jaws_Teeth`: Number of folds (0, 2, 4, 6)
- `FX_Jaws_Bias`: Bias amount (0.00 to 100.00)
- `FX_Jaws_FMod`: Fold modulation depth (0.00 to 100.00)
- `FX_Jaws_BMod`: Bias modulation rate (0=off, 1=min, 2=med, 3=max)
- `FX_Jaws_Attack`: Envelope attack (0.00 to 100.00)
- `FX_Jaws_Release`: Envelope release (0.00 to 100.00)
- `FX_Jaws_EnvMode`: Envelope mode (0=ASR, 1=AR, 2=LFO)

#### Lyrebird Delay
- `FX_Lyrebird_On`: Effect on/off
- `FX_Lyrebird_Mix`: Wet/dry mix (0.00 to 100.00)
- `FX_Lyrebird_Sync1/2`: Sync modes (various options)
- `FX_Lyrebird_Time`: Delay time multiplier (0.00 to 100.00)
- `FX_Lyrebird_Feedback`: Regeneration (0.00 to 100.00)
- `FX_Lyrebird_Mode`: Delay mode (0=echo, 1=pingpong, 2=swing, 3=groove)
- `FX_Lyrebird_LfoRate`: Modulation rate (0=off, 1-3=min/med/max)

#### ResQ Resonator/EQ
- `FX_Resq_On`: Effect on/off
- `FX_Resq_Mode`: Mode (0=EQ, 1=Resonator)
- `FX_Resq_LowFreq/MidFreq/HighFreq`: Band frequencies
- `FX_Resq_LowGain/MidGain/HighGain`: Band gains (EQ mode)
- `FX_Resq_Quality`: Q/resonance (0.00 to 100.00)

#### Drench Reverb
- `FX_Drench_On`: Effect on/off
- `FX_Drench_Mix`: Wet/dry mix (0.00 to 100.00)
- `FX_Drench_PreDelay`: Pre-delay (0.00 to 100.00)
- `FX_Drench_Decay`: Decay time (0.00 to 100.00)
- `FX_Drench_Tone`: Tone control (-100.00 to 100.00)

#### Sonic Conditioner
- `FX_SoCo_On`: Effect on/off
- `FX_SoCo_Gain`: Output gain (-100.00 to 100.00)
- `FX_SoCo_Width`: Stereo width (0.00 to 100.00)
- `FX_SoCo_Transient`: Transient control (-100.00 to 100.00)

### Modulation Matrix (MM)
Format: `MM#_Source_Target: depth` where # is slot number (1-8)
- Sources: Velocity, Aftertouch, ModWheel, PitchBend, etc.
- Targets: Various synth parameters
- `MM#_Curve`: Response curve
- `MM#_Rectify`: Rectification mode
- `MM#_Quantise`: Quantization mode
- `MM#_SH`: Sample & hold settings
- `MM#_Slew`: Slew rate

### Global/Performance
- `BaseFreq`: Base frequency/master tuning
- `PitchBend_Up`: Pitch bend up range (0-48 semitones)
- `PitchBend_Down`: Pitch bend down range (0-48 semitones)
- `Voice_Polyphony`: Always 1 for this monophonic synth
- `Voice_StackMode`: Voice stack mode
- `Voice_Panning`: Pan position (-100.00 to 100.00)

### Tweaks Panel
- `Tweak_VCO1/VCO2_Model`: Oscillator model (0=Ideal, 1=P1, 2=P5)
- `Tweak_LFO_Invert`: LFO inversion (0=normal, 1=inverted)
- `Tweak_LFO_DC`: DC offset (0=no DC, 1=DC)
- `Tweak_VCO2_Saw`: Saw wave polarity (0=normal, 1=inverted)
- `Tweak_KeyPriority`: Note priority (0=low, 1=high, 2=last)
- `Tweak_MicroTuning`: Microtuning on/off
- `Tweak_MicroTuning_Name`: Microtuning table name

## Usage Notes

1. Values are typically stored as floating point numbers with 2 decimal places
2. Switch positions are stored as integers (0, 1, 2, etc.)
3. Percentages are stored as 0.00 to 100.00
4. Bipolar values (like tuning) use negative and positive ranges
5. Some parameters may not be visible in the main UI but exist in tweaks or are internal
6. Comments in presets start with // and are ignored by the parser

This reference allows for programmatic creation, modification, and analysis of Repro-1 presets by understanding the parameter mappings between the UI and the stored preset format.
