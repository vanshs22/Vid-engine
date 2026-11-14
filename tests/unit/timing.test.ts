import {describe, expect, it} from 'vitest';
import {estimateTiming, framesToSeconds, secondsToFrames, timingForScene} from '../../src/core/timing';
import {parseProject} from '../../src/types/project';

const project = parseProject({
  id: 'test',
  title: 'Test',
  format: {width: 1080, height: 1920, fps: 30},
  targetDurationSeconds: 10,
  style: 'inside-out',
  voice: {provider: 'estimated', name: 'am_michael', speed: 1},
  music: {mode: 'none'},
  lines: [{id: 'l1', text: 'Hello world.', caption: 'HELLO *WORLD', sceneId: 's1', gapSeconds: 0.3}],
  scenes: [{id: 's1', lineId: 'l1', visualStyle: 'inside-out', description: 'Hello', environment: 'room', camera: {preset: 'push'}, animation: [], transition: 'cut', audioCues: []}],
  sources: [],
});

describe('timing', () => {
  it('creates monotonic line and word timing', () => {
    const timing = estimateTiming(project);
    expect(timing.estimated).toBe(true);
    expect(timing.words).toHaveLength(2);
    expect(timing.words[0].startSeconds).toBeLessThan(timing.words[1].startSeconds);
    expect(timing.durationSeconds).toBeGreaterThan(timing.lines[0].endSeconds);
  });

  it('holds the final scene through the outro instead of leaving blank frames', () => {
    const timing = estimateTiming(project);
    const range = timingForScene(timing, 'l1', 30);
    expect(range.from + range.durationInFrames).toBe(secondsToFrames(timing.durationSeconds, 30));
  });

  it('converts seconds to frame boundaries predictably', () => {
    expect(secondsToFrames(1.5, 30)).toBe(45);
    expect(framesToSeconds(45, 30)).toBe(1.5);
  });
});
