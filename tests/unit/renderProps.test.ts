import {describe, expect, it} from 'vitest';
import {estimateTiming} from '../../src/core/timing';
import {normalizeRenderProps} from '../../src/core/renderProps';
import {parseProject} from '../../src/types/project';

const project = parseProject({
  id: 'render-props-test',
  title: 'Render Props Test',
  format: {width: 1080, height: 1920, fps: 30},
  targetDurationSeconds: 10,
  style: 'inside-out',
  voice: {provider: 'estimated', name: 'am_michael', speed: 1},
  music: {mode: 'none'},
  lines: [{id: 'l1', text: 'Hello world.', caption: 'HELLO *WORLD', sceneId: 's1', gapSeconds: 0.3}],
  scenes: [{id: 's1', lineId: 'l1', visualStyle: 'inside-out', description: 'Hello', environment: 'room', camera: {preset: 'push'}, animation: [], transition: 'cut', audioCues: []}],
  sources: [],
});

const fallback = {project, timing: estimateTiming(project)};

describe('render props', () => {
  it('accepts both a raw project and a wrapped render manifest', () => {
    expect(normalizeRenderProps(project, fallback).project.id).toBe(project.id);
    expect(normalizeRenderProps({project, timing: fallback.timing, narrationPath: 'generated/test.wav'}, fallback).narrationPath).toBe('generated/test.wav');
  });

  it('rejects stale timing text after a project edit', () => {
    const staleTiming = {...fallback.timing, lines: [{...fallback.timing.lines[0], text: 'Old text'}]};
    expect(() => normalizeRenderProps({project, timing: staleTiming}, fallback)).toThrow(/Timing text does not match/);
  });

  it('rejects provider timing with no word timings', () => {
    expect(() => normalizeRenderProps({project, timing: {...fallback.timing, estimated: false, words: []}}, fallback)).toThrow(/Non-estimated timing must contain words/);
  });
});
