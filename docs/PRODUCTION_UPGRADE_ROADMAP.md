# Production Upgrade Roadmap

**Baseline branch:** `feature/stickman-story-video`  
**Baseline date:** 2026-11-14  
**Current product state:** local-first Remotion/Three.js renderer with an additive agent backend

## Phase 1 baseline audit

### Current architecture

- Remotion owns the composition, timing, scene sequences, captions, audio attachment, and final H.264 render.
- Three.js is integrated through `@remotion/three` for the 3D voice-studio style.
- `src/engines/story/director.ts` creates deterministic sentence-to-visual plans.
- `backend/app/orchestrator.py` owns a LangGraph-compatible Director path with task dependencies, parallel ready tasks, retry gates, SQLite/PostgreSQL seams, and Learning Supervisor lessons.
- `backend/app/prompting.py` routes prompt tasks through FreeLLMAPI-first configuration, direct GPT-compatible fallback, and deterministic local fallback.
- `backend/app/agent_reach.py` is an optional trend/competitor adapter for YouTube, Twitter/X, Reddit, Instagram, and TikTok channels when the Agent-Reach CLI is installed.
- `python/voice.py` generates local Kokoro narration.
- `python/align.py` generates aligned word timing with faster-whisper.
- `python/mix.py` generates procedural music and semantic transition SFX.
- `scripts/qa-video.ts` validates media metadata, audio presence, sampled blank frames, and caption safe-zone policy.
- `scripts/render-scenes.ts` renders scene ranges and strips segment audio; `scripts/stitch-scenes.ts` stitches the cached segments and muxes the global mix.
- `backend/app/workflow.py` provides terminal/API approval gates for script, style, storyboard, audio, captions, and render.

### Working functionality verified

- TypeScript and unit tests.
- Backend smoke tests.
- Full 1080×1920, 30 FPS narrated 3D render.
- Kokoro narration and faster-whisper alignment.
- Procedural music/SFX mix.
- H.264/yuv420p video and AAC 48 kHz stereo audio.
- Word-by-word captions driven from aligned words.
- Semantic UI screens for download, recording, voice design, generation, caption sync, and permission.
- Rendered scene-range cache and audio-bearing stitch.
- Page-scoped style/voice/audio/competitor memory.
- FreeLLMAPI-first and direct GPT fallback configuration.
- Agent-Reach optional trend/competitor integration.
- Terminal approval workflow.

### Current problems and technical debt

- The default 3D presenter is procedural. GLTF/GLB loading, animation clips, and generic visemes exist as optional hooks but are not calibrated to a shipped character.
- The current voice-studio environment uses a small procedural kit. It needs asset manifests, material/texture quality tiers, and scene-specific prop layouts.
- The current prompt/director fallback is deterministic. Provider-backed outputs are implemented behind adapters but require user credentials and structured-output validation.
- Raw-footage editing has a probe/audio/EDL baseline but not full silence/retake selection, transcript-driven cuts, B-roll placement, or final editor composition.
- Vision review is adapter-ready but not enabled without a Gemini or compatible vision key.
- Scene cache now renders/stitches but does not yet select cached segments automatically in Remotion; full cache invalidation/stitch orchestration remains a separate execution path.
- QA does not OCR rendered captions or prove semantic visual relevance. It performs deterministic media checks and safe-zone policy checks.
- Telegram has page/job commands and a bot service, but deployment still requires a bot token, authorized chat policy, and durable worker infrastructure.
- PostgreSQL is optional code with no production migration/deployment test in this local environment.

## Phase 2: asset-driven cinematic 3D

### Implementation

- Add a versioned asset manifest schema with license/source, bounds, materials, animation clips, morph aliases, and preview path.
- Add GLTF/GLB environment loading with static-file staging and a low-quality procedural fallback.
- Add a calibrated presenter asset profile and animation state map.
- Add deterministic clip sampling and morph/viseme cue application.
- Add asset preflight: missing files, unsupported animations, scale, camera bounds, texture size, and license metadata.
- Add material quality presets: VPS draft, standard, production.

### Acceptance criteria

- A supplied licensed GLB presenter can render in a scene without changing the scene contract.
- At least idle, talk, point, and record clips are selected from the asset’s animation map.
- A missing or incompatible asset falls back visibly and reports a warning.
- CPU/software WebGL still renders a draft.

## Phase 3: content intelligence and visual direction

### Implementation

- Use FreeLLMAPI first and direct GPT fallback for structured research, script, critic, prompt, and storyboard calls.
- Use Agent-Reach for opt-in/required trend and competitor research across supported channels.
- Add source/claim ledger and fact-check artifact.
- Add LLM response schema validation and bounded retries.
- Feed approved research into script generation, then feed approved script into the sentence-to-visual director.
- Add visual variation scoring and repetition warnings.

### Acceptance criteria

- No provider key means deterministic local mode still works.
- With a provider key, generated outputs are validated JSON artifacts rather than unstructured text.
- Each sentence receives subject, action, visual medium, camera, animation, UI, transition, and audio intent.
- Repeated visual components are reported before rendering.

## Phase 4: raw-footage editing

### Implementation

- Probe and normalize multiple takes.
- Transcribe actual audio with faster-whisper.
- Detect silence and retake candidates from word timing and RMS envelope.
- Produce an immutable edit decision list.
- Render selected clips with FFmpeg.
- Add optional face/speaker crop modes and a screen-cast mode.
- Reuse the existing caption, mix, QA, and contact-sheet contracts.

### Acceptance criteria

- A raw input can produce a validated edit plan without an LLM.
- A provider can score candidate moments without being required.
- A final edited MP4 preserves audio/video sync and reports selected source ranges.

## Phase 5: production QA and learning

### Implementation

- Add frame sampling at every scene boundary and transition.
- Add optional OCR/vision caption-bound validation.
- Add audio loudness/true-peak checks to QA JSON.
- Require render, audio, caption, and contact-sheet artifacts before completion.
- Persist QA failures as Learning Supervisor lessons.
- Require isolated regression runs before adopting a global lesson.

### Acceptance criteria

- Failed QA blocks final completion.
- A revision can target one scene or one artifact.
- Learning records the failure, correction, and result without modifying code automatically.

## Phase 6: Telegram/VPS operation

### Implementation

- Move job records to PostgreSQL when `DATABASE_URL` is configured.
- Add a durable worker backend and restart-safe queue.
- Add Telegram authorization allowlist, `/create`, `/status`, `/approve`, `/reject`, `/competitor`, and final document delivery.
- Keep local SQLite and deterministic mode as a development fallback.

### Acceptance criteria

- A Telegram request creates one page-scoped project.
- Approval decisions resume the correct graph state.
- A process restart does not lose task state or artifacts.
- Secrets never appear in logs or project artifacts.

## Phase 1 baseline result

The existing latest sample was rendered and inspected before this roadmap. The current final MP4 passes technical QA: 1080×1920, 30 FPS, H.264/yuv420p, AAC stereo at 48 kHz, no sampled blank frames, and caption safe-zone policy. The main quality ceiling is asset/character detail and provider-dependent content intelligence, not the Remotion export path.
