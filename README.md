# Universal AI Video Studio

Local-first video production with Remotion as the master compositor and Three.js for deterministic 3D scenes.

## Current implementation

The sample project is a 29.38-second stylized 3D voice explainer based on the uploaded reference video. It uses:

- Real Three.js geometry through `@remotion/three`.
- A warm studio environment with perspective camera, lights, shadows, presenter geometry, microphone, laptop, fan, and floating voice orb.
- Frame-driven camera movement, orb pulse, orbital rings, presenter gestures, fan rotation, waveforms, sliders, and UI cards.
- Remotion UI overlays and gold cinematic captions.
- Local Kokoro narration.
- Local faster-whisper word alignment.
- Procedural background music and scene-transition whooshes.
- 48 kHz stereo audio mix with ducked narration and loudness normalization.
- 1080×1920, 30 FPS H.264 video.
- AAC stereo audio at 48 kHz.
- Metadata/audio QA and an SVG contact sheet.

The previous SVG `voice-studio` renderer remains available as a fallback. The new 3D renderer is selected with `visualStyle: "voice-studio-3d"`.

## Requirements

- Node.js 22 or newer.
- npm.
- A Chromium-compatible environment. Remotion downloads its headless shell if needed.
- FFmpeg and FFprobe. The repository includes Remotion’s bundled binaries for local QA and alignment fallback.
- GPU is optional. The default commands use Remotion’s `swangle` software WebGL renderer.

## Run the project

```bash
npm install
npm run check
npm run render:still
npm run render:final
npm run contact-sheet
npm run qa:video -- --require-audio
```

Outputs:

```text
out/final.mp4                         Full-resolution render
out/voice-studio-explainer.mp4        Named final explainer
out/voice-studio-contact-sheet.svg    10-frame contact sheet
out/qa-report.json                    Metadata and audio QA report
```

The final render target is 1080×1920 at 30 FPS. The draft command remains available for faster 540×960 testing:

```bash
npm run render:draft
```

## Local Kokoro and Whisper pipeline

The repository does not commit model files. Use an isolated environment:

```bash
python3 -m venv .venv
. .venv/bin/pip install kokoro-onnx numpy scipy faster-whisper
```

Place Kokoro model files under `models/kokoro/`, then generate narration:

```bash
.venv/bin/python python/voice.py projects/sample/project.json \
  --model models/kokoro/kokoro-v1.0.onnx \
  --voices models/kokoro/voices-v1.0.bin
```

Generate aligned word timings:

```bash
.venv/bin/python python/align.py projects/sample/project.json \
  --model small.en --allow-model-download
```

Then create the music/SFX mix:

```bash
npm run mix:audio
```

Render again. `scripts/prepare-render.ts` stages `mix.wav` and Remotion uses the mix instead of the raw narration file.

## Validation commands

```bash
npm run typecheck
npm test
npm run validate
npm run prepare:render
npm run qa:video -- --require-audio
npm audit --omit=dev --audit-level=high
```

`npm run check` covers TypeScript, unit tests, project validation, and timing generation. It intentionally does not download models or render a full video.

## Project structure

```text
src/types/project.ts                 Project schema
src/core/timing.ts                   Timing and scene coverage
src/core/captions.ts                 Caption parsing
src/core/validation.ts               Project and timing QA
src/components/CaptionOverlay.tsx   Animated captions
src/styles/voiceStudio.tsx           SVG fallback style
src/styles/voiceStudio3D.tsx         Real Three.js style
src/styles/threeProof.tsx            Three.js proof scene
src/Root.tsx                          Remotion composition
scripts/prepare-render.ts            Timing and asset staging
scripts/qa-video.ts                  MP4 metadata/audio QA
scripts/contact-sheet.mjs            Contact sheet generation
python/voice.py                      Kokoro narration adapter
python/align.py                      faster-whisper alignment adapter
docs/REFERENCE_STYLE_ANALYSIS.md     Reference style findings
docs/PRODUCTION_AUDIT.md             Root-cause audit and remaining limits
```

## Known limitations

- The current 3D kit uses procedural primitives, not GLTF/GLB character assets.
- Facial animation is limited to deterministic head/body motion; the presenter does not have a facial rig or phoneme-level lip sync.
- The current sample uses aligned local narration, procedural music, and scene-transition sound effects.
- QA verifies metadata, duration, resolution, frame rate, and audio presence. Black-frame and caption-bound scans are reported as not implemented when the bundled FFmpeg build lacks the required filters.
- Scene cache, per-scene regeneration, FastAPI, the dashboard, research, video intelligence, Telegram, and VPS deployment remain future phases.

See `docs/ARCHITECTURE_AUDIT.md`, `docs/REFERENCE_STYLE_ANALYSIS.md`, `docs/PRODUCTION_AUDIT.md`, and `DEVELOPMENT_STATUS.md` for the full architecture and verification record.
