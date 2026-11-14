# Optional local voice and alignment providers

These scripts are optional and are not imported by the Remotion renderer. They do not call paid APIs.

## Model-free mode

The default foundation uses estimated timing and needs no Python packages or model files:

```bash
npm run timing -- projects/sample/project.json
npm run render:still
```

## Kokoro narration

Install the local packages in an isolated environment:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install kokoro-onnx numpy scipy
```

Place the Kokoro ONNX model and voice file under `KOKORO_HOME`, or pass `--model` and `--voices`. The script does not download model files automatically.

Run:

```bash
python python/voice.py projects/sample/project.json
```

This writes:

```text
projects/sample/data/narration.wav
projects/sample/data/lines.json
```

## faster-whisper alignment

Install the aligner separately:

```bash
pip install faster-whisper numpy
```

Install FFmpeg and FFprobe, or use the bundled Remotion compositor binaries. The adapter automatically falls back to `node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg` and `ffprobe` when system binaries are unavailable.

```bash
python python/align.py projects/sample/project.json --model /path/to/whisper-small-en
```

If you explicitly want faster-whisper to download the named model, use:

```bash
python python/align.py projects/sample/project.json --model small.en --allow-model-download
```

The aligner writes:

```text
projects/sample/data/timing.json
```

The timing artifact must contain word timings before word-synchronized captions can render. The render preparation command validates this automatically:

```bash
npm run prepare:render
npm run render:draft
```

## Procedural music and effects mix

After narration and timing are available:

```bash
npm run mix:audio
```

This creates `projects/sample/data/mix.wav` at 48 kHz stereo. The mix contains Kokoro narration, a restrained procedural music bed, and scene-transition whooshes. Remotion stages the mix automatically when it exists.
