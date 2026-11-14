import {describe, expect, it} from 'vitest';
import {estimateTiming} from '../../src/core/timing';
import {validateProjectSemantics} from '../../src/core/validation';
import {parseProject} from '../../src/types/project';

function makeProject() {
  return parseProject({
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
}

describe('project validation', () => {
  it('accepts a connected project', () => {
    const project = makeProject();
    expect(validateProjectSemantics(project, estimateTiming(project))).toEqual([]);
  });

  it('reports an unconnected scene reference', () => {
    const project = makeProject();
    const broken = {...project, lines: [{...project.lines[0], sceneId: 'missing'}]};
    const issues = validateProjectSemantics(broken, estimateTiming(broken));
    expect(issues.some((issue) => issue.message.includes('Unknown scene'))).toBe(true);
  });
});
