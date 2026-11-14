# Universal Video Studio Asset Library

This is the local reusable library selected by asset IDs and motion presets.

## Included

- `catalog.json`: asset metadata, paths, tags, and licenses.
- `transitions.json`: frame-driven transition choices and story-use rules.
- `viral-presets.json`: hook, pacing, literal-action, caption, reaction, and sound heuristics. These are not guarantees of virality and do not copy creator-specific work.
- `models/RobotExpressive.glb`: optional CC0 animated GLTF presenter.
- `audio/sfx/`: generated whoosh, swirl, click, pop, impact, riser, success, sparkle, and tick sounds.
- `audio/music/`: generated cinematic, technology, and suspense beds.

## Asset rules

1. Every non-generated asset needs a source and license entry.
2. User-provided assets remain in the project workspace unless explicitly copied into this library.
3. Unknown or incompatible assets fall back to the procedural renderer.
4. The library is local and VPS-compatible. No paid asset API is required.
5. The Director selects assets by semantic tags and style requirements; it does not load the entire library into every render.

Generate or refresh the procedural audio library with:

```bash
.venv/bin/python python/generate_asset_library.py
```
