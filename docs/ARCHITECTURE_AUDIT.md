# Universal AI Video Studio: Architecture Audit

**Date:** 2026-11-13  
**Scope:** `faceless-shorts-skill.zip` and `reel-maker-skill.zip` in this repository  
**Status:** Audit complete. No product implementation has started.

## Executive decision

Build one system with **Remotion as the only master compositor and timeline**, **React as the composition layer**, and **Three.js through the official `@remotion/three` / React Three Fiber integration for 3D scenes**. Keep Canvas/SVG/CSS inside Remotion for 2D work. Keep Python services for voice, alignment, audio analysis, and later video intelligence, but make them produce versioned JSON/WAV assets rather than render video independently.

The faceless archive contains the stronger working media algorithms and visual kits. The Reel Maker archive contains the stronger product-level direction for a Remotion-first composition, safe zones, simple storytelling, and low-cost audio policy. Reel Maker is a specification, not an implementation: it contains only `README.md` and `SKILL.md`, with no Remotion project or reusable source code.

The first build should be a **manual-input, 20–30 second, vertical MVP**. It should prove the complete local path with one style before adding research, LLM generation, video analysis, the dashboard, or the full style library.

## What was actually inspected

### Faceless Shorts archive

The archive has executable scripts, six complete style examples, browser Canvas/Three.js rendering, local Kokoro narration, faster-whisper alignment, procedural audio, and a headless Chrome/FFmpeg capture path.

Important files:

- `faceless-shorts/SKILL.md`: workflow, style rules, timing model, QA rules, and operating constraints.
- `faceless-shorts/scripts/voice.py`: local Kokoro-ONNX TTS, sentence grouping, pause detection, and line timing.
- `faceless-shorts/scripts/words.py`: faster-whisper word timestamps, script-to-speech alignment, and fallback timing.
- `faceless-shorts/scripts/estimate.py`: standard-library timing for captions-only drafts.
- `faceless-shorts/scripts/setup.sh`: Node/FFmpeg/Chrome/Python checks and model setup.
- `faceless-shorts/styles/*/STYLE.md`: six visual systems and their reusable component maps.
- `faceless-shorts/styles/*/example/src/main.js`: browser composition boot and `window.OP` capture API.
- `faceless-shorts/styles/deep-dive/example/src/core/engine.js`: Three.js renderer, lighting, tone mapping, postprocessing, and camera helpers.
- `faceless-shorts/styles/*/example/src/core/kit.js`: reusable 2D and style-specific drawing components.
- `faceless-shorts/styles/*/example/tools/capture.mjs`: headless Chrome frame capture and FFmpeg encoding.
- `faceless-shorts/styles/*/example/tools/mix.py`: procedural effects, optional music, ducking, and WAV mixing.

### Reel Maker archive

The archive has only:

- `reel-maker-skill/README.md`
- `reel-maker-skill/SKILL.md`

It does not contain a `package.json`, lockfile, Remotion entrypoint, React component, renderer, test, audio implementation, or Three.js integration. Its value is its composition contract and product rules, not reusable code.

### Repository state

The GitHub repository currently contains the two ZIP archives and no application source tree. The archives were extracted into a temporary audit directory for inspection only. No setup script, model download, render, or application test was run during this audit.

## Architecture comparison

| Area | Faceless Shorts | Reel Maker | Decision for the unified system |
|---|---|---|---|
| Primary renderer | Imperative browser Canvas plus hidden WebGL canvas; Chrome captures frames and FFmpeg encodes them | Remotion React composition is intended to own every frame | Remotion owns the final timeline and composition |
| 3D | Raw browser Three.js, vendored modules, custom renderer and postprocessing | No implementation | Use official `@remotion/three` integration; port only deterministic reusable Three.js scene logic |
| 2D | Canvas drawing helpers and per-style kits | React/CSS, Lucide, notebook layout | React/SVG/CSS/Canvas components inside Remotion |
| Timeline | Seconds, shot callbacks, `cut()` and `Wd()` helpers | Integer Remotion frames with scene starts tied to voice timing | Store canonical seconds in project JSON; convert to frames in one adapter |
| Voice | Kokoro-ONNX, 24 kHz WAV, whole-sentence synthesis | Kokoro is specified but not implemented; describes token timestamps | Reuse the tested faceless workflow first; expose a provider interface |
| Word alignment | faster-whisper `small.en`, CPU/int8, `SequenceMatcher`, proportional gap filling | Timing JSON contract is specified, but no aligner exists | Adopt faceless alignment and normalize output to one schema |
| Captions | Chunk strings with `|`; `*` marks highlight; word matching and fallback | 3–4 words, spoken word blue and underlined | One timing engine plus pluggable caption themes |
| Audio | Procedural FX, optional bed/tension music, ducking, 48 kHz stereo mix | Voice plus small UI sounds; music intentionally omitted | MVP uses voice plus optional procedural FX; add music later |
| Styles | Six actual style systems: Deep Dive, Night File, Inside Out, Stick Story, Paper Atlas, Tall Tale | One notebook style specification | Treat styles as packages implementing a shared renderer contract |
| Capture | Custom DevTools Protocol capture tool with `check`, `cues`, `sheet`, `frames`, `video` | Standard Remotion render workflow is proposed | Use Remotion CLI/API; retain contact sheets and scene-range rendering |
| QA | Strong frame/contact-sheet inspection guidance | Safe-zone and clarity checklist | Combine both into automated checks plus required still-frame review |
| API/UI | No local dashboard; skill guidance only | No dashboard; skill guidance only | Build FastAPI/React later, after the CLI pipeline is proven |
| Dependencies | Mostly unpinned Python packages, vendored Three.js, Chrome, FFmpeg | Suggested Remotion helpers, no lockfile | Pin versions, lock dependencies, and centralize shared packages |

## What to reuse

### Reuse directly or with small adapters

1. **Narration grouping and timing** from `scripts/voice.py`. Speaking a complete sentence once while allowing several visual cuts preserves natural intonation. This is better than synthesizing each caption line independently.
2. **Word alignment** from `scripts/words.py`. The normalization, `SequenceMatcher` alignment, and proportional timing fallback handle punctuation, pronunciation changes, and missed words better than a direct string lookup.
3. **No-voice draft timing** from `scripts/estimate.py`. This lets us build and inspect a visual draft before downloading or running models.
4. **Normalized project data idea** from `script.json`: narration lines, caption text, voice, speed, gaps, music choice, and sources.
5. **Pure time-based animation** from the faceless shot examples. Every scene must derive its state from the current frame/time and must not depend on render order.
6. **Deep Dive visual primitives**: the human pose model, x-ray material, organ shapes, camera movement, warm/cool light contrast, and no-gore visual language.
7. **Inside Out component kit**: it is the clearest 2D reusable library for a low-cost first style. The flat hero, organs, props, labels, warnings, and caption conventions are easy to port into React/SVG or Canvas.
8. **Paper Atlas and Stick Story design rules** for later low-cost styles. Both can avoid WebGL and therefore provide faster, CPU-friendly alternatives.
9. **Audio effect synthesis** from `tools/mix.py`, after the first visual render is stable. It avoids paid music and sample APIs.
10. **Contact sheet and QA discipline** from `SKILL.md` and the style manuals. The system must inspect stills before accepting a video.
11. **Reel Maker’s safe-zone layout and clarity rules**. The topic must remain visible, each scene shows one literal idea, and captions must stay out of platform UI zones.
12. **Reel Maker’s no-music-first policy**. It minimizes work and avoids licensing complexity for the MVP.

### Do not copy as-is

- Do not keep `window.OP` as the product rendering API.
- Do not maintain a second Chrome frame renderer beside Remotion.
- Do not copy six complete examples with duplicated `lib.js`, `timing.js`, `capture.mjs`, fonts, mixers, and Three.js trees.
- Do not use the vendored Three.js module as the long-term dependency graph. Use one pinned npm version and one integration boundary.
- Do not synthesize every visual cut as a separate TTS call.
- Do not make each style own an incompatible timing or caption implementation.
- Do not start with the full SDF, bloom, depth-of-field, high-shadow 3D stack on a CPU-only machine.
- Do not make an LLM, Gemini, yt-dlp, or cloud voice API a required dependency.

## Recommended rendering architecture

```text
Project JSON + optional manual script
             |
             v
  Voice provider -> narration.wav
             |
             v
 faster-whisper/aligner -> timing.json
             |
             +--------------------+
             |                    |
             v                    v
      Remotion timeline     Audio assets/cues
             |
     +-------+---------+
     |                 |
     v                 v
React/SVG/Canvas   @remotion/three
2D scenes          Three.js/R3F scenes
     |                 |
     +-------+---------+
             v
       captions + overlays
             |
             v
       Remotion renderMedia
             |
             v
           MP4
```

Remotion’s official Three integration is `@remotion/three`, which wraps React Three Fiber and synchronizes the scene with Remotion frame hooks. The official documentation recommends `layout="none"` for a `Sequence` inside a Three canvas and documents an `angle` OpenGL path for server-side rendering. Sources: [@remotion/three](https://www.remotion.dev/docs/three), [WebGL during renders](https://www.remotion.dev/docs/webgl), and [GL options](https://www.remotion.dev/docs/gl-options).

The first Three.js port should use a small deterministic scene:

- one camera and one light rig;
- one stylized hero or object;
- one environment preset;
- one x-ray material transition;
- no runtime random values unless seeded;
- state derived from `useCurrentFrame()`;
- no `requestAnimationFrame`, wall-clock time, or render-order mutation;
- a low-quality render preset for CPU fallback.

For heavy scenes, render individual scene ranges into cached artifacts only if measurement proves it helps. The default should remain one Remotion composition so audio, captions, transitions, and scene replacement share one contract.

## Canonical data contracts

### Project input

```json
{
  "id": "project-id",
  "format": { "width": 1080, "height": 1920, "fps": 30 },
  "duration": { "targetSeconds": 30 },
  "style": "inside-out",
  "voice": { "provider": "kokoro-onnx", "name": "am_michael", "speed": 1.0 },
  "music": { "mode": "none" },
  "lines": [
    {
      "id": "line-01",
      "text": "What if you swallowed gum?",
      "caption": "WHAT IF YOU | SWALLOWED *GUM?",
      "sceneId": "scene-01",
      "gapSeconds": 0.3
    }
  ],
  "scenes": [
    {
      "id": "scene-01",
      "visualStyle": "inside-out",
      "description": "Hero holds gum and looks at camera",
      "environment": "room",
      "camera": { "preset": "medium-push-in" },
      "animation": ["raise-gum", "blink"],
      "transition": "cut",
      "audioCues": []
    }
  ],
  "sources": []
}
```

### Normalized timing output

```json
{
  "durationSeconds": 30.0,
  "lines": [
    { "id": "line-01", "index": 0, "text": "...", "startSeconds": 0.45, "endSeconds": 2.1 }
  ],
  "words": [
    { "text": "gum", "lineIndex": 0, "startSeconds": 1.7, "endSeconds": 2.05 }
  ]
}
```

The adapter must provide `secondsToFrames(seconds, fps)` and frame-safe clamping. The source format can preserve faceless fields, but Remotion components should not read `data/lines.json` and `data/words.json` independently.

## Voice and captions recommendation

### Voice

Use `kokoro-onnx` plus the faceless `voice.py` behavior first. Cache the approximately 340 MB Kokoro model and voice files once in a user-level model directory. Cache the faster-whisper model separately. A repeat render must reuse existing models and audio artifacts whenever the script, voice, speed, and provider configuration have not changed.

Make voice a provider interface:

```text
VoiceProvider.generate(script, voice, speed) -> narration.wav + line timing
AlignmentProvider.align(audio, script) -> normalized word timing
```

Initial providers:

- `kokoro-local`: implemented first.
- `recording`: user WAV/M4A plus faster-whisper alignment.
- `estimated`: no-model draft mode.

Cloud providers remain optional and must never be needed for a local build.

### Captions

Use one timing model and theme configuration:

- `minimal`: 3–4 words, one accent word.
- `hormozi`: large bold text, highlighted keyword.
- `cinematic`: smaller subtitle lines.
- `typewriter`: Night File treatment.
- `paper`: Paper Atlas strip.
- `one-word`: Tall Tale treatment.

Caption chunks should resolve to actual word ranges during normalization. If a caption spelling differs from the spoken spelling, support an explicit word index or alias instead of relying only on a prefix match. Validate that every caption has a timing range and that text remains inside the safe zone.

## Audio recommendation

The first render uses narration only, plus at most one or two procedural effects. This follows Reel Maker’s decision to leave platform music out and removes a major source of licensing and mixing bugs.

The later audio engine can reuse the faceless mixer’s useful ideas:

- 48 kHz stereo output;
- voice normalization;
- procedural whoosh, pop, impact, slide, and riser effects;
- scene and word-tied cues;
- optional music ducking;
- a final loudness/true-peak QA pass.

Keep audio timing in the same normalized timeline as captions and animation. Do not create a separate timing convention inside Python.

## Dependency and licensing report

### Dependencies found or implied

Faceless Shorts:

- Node.js 22+;
- Chrome/Chromium;
- FFmpeg/FFprobe;
- Python 3.10+;
- `numpy`, `scipy`, `kokoro-onnx`, `faster-whisper`;
- Kokoro ONNX model and voice files;
- Whisper `small.en` model;
- vendored Three.js and postprocessing modules;
- bundled font files.

Reel Maker:

- Node.js;
- Remotion;
- React;
- the suggested `lucide-react`, `@remotion/google-fonts`, and `@remotion/media` packages;
- Kokoro and `soundfile` in its prose setup.

Neither archive has a lockfile, a pinned dependency manifest, model checksums, a version compatibility matrix, or an end-to-end test result.

### Remotion license checkpoint

The current official FAQ says the Free License covers an individual or organization/team with up to three people, including automation, while larger organizations building automation need the company plan. The FAQ lists `npx remotion render`, `renderMedia()`, and related APIs as automation cases. This must be checked against the actual ownership, team size, and distribution model before release. Source: [Remotion License FAQ](https://www.remotion.dev/docs/license/faq).

The archive’s statement that Remotion is free for small teams is therefore incomplete for a future product deployed for a larger organization. We should document the license decision in the project before shipping. H.264/AAC and other third-party codec rights also remain separate from the Remotion license.

Other audit concerns:

- The faceless README makes broad free-use claims, but the archive does not provide a complete per-asset license inventory.
- Three.js has a bundled license notice, but the archive duplicates vendor files across styles.
- Inter is identified as OFL in the README. Other bundled fonts should be individually verified before distribution.
- Models are downloaded at setup time and are not checksummed.
- Python dependencies are installed without a lockfile.
- `yt-dlp`, Gemini, OpenCV, and PySceneDetect are proposed by the master plan but are not present in either archive.

## Performance and hardware assessment

The system can run without a GPU, but 3D rendering is the main risk. The faceless Deep Dive documentation reports approximately two seconds per frame for a 37-second 3D short under software rendering after reducing resolution and anti-aliasing. That is roughly half an hour at 24 fps before retries and QA. Actual Remotion performance on this machine remains unmeasured.

Remotion’s current WebGL documentation describes automatic WebGL/software fallback in newer versions and recommends the relevant Chromium renderer configuration for Three.js. The project must benchmark this locally rather than assume the fallback is fast.

Cost-control and CPU-first rules:

1. Keep content, storyboard, and sources manual in the MVP. Do not call an LLM or vision API.
2. Use estimated timing for visual iteration; run Kokoro only after the script and shots are accepted.
3. Generate narration once and cache it by a content hash.
4. Run Whisper only when the audio or script changes; otherwise reuse timing JSON.
5. Render a short frame range or 360p/540p draft first.
6. Use 30 fps for the general product contract; allow a 24 fps cinematic preset if it materially reduces 3D cost.
7. Start with Inside Out or Paper Atlas for quick CPU validation, then add one small Three.js shot.
8. Keep music off initially. Procedural effects do not require API credits.
9. Use one final render, one contact sheet, and targeted stills around transitions rather than repeated full renders.
10. Add a render cache and per-scene invalidation before adding the dashboard.

## Proposed directory structure

### MVP structure

```text
universal-video-studio/
  backend/
    api/
    services/
    schemas/
  engines/
    voice/
    alignment/
    captions/
    timeline/
    rendering/
    quality/
  renderers/
    remotion/
    threejs/
    canvas/
    svg/
  styles/
    inside-out/
  projects/
  scripts/
  docs/
  tests/
    unit/
    rendering/
    quality/
  package.json
  pnpm-lock.yaml or package-lock.json
  pyproject.toml
  DEVELOPMENT_STATUS.md
  README.md
  .env.example
```

### Target structure after the MVP

```text
universal-video-studio/
  backend/
    api/
    services/
    providers/
    models/
    schemas/
  frontend/
    src/components/
    src/pages/
    src/services/
  engines/
    content/
    research/
    scripts/
    storyboard/
    video_analysis/
    voice/
    visuals/
    animation/
    audio/
    captions/
    timeline/
    rendering/
    quality/
  renderers/
    remotion/
    threejs/
    canvas/
    svg/
  styles/
    cinematic-realism/
    luxury-lifestyle/
    dark-psychology/
    documentary/
    educational/
    cartoon/
    futuristic/
    human-anatomy/
    infographics/
    anime/
    whiteboard/
    stick-story/
    paper-atlas/
  assets/
    models/
    textures/
    environments/
    music/
    sound-effects/
    fonts/
  projects/
  config/
  scripts/
  docs/
  tests/
  README.md
  DEVELOPMENT_STATUS.md
  .env.example
```

Each style package should implement a documented interface such as:

```text
StylePackage.metadata()
StylePackage.createScene(sceneSpec, assets)
StylePackage.render2D(state)
StylePackage.render3D(state)
StylePackage.captionTheme()
StylePackage.audioTheme()
StylePackage.validate(sceneSpec)
```

The core timeline and caption engines must not import a specific style.

## Implementation roadmap

1. **Audit:** complete. Record decisions and unknowns in this file.
2. **Foundation:** create the MVP project, dependency manifests, shared JSON schemas, timing adapter, cache layout, and status file.
3. **Voice:** port Kokoro generation and model caching; add estimated and recorded-audio modes.
4. **Alignment:** port faster-whisper alignment and fallback; normalize all timing output.
5. **Remotion timeline:** build a four-to-six-scene vertical composition with captions and audio.
6. **First style:** implement a low-cost Inside Out or Notebook-style 2D video.
7. **Three.js proof:** add one deterministic 3D hero scene using `@remotion/three`; benchmark still, one-second clip, and full draft.
8. **Audio:** add procedural cues and final normalization after visual timing is stable.
9. **Scene regeneration:** add manifest hashes and frame-range rendering/caching.
10. **QA:** implement metadata checks, black-frame checks, caption bounds, audio clipping checks, contact sheets, and required manual frame inspection.
11. **Automated production:** add manual topic-to-script/storyboard orchestration first; make LLM/research providers optional.
12. **Style library:** add styles one at a time, starting with 2D styles before expensive 3D styles.
13. **Video intelligence:** add yt-dlp, FFmpeg, PySceneDetect, OpenCV, and optional Gemini only after local creation is stable. Store observed and inferred attributes separately.
14. **Dashboard:** build FastAPI and React/Vite around the proven CLI.
15. **Five required videos:** render and evaluate each only after the MVP passes; do not hide failures behind placeholder output.
16. **VPS/Telegram:** explicitly deferred until local rendering and QA are reliable.

## MVP proposal for approval

### Deliverable

A local CLI that accepts a checked-in project JSON and produces:

- local Kokoro narration or estimated timing;
- normalized line and word timing JSON;
- one Remotion composition;
- animated captions;
- one 2D style and one small Three.js scene option;
- voice-only audio, with optional procedural effects;
- a draft render, contact sheet, QA report, and final MP4;
- a cached project manifest that allows one scene to be regenerated.

### Explicitly excluded from the MVP

- LLM script generation;
- web research and Gemini;
- YouTube/Instagram/TikTok downloading;
- video intelligence;
- dashboard;
- Telegram and VPS;
- all six or thirteen styles;
- paid APIs;
- generated images/video;
- full cinematic postprocessing;
- music licensing and platform publishing.

### MVP acceptance criteria

- A manual project JSON validates before rendering.
- A no-model estimated draft renders successfully.
- Local narration and word timing can be added without changing the visual composition code.
- Captions land on the normalized word intervals.
- At least one Remotion composition renders an MP4 at the requested dimensions and frame rate.
- One Three.js scene renders deterministically through the Remotion integration, or the blocker is documented with a reproducible error.
- A contact sheet and targeted still frames are generated and inspected.
- QA reports missing assets, invalid timing, text bounds, audio problems, and video metadata problems.
- `DEVELOPMENT_STATUS.md` records what passed, what failed, and what remains.

## Known technical problems to resolve during implementation

1. `kokoro-onnx` and the Reel Maker prose refer to different Kokoro package APIs. Use one implementation and pin it.
2. The faceless archive stores seconds and imperative shot callbacks; Remotion renders integer frames and React components. One adapter is required.
3. Raw browser Three.js code must be made deterministic and compatible with Remotion’s render lifecycle.
4. The existing Three.js postprocessing stack may be too slow or unstable under software WebGL. Start without bloom/DOF and add effects after benchmarks.
5. WebGL renderer configuration differs between Remotion versions and local/server APIs. Verify with the installed version and a real still render.
6. Caption aliases such as `7` versus spoken `seven` need explicit mapping.
7. Line-based cuts can split a sentence. Preserve whole-sentence TTS while deriving cut points from detected pauses.
8. Invalidation must distinguish changes to script, voice, timing, scene code, assets, and render settings.
9. The archive uses random texture/particle behavior in places. Seed all randomness or eliminate it.
10. Model downloads, fonts, sounds, and Three.js licenses need a machine-readable inventory before distribution.
11. Audio loudness and codec checks need actual FFmpeg measurements, not only a successful command exit.
12. Remotion’s current automation licensing must be checked against the eventual ownership and deployment model.
13. A 4-core CPU/16 GB RAM target is plausible for 2D and slow 3D drafts, but no benchmark has been run in this repository.
14. The final requested styles include genuine visual quality expectations that cannot be met by architecture alone. Each style requires rendered-frame review and iteration.

## Audit conclusion

The two archives complement each other. Faceless Shorts supplies working local media primitives, timing logic, styles, and QA habits. Reel Maker supplies a cleaner Remotion-first composition contract and a lower-cost product scope. The unified system should preserve those strengths while removing the duplicated browser renderer, duplicate timing systems, duplicate assets, and optional-service assumptions.

No implementation should begin until the MVP scope above is accepted. Once approved, implementation should start with the foundation and estimated-timing render so we can validate the Remotion pipeline without spending model or API credits.
