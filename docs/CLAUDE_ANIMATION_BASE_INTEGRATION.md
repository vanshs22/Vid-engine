# ClaudeAnimationBase integration

Source inspected: [JohnHeibel/ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase), MIT.

The repository provides a p5.js/p5.brush hand-painted animation base with a character model, acted emotions, drawn key views, boiling linework, anticipation/follow-through, scene transitions, and a render/contact-sheet workflow.

Our integration is capability-based rather than a second renderer:

- `claude-animation-base` is selected for hand-painted/acted character requests.
- `claude-stickman` remains selected for stickman story requests.
- The existing `stick-story` renderer is the CPU-safe fallback.
- The new `claude-animation` visual style routes to that fallback until a project explicitly supplies a p5 animation asset/adapter.
- The motion profile records the source principles: no idle shots, one event per shot, acted transitions, one world, linked scenes, and timing based on viewer reads.

We do not copy the upstream Clawd character or bundled assets into the project. User-owned or licensed character assets can be supplied through the GLTF/asset contract.
