# Claude Animation Skills Integration

Source inspected: [iart-ai/claude-animation-skills](https://github.com/iart-ai/motion-skills), MIT.

The repository is a catalog of agent instructions and verification helpers, not a runtime library. We integrated the useful production rules into the existing system instead of copying all packs or adding a large dependency:

- Frame-driven animation from `useCurrentFrame()`.
- Easing and motivated motion instead of CSS/wall-clock animation.
- Scene-specific transitions rather than transitions on every cut.
- Safe-area and phone-size review.
- Start/mid/end frame inspection.
- Contact sheets as a required review artifact.
- MP4 probe/assert checks after encoding.
- Style-specific animation profiles.
- Explicit deliver-and-verify loops.

The existing project already has `scripts/contact-sheet.mjs` and `scripts/qa-video.ts`. This integration adds a portable `scripts/probe-mp4.sh` contract for environments with system FFprobe and keeps the bundled Remotion FFprobe fallback in the TypeScript QA path.

The project does not install iArt’s hosted MCP or require credits. External motion packs can still be installed separately when a project needs a specialized style, while the core renderer remains Remotion/Three.js and local-first.
