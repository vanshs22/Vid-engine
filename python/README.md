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

Install FFmpeg and FFprobe and make both commands available on `PATH`. Provide a local faster-whisper model directory to avoid an automatic download:

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
