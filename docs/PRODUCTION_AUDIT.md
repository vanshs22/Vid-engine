# Production Upgrade Audit

**Date:** 2026-11-13  
**Audited branch:** `feature/stickman-story-video`  
**Scope:** Current Remotion workflow, reference `VoiceSt.mp4`, and current `out/final.mp4`.

## Verified root causes

- The current `voice-studio` renderer is an SVG illustration in `src/styles/voiceStudio.tsx`. It contains no Three.js scene, perspective camera, 3D geometry, skeletal character, shadows, or GLTF assets.
- The only Three.js implementation is `src/styles/threeProof.tsx`, an isolated rotating icosahedron proof scene. The current sample does not use it.
- Scene metadata such as `environment`, `camera.preset`, and `animation` is stored in JSON but the SVG style chooses behavior from numeric scene IDs.
- `narrationPath` is optional in `src/core/renderProps.ts` and the sample has no narration WAV. The current `out/final.mp4` contains H.264 video only and no audio stream.
- The optional Python Kokoro and faster-whisper scripts are not executed by the render command. They require model files and external Python/media dependencies.
- `audioCues` and procedural music are schema-level fields only. No mixer consumes them.
- Draft rendering uses `--scale=0.5`, producing 540×960. Full rendering is 1080×1920, but the current quality is still dominated by the SVG style.
- Timing starts after a 0.45-second lead-in. Scene ranges now cover configured line gaps and the outro, but fade transitions reveal the root background and `crossfade` is not a true overlapping crossfade.
- The current automated checks cover TypeScript, unit helpers, project validation, timing generation, and dependency vulnerabilities. They do not check final audio, output metadata, black frames, caption bounds, or contact sheets.

## Reference traits measured

`reference/VoiceSt.mp4` is approximately 68.97 seconds, 720×1280, 30 FPS, H.264 video with an AAC stereo audio stream. Its broad visual techniques are a warm dark studio, a seated presenter, a floating orange voice orb, stable environment continuity, dark rounded software UI cards, cream serif UI headlines, gold lower-third captions, progress bars, waveform/slider motion, and a final permission reminder.

## Upgrade implemented in this phase

- Add a separate Three.js `voice-studio-3d` renderer rather than deleting the existing SVG fallback.
- Use deterministic frame-based animation for the 3D studio, presenter, orb, camera, UI overlays, and product controls.
- Keep the current JSON scene contract and select the new renderer per scene.
- Add a real output QA script using the bundled Remotion FFmpeg/FFprobe binaries when system binaries are unavailable.
- Add output metadata, audio-track, black-frame, and duration checks.
- Render the same topic at full 1080×1920 output and inspect representative frames.

## Remaining blockers

A real Kokoro narration render still requires downloading the local Kokoro model/voice files and installing the optional Python dependencies. Until that is done, the 3D sample can be rendered with estimated timing but must not be claimed to contain narration audio. The new QA gate reports that limitation instead of silently treating a video-only MP4 as complete.
