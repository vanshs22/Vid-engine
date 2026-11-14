# Stickman Director and OpenShorts Integration

## Sources inspected

- [Kaomei Stickman Video Director](https://github.com/kaomei/stickman-video-director), MIT.
- [OpenShorts](https://github.com/mutonby/openshorts), MIT.

## Reusable improvements

### Stickman Director

- Freeze a character anchor so every scene preserves identity.
- Use a five-beat story rhythm: hook, assumption break, reveal, truth, payoff.
- Plan concrete physical actions instead of abstract morphing.
- Keep important objects and movement direction continuous across clips.
- Put a visual change in the first three seconds and avoid idle shots.
- Treat style, ratio, voice, captions, and audio as explicit profile inputs.

Our `stick-story` renderer remains procedural and local, but the new profile contract gives future scene generators explicit character and motion rules.

### OpenShorts

- Transcribe long-form input before selecting clips.
- Score hooks and candidate moments instead of taking fixed chronological slices.
- Use layout modes: `TRACK`, `GENERAL`, `SPLIT`, and `SCREENCAST`.
- Keep word-level captions tied to the final audio.
- Treat speaker count and screen content as layout inputs.
- Expose the pipeline through an agent/API boundary.
- Keep CPU fallback when face detection or an LLM is unavailable.

Our new `backend/app/longform.py` implements the local planning and rendering seam. It accepts an optional transcript and deterministic fallback windows, assigns a crop mode, scores hooks, and can render 9:16 clips with FFmpeg. Face tracking, speaker diarization, and provider-backed moment scoring remain optional adapters rather than mandatory dependencies.
