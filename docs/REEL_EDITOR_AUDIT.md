# Reel Editor Archive Audit

The `reel-editor.zip` uploaded to GitHub main contains only `README.md`, `SKILL.md`, and `CONNECTORS.md`. It is not an executable editor application.

## Reusable workflow ideas

- Separate raw footage, style references, assets, and edit outputs.
- Learn style from reference reels before cutting.
- Transcribe audio with word timestamps.
- Choose the strongest hook rather than preserving chronological source order.
- Remove retakes, false starts, stutters, and long pauses.
- Plan visuals sentence by sentence.
- Place concrete visuals when their words are spoken.
- Keep captions short and word-timed.
- Check safe zones and avoid covering faces.
- Re-transcribe and inspect the final output.
- Store change notes as learned editing rules.

## Missing implementation

- No Python package.
- No editor timeline.
- No Remotion compositions.
- No FFmpeg scripts.
- No SQLite/project state.
- No agent orchestration.
- No tests.
- Apify and Higgsfield are optional connector instructions, not dependencies.

## Integration decision

Use the archive as the Mode B editing specification. The new backend agent layer stores its artifacts in a project workspace and delegates actual media operations to the existing Remotion, Python, FFmpeg, and QA tools. No paid connector is required for the local MVP.
