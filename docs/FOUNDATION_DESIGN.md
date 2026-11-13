# Foundation Design

## Boundary

The Remotion composition owns all frame timing, scene sequencing, captions, 2D overlays, and final output. Python providers will later create audio and timing artifacts, but they will not render video.

## Current implementation

- `src/types/project.ts`: Zod project contract.
- `src/core/timing.ts`: estimated timing, normalized timing types, and seconds/frame conversion.
- `src/core/captions.ts`: caption chunk parsing and word-range lookup.
- `src/core/renderProps.ts`: raw/wrapped props normalization and timing validation.
- `src/core/validation.ts`: semantic project and timing checks.
- `src/components/CaptionOverlay.tsx`: safe-zone caption rendering with highlighted words.
- `src/styles/insideOut.tsx`: CPU-friendly 2D visual style.
- `src/styles/threeProof.tsx`: deterministic `@remotion/three` proof scene.
- `src/Root.tsx`: Remotion composition registration, dynamic timing metadata, and scene sequencing.
- `scripts/validate-project.ts`: CLI validation.
- `scripts/generate-timing.ts`: model-free timing artifact generation.
- `python/voice.py`: optional local Kokoro adapter.
- `python/align.py`: optional local faster-whisper adapter.

## Deliberate limitations

Kokoro and faster-whisper model execution is not enabled by default. The composition uses estimated timing unless a validated timing artifact is supplied by `scripts/prepare-render.ts`. A staged narration WAV is included automatically when it exists under the project data directory. Audio mixing and full QA remain future work.
