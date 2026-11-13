import {describe, expect, it} from 'vitest';
import {captionsForLine, parseCaptionChunks} from '../../src/core/captions';
import {estimateTiming} from '../../src/core/timing';
import {parseProject} from '../../src/types/project';

const project = parseProject({
  id: 'caption-test',
  title: 'Caption Test',
  format: {width: 1080, height: 1920, fps: 30},
  targetDurationSeconds: 10,
  style: 'inside-out',
  voice: {provider: 'estimated', name: 'am_michael', speed: 1},
  music: {mode: 'none'},
  lines: [{id: 'l1', text: 'A clear idea works.', caption: 'A CLEAR *IDEA', sceneId: 's1', gapSeconds: 0.3}],
  scenes: [{id: 's1', lineId: 'l1', visualStyle: 'inside-out', description: 'Idea', environment: 'room', camera: {preset: 'push'}, animation: [], transition: 'cut', audioCues: []}],
  sources: [],
});

describe('captions', () => {
  it('maps a caption chunk to the spoken word window', () => {
    const timing = estimateTiming(project);
    const [chunk] = captionsForLine(project.lines[0], timing);
    const words = timing.words.filter((word) => word.lineId === 'l1');
    expect(chunk.highlight).toBe('IDEA');
    expect(chunk.startSeconds).toBe(words[0].startSeconds);
    expect(chunk.endSeconds).toBe(words.at(-1)!.endSeconds);
  });

  it('searches caption chunks forward when spoken words repeat', () => {
    const words = [
      {text: 'one', lineId: 'l1', lineIndex: 0, startSeconds: 0, endSeconds: 0.2},
      {text: 'one', lineId: 'l1', lineIndex: 0, startSeconds: 0.3, endSeconds: 0.5},
      {text: 'final', lineId: 'l1', lineIndex: 0, startSeconds: 0.6, endSeconds: 0.8},
    ];
    const chunks = parseCaptionChunks({...project.lines[0], caption: 'ONE | ONE *FINAL'}, words);
    expect(chunks[1].startSeconds).toBe(0.3);
    expect(chunks[1].highlight).toBe('FINAL');
  });
});
