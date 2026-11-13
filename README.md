# Universal AI Video Studio

Local-first video production with Remotion as the master compositor and Three.js for deterministic 3D scenes.

## What is ready

This repository contains the first runnable MVP foundation:

- Remotion composition at 1080×1920 and 30 FPS.
- CPU-friendly 2D scene style.
- Deterministic Three.js proof scene.
- Estimated word and line timing with no model downloads.
- Shared animated captions.
- Project schema and semantic validation.
- Unit tests.
- Optional local Kokoro and faster-whisper adapter scripts.

The sample project is a 23.27-second stickman story called **The Last Bus**. It uses six animated scenes, estimated timing, scene-specific captions, and a final visual payoff. It is intentionally model-free and has no narration audio yet.

## Requirements

- Node.js 22 or newer.
- npm.
- A Chromium-compatible environment. Remotion downloads its headless shell on first render if needed.
- FFmpeg and FFprobe are required later for Python audio processing and speech alignment. They are not required for the current model-free Remotion draft render.

For machines without a usable GPU, the commands use Remotion's `swangle` software WebGL renderer. This is slower but keeps a GPU optional.

## Run the sample locally

From the repository root:

```bash
npm install
npm run check
npm run render:still
npm run render:draft
```

The first render downloads Remotion's headless browser if it is not already cached. Outputs are written to `out/`:

- `out/draft-frame.png`: a captioned still frame.
- `out/draft.mp4`: a 540×960 low-resolution draft for quick testing.

For a full 1080×1920 render:

```bash
npm run render:final
```

The full render is deliberately slower on a CPU. Use the draft render first.

To open the Remotion development studio:

```bash
npm run studio
```

## Check commands

```bash
npm run typecheck       # TypeScript validation
npm test                # Unit tests
npm run validate        # Validate the sample project
npm run timing -- projects/sample/project.json
npm run prepare:render  # Validate and stage project timing/assets
npm audit --omit=dev --audit-level=high
```

`npm run check` runs the type check, tests, sample validation, and timing generation together.

## Change the sample project

Edit:

```text
projects/sample/project.json
```

Each line has a corresponding scene. Keep these IDs connected:

- `lines[].sceneId` must match `scenes[].id`.
- `scenes[].lineId` must match `lines[].id`.
- `lines[].caption` uses `|` for caption chunks and `*` for the highlighted word.

Then run:

```bash
npm run validate
npm run render:still
npm run render:draft
```

The render commands first prepare a validated manifest in `.tmp/render-props.json`. If `projects/sample/data/timing.json` exists, it is used; otherwise the render uses estimated timing. If `projects/sample/data/narration.wav` exists, it is staged into Remotion's public assets and included in the render.

## Optional local voice pipeline

The model-free render does not download Kokoro or Whisper. When you are ready to use local narration, follow `python/README.md`.

The adapter scripts write files under the project data directory:

```text
projects/sample/data/narration.wav
projects/sample/data/lines.json
projects/sample/data/timing.json
```

The current voice scripts do not call paid APIs and do not download models automatically. `python/align.py` requires FFmpeg and FFprobe on `PATH`.

## Project structure

```text
src/types/project.ts                 Project schema
src/core/timing.ts                   Timing model and frame conversion
src/core/captions.ts                 Caption parsing
src/core/validation.ts               Semantic validation
src/components/CaptionOverlay.tsx   Animated captions
src/styles/insideOut.tsx             2D style
src/styles/threeProof.tsx             Three.js proof scene
src/Root.tsx                          Remotion composition
scripts/validate-project.ts          Validation CLI
scripts/generate-timing.ts           Model-free timing CLI
scripts/prepare-render.ts            Validated render manifest and asset staging
python/voice.py                      Optional Kokoro adapter
python/align.py                      Optional Whisper adapter
tests/unit/                          Automated tests
```

## Known limitations

- The sample has no narration audio yet.
- Kokoro and faster-whisper model execution is optional and not run by default.
- Audio mixing, contact sheets, automated video QA, scene caching, the dashboard, research, video analysis, Telegram, and VPS deployment are not implemented yet.

See `docs/ARCHITECTURE_AUDIT.md` for the complete architecture decision and `DEVELOPMENT_STATUS.md` for verified progress.
