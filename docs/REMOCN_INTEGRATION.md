# Remocn integration

The provided `https://github.com/Remocn/remocn` repository is MIT-licensed and provides copy-paste Remotion animations, transitions, captions, and scenes.

This project does not add Remocn as a runtime dependency. The current integration keeps owned, small frame-driven transition code in `src/transitions/sceneTransition.tsx`, using the same Remotion principle of deriving all motion from `useCurrentFrame()`.

Supported transition kinds:

- `cut`
- `fade`
- `crossfade` fallback overlay
- `flash`
- `slide`
- `zoom`

The `voice-studio` sample uses semantic transition choices for download, recording, generation, and final permission beats. The implementation remains CPU/software-WebGL compatible and avoids pulling a large component registry into the production bundle.
