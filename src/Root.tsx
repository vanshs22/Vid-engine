import {Composition, Sequence, AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {ReactNode} from 'react';
import sampleProject from '../projects/sample/project.json';
import {CaptionOverlay} from './components/CaptionOverlay';
import {captionsForLine} from './core/captions';
import {estimateTiming, secondsToFrames, timingForScene} from './core/timing';
import {normalizeRenderProps, type RenderProps} from './core/renderProps';
import {parseProject} from './types/project';
import {InsideOutScene} from './styles/insideOut';
import {ThreeProofScene} from './styles/threeProof';
import {StickStoryScene} from './styles/stickStory';
import {VoiceStudioScene} from './styles/voiceStudio';
import {VoiceStudio3DScene} from './styles/voiceStudio3D';

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
  const {project, timing, narrationPath, musicPath} = normalizeRenderProps(inputProps, fallbackRenderProps);
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: '#F4F1EA'}}>
      {project.scenes.map((scene) => {
        const range = timingForScene(timing, scene.lineId, fps);
        const line = project.lines.find((candidate) => candidate.id === scene.lineId);
        if (!line) return null;
        const captionChunks = captionsForLine(line, timing);
        const lineTiming = timing.lines.find((candidate) => candidate.lineId === line.id);
        return (
          <Sequence key={scene.id} from={range.from} durationInFrames={range.durationInFrames} name={scene.id}>
            <SceneLayer scene={scene} durationInFrames={range.durationInFrames}>
              {scene.visualStyle === 'three-proof' ? <ThreeProofScene scene={scene} /> : scene.visualStyle === 'stick-story' ? <StickStoryScene scene={scene} /> : scene.visualStyle === 'voice-studio-3d' ? <VoiceStudio3DScene scene={scene} /> : scene.visualStyle === 'voice-studio' ? <VoiceStudioScene scene={scene} /> : <InsideOutScene scene={scene} />}
              <CaptionOverlay chunks={captionChunks} offsetSeconds={lineTiming?.startSeconds ?? 0} theme={scene.visualStyle === 'voice-studio' || scene.visualStyle === 'voice-studio-3d' ? 'voice-studio' : 'default'} />
            </SceneLayer>
          </Sequence>
        );
      })}
      {narrationPath ? <Audio src={staticFile(narrationPath)} /> : null}
      {project.music.mode === 'file' && (musicPath ?? project.music.path) ? <Audio src={staticFile(musicPath ?? project.music.path!)} /> : null}
    </AbsoluteFill>
  );
}

function SceneLayer({scene, durationInFrames, children}: {scene: ProjectScene; durationInFrames: number; children: ReactNode}) {
  const frame = useCurrentFrame();
  const fadeFrames = Math.min(12, Math.max(1, Math.floor(durationInFrames / 2)));
  const opacity = scene.transition === 'cut'
    ? 1
    : interpolate(frame, [0, fadeFrames, Math.max(fadeFrames, durationInFrames - fadeFrames), durationInFrames], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
}

type ProjectScene = ReturnType<typeof parseProject>['scenes'][number];
