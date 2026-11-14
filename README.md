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
scripts/qa-video.ts                  MP4 metadata/audio/blank-frame QA
scripts/contact-sheet.mjs            Contact sheet generation
scripts/scene-cache.ts               Per-scene cache manifest
scripts/capture-screen.ts             Optional Playwright screen capture
src/engines/story/director.ts         Sentence-to-visual mapping
src/engines/animation/               Animation state and viseme helpers
src/engines/visuals/gltfCharacter.tsx Optional GLTF/GLB character loader
python/voice.py                      Kokoro narration adapter
python/align.py                      faster-whisper alignment adapter
python/mix.py                        Procedural music/SFX mixer
docs/REFERENCE_STYLE_ANALYSIS.md     Reference style findings
docs/PRODUCTION_AUDIT.md             Root-cause audit and remaining limits
```

## Known limitations

- The default sample uses procedural primitives, but optional GLTF/GLB character/environment loading and skeletal clip state selection are now available when licensed assets are supplied.
- Facial morph targets and frame-driven mouth movement are supported for compatible GLTF assets; a production phoneme map still needs asset-specific calibration.
- QA verifies metadata, duration, resolution, frame rate, audio presence, sampled black/solid frames, and the configured caption safe-zone policy.
- Scene cache manifests and optional Playwright screen capture are implemented; full cached scene artifact stitching and browser setup remain VPS configuration work.
- The default VPS mode remains CPU/software-WebGL friendly. High-quality GLTF assets can be enabled per project and are not mandatory.

See `docs/ARCHITECTURE_AUDIT.md`, `docs/REFERENCE_STYLE_ANALYSIS.md`, `docs/PRODUCTION_AUDIT.md`, and `DEVELOPMENT_STATUS.md` for the full architecture and verification record.

## Multi-agent production foundation

The new `backend/` package adds a real, local-first Director layer on top of the media engine:

```bash
python3 -m venv .venv-agent
. .venv-agent/bin/pip install -e backend
.venv-agent/bin/python -m backend.app.cli agents
.venv-agent/bin/python -m backend.app.cli run-mvp --topic "How local voice generation works"
```

It provides Pydantic contracts, a permission-aware agent registry, SQLite checkpoints, isolated project artifact workspaces, a deterministic 12-agent MVP registry, FastAPI endpoints, and a LangGraph-compatible graph builder. The deterministic local mode does not call an LLM or paid provider. It writes structured artifacts and delegates media work to the existing Remotion/Python/FFmpeg pipeline.

The Reel Editor archive audit is in `docs/REEL_EDITOR_AUDIT.md`. The backend foundation is intentionally additive: it does not replace the working rendering engine.
