# Development Status

**Project:** Universal AI Video Studio  
**Date:** 2026-11-13  
**Current phase:** Phase 3, stickman story MVP  
**Implementation status:** A 23.27-second model-free stickman story is rendered and inspected

## Completed

- Inspected `faceless-shorts-skill.zip`.
- Inspected `reel-maker-skill.zip`.
- Compared rendering, timing, voice, captions, audio, style, QA, dependencies, and hardware assumptions.
- Identified reusable components and components that should not be copied into the unified system.
- Investigated the official Remotion/Three.js integration direction.
- Wrote `docs/ARCHITECTURE_AUDIT.md` with the proposed MVP and roadmap.
- Created the Remotion project with pinned dependencies and a lockfile.
- Added a Zod project schema and semantic validation CLI.
- Added estimated timing and seconds-to-frames conversion.
- Added a shared caption parser and overlay.
- Added a CPU-friendly 2D scene style.
- Added a reusable stickman story style with bus, home, dog, keys, props, movement, reveal beats, and payoff scene.
- Added a deterministic `@remotion/three` proof scene.
- Added estimated and provider-bound timing artifacts.
- Added local Kokoro and faster-whisper Python adapter scripts without automatic model downloads.
- Added a timing generation CLI and validated render-manifest preparation with timing artifact injection.
- Added raw-project and wrapped-render-props normalization so documented direct props and prepared props use one contract.
- Added narration asset staging into Remotion public assets when `data/narration.wav` exists.
- Added schema and semantic checks for unique scene/line relationships, timing text, timing coverage, and ordered words.
- Added fade handling for declared fade/crossfade scene transitions.
- Hardened caption matching for repeated words and clamps caption ranges to line timing.
- Fixed scene ranges so configured gaps and the outro hold the last visual instead of producing blank frames.
- Added a timing regression test for final-scene coverage.
- Added unit tests for timing, project validation, captions, and render props.
- Passed TypeScript checks, unit tests, semantic validation, and a production dependency audit.
- Rendered and inspected foundation still frames, including caption timing, 3D output, and the final scene.
- Rendered and verified `out/draft.mp4` as an MP4 artifact using Remotion’s `swangle` software WebGL path.
- Added a single `npm run check` handoff command and documented local setup, draft render, final render, and optional voice commands.

## Not yet completed

- Execute and verify Kokoro narration with local model files.
- Execute and verify faster-whisper alignment with FFmpeg/FFprobe.
- Verify narration audio in a rendered MP4.
- Narration audio mixing.
- Contact sheet automation.
- Automated MP4 metadata, audio, black-frame, and safe-zone QA.
- Scene cache and individual scene regeneration.
- FastAPI backend and React/Vite dashboard.
- LLM/research/video intelligence providers.
- Additional visual styles.
- Five required evaluation videos.
- VPS and Telegram integration.

## Verification record

Passed on 2026-11-13:

- `npm run typecheck`
- `npm test`: 4 test files, 10 tests passed
- `npm run validate`: `stickman-last-bus` valid, estimated duration 23.27 seconds
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities
- `npm run timing -- projects/sample/project.json`: timing artifact generated, 23.27 seconds
- `npm run prepare:render`: validated `.tmp/render-props.json` generated
- `python3 -m py_compile python/voice.py python/align.py`: provider adapters syntactically valid
- `npm run render:still`: stickman captioned still rendered and inspected
- `npm run render:draft`: 698-frame, 540x960, 23.27-second stickman MP4 rendered
- Manual inspection: opening frame, inter-scene frame, final/outro frame, and uncropped dog payoff inspected
- Manual inspection: caption frame, Three.js frame, and final frame reviewed

The host lacks system Chromium and FFmpeg binaries. Remotion downloaded its headless shell and rendered successfully with `swangle`; standalone FFmpeg-based audio and media utilities remain blocked until FFmpeg is installed. The model-backed narration path is code-wired but not verified without the local model files.

## Next gate

Local testing of the documented commands. After the sample render works on the target machine, install the optional local Kokoro dependencies and model files, then run the voice provider and faster-whisper alignment.
