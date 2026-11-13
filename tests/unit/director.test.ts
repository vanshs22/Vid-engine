import {describe, expect, it} from 'vitest';
import {directScene} from '../../src/engines/story/director';
import {parseProject} from '../../src/types/project';

const base = parseProject({
  id: 'director-test', title: 'Director', format: {width: 1080, height: 1920, fps: 30}, targetDurationSeconds: 10,
  style: 'voice-studio-3d', voice: {provider: 'estimated', name: 'am_michael', speed: 1}, music: {mode: 'none'},
  lines: [{id: 'l1', text: 'Download the application.', caption: 'DOWNLOAD IT', sceneId: 's1', gapSeconds: 0.2}],
  scenes: [{id: 's1', lineId: 'l1', visualStyle: 'voice-studio-3d', description: 'Workflow', environment: 'studio', camera: {preset: 'push'}, animation: [], transition: 'cut', audioCues: []}],
  sources: [],
});

describe('sentence-to-visual director', () => {
  it('selects a download UI for download narration', () => {
    expect(directScene(base.lines[0], base.scenes[0]).uiComponent).toBe('download');
  });

  it('selects permission visuals for rights language', () => {
    const line = {...base.lines[0], text: 'Use only a voice you own or have permission to use.'};
    expect(directScene(line, base.scenes[0]).uiComponent).toBe('permission');
  });
});
