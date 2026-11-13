# Reference Style Analysis

**Reference:** `reference/VoiceSt.mp4` from the repository `main` branch  
**Analyzed:** 2026-11-13  
**Output style:** `voice-studio`

## Measured media properties

- Duration: 68.97 seconds.
- Frame size: 720×1280, vertical 9:16.
- Frame rate: 30 FPS.
- Video: H.264.
- Audio: AAC, 44.1 kHz stereo.
- The reference contains a cinematic 3D studio environment, a seated presenter, and a floating voice-assistant orb.

## Observed visual language

### Environment

The base environment is a warm, dim recording studio. It has wood surfaces, acoustic panels, vertical colored panels, a desk, a laptop, a microphone, and a small fan. The environment remains mostly consistent while product UI panels and captions change above it.

### Characters and focal objects

The presenter sits on the left and looks toward the orange spherical voice assistant. The assistant has a dark face, simple bright eyes and mouth, an antenna, and orbital rings. The contrast between the human and the orb makes the product idea readable without relying on a real face.

### UI overlays

Most instructional beats use a dark rounded software window floating over the environment. The window contains:

- A step label such as `STEP 1/4`.
- A segmented progress bar.
- A large cream serif headline.
- A browser-like title strip.
- Dark charcoal panels.
- Orange highlights for active controls.
- Small green confirmations.

### Typography and captions

The UI uses a cream serif headline over a dark interface. Captions use a large warm gold serif treatment, centered near the lower third. Captions are short and emphasize one idea per beat.

### Motion and pacing

The reference alternates between a clean environment shot and a UI-instruction shot. Changes happen as a sequence of product steps. Useful reusable motion primitives are:

- Slow camera push or parallax on the studio background.
- Orb pulse and orbital-ring rotation.
- UI card slide-up and slight scale-in.
- Progress segment activation.
- Waveform movement.
- Slider knob movement.
- Caption pop-in.

### Safety/product framing

The final section includes a permission reminder about cloning a famous voice. The system should preserve the safety idea while using original wording and its own layout. The new sample uses: “Use only voices you own or have permission to use.”

## Reusable implementation

The new `voice-studio` package contains an SVG fallback, while `voice-studio-3d` adds an original Three.js scene kit with:

- a perspective camera and deterministic camera push;
- warm/cool lights, shadow-casting geometry, a studio shell, floor, acoustic panels, desk, laptop, microphone, and fan;
- a seated primitive presenter with body and gesture motion;
- a floating orange voice orb with emissive material, face plate, antenna, and rotating torus rings;
- React UI overlays for download, recording, design, generation, caption sync, and permission steps;
- gold cinematic captions composited by Remotion.

The implementation uses original geometry, copy, and layout. It does not copy the reference video's exact frames, assets, character design, UI copy, or script.

## Test explainer

The sample project explains a local voice workflow:

1. Why per-minute voice costs add up.
2. Running a model locally.
3. Downloading the model once.
4. Recording a personal voice sample.
5. Designing a voice.
6. Generating the audio.
7. Synchronizing captions.
8. Using voices with permission.

The renderer remains Remotion-first. The style is a visual package selected by project JSON and can later be paired with Kokoro, faster-whisper, and real audio timing without changing its scene components.
