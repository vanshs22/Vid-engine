import {Composition, Sequence, AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {ReactNode} from 'react';
import sampleProject from '../projects/sample/project.json';
import {CaptionOverlay} from './components/CaptionOverlay';
import {captionsForLine} from './core/captions';
import {estimateTiming, secondsToFrames, timingForScene} from './core/timing';
import {normalizeRenderProps, type RenderProps} from './core/renderProps';
import {parseProject} from './types/project';
import {directScene} from './engines/story/director';
import {InsideOutScene} from './styles/insideOut';
import {ThreeProofScene} from './styles/threeProof';
import {StickStoryScene} from './styles/stickStory';
import {VoiceStudioScene} from './styles/voiceStudio';
import {VoiceStudio3DScene} from './styles/voiceStudio3D';
import {SceneTransition} from './transitions/sceneTransition';

const project = parseProject(sampleProject);
const timing = estimateTiming(project);
const fallbackRenderProps: RenderProps = {project, timing};

export const VIDEO_ID = 'UniversalVideoStudio';

export function Root() {
  return (
    <>
      <Composition
        id={VIDEO_ID}
        component={VideoComposition}
        durationInFrames={secondsToFrames(timing.durationSeconds, project.format.fps)}
        fps={project.format.fps}
        width={project.format.width}
        height={project.format.height}
        defaultProps={{project, timing}}
        calculateMetadata={({props}) => {
          const input = normalizeRenderProps(props, fallbackRenderProps);
          return {
            durationInFrames: secondsToFrames(input.timing.durationSeconds, input.project.format.fps),
            fps: input.project.format.fps,
            width: input.project.format.width,
            height: input.project.format.height,
          };
        }}
      />
    </>
  );
}

function VideoComposition(inputProps: unknown) {
  const {project, timing, narrationPath, musicPath, mixPath} = normalizeRenderProps(inputProps, fallbackRenderProps);
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: '#F4F1EA'}}>
      {project.scenes.map((scene) => {
        const range = timingForScene(timing, scene.lineId, fps);
        const line = project.lines.find((candidate) => candidate.id === scene.lineId);
        if (!line) return null;
        const captionChunks = captionsForLine(line, timing, project.captionStyle);
        const lineTiming = timing.lines.find((candidate) => candidate.lineId === line.id);
        const directedScene = scene.visualPlan ? scene : {...scene, visualPlan: directScene(line, scene)};
        return (
          <Sequence key={scene.id} from={range.from} durationInFrames={range.durationInFrames} name={scene.id}>
            <SceneLayer scene={directedScene} durationInFrames={range.durationInFrames}>
              {directedScene.visualStyle === 'three-proof' ? <ThreeProofScene scene={directedScene} /> : directedScene.visualStyle === 'stick-story' ? <StickStoryScene scene={directedScene} /> : directedScene.visualStyle === 'voice-studio-3d' ? <VoiceStudio3DScene scene={directedScene} /> : directedScene.visualStyle === 'voice-studio' ? <VoiceStudioScene scene={directedScene} /> : <InsideOutScene scene={directedScene} />}
              <CaptionOverlay chunks={captionChunks} offsetSeconds={lineTiming?.startSeconds ?? 0} theme={directedScene.visualStyle === 'voice-studio' || directedScene.visualStyle === 'voice-studio-3d' ? 'voice-studio' : 'default'} />
            </SceneLayer>
          </Sequence>
        );
      })}
      {mixPath ? <Audio src={staticFile(mixPath)} /> : narrationPath ? <Audio src={staticFile(narrationPath)} /> : null}
      {!mixPath && project.music.mode === 'file' && (musicPath ?? project.music.path) ? <Audio src={staticFile(musicPath ?? project.music.path!)} /> : null}
    </AbsoluteFill>
  );
}

function SceneLayer({scene, durationInFrames, children}: {scene: ProjectScene; durationInFrames: number; children: ReactNode}) {
  const frame = useCurrentFrame();
  return <AbsoluteFill>
    {children}
    <SceneTransition kind={scene.transition as 'cut' | 'fade' | 'crossfade' | 'flash' | 'slide' | 'zoom'} frame={frame} durationInFrames={durationInFrames} />
  </AbsoluteFill>;
}

type ProjectScene = ReturnType<typeof parseProject>['scenes'][number];
