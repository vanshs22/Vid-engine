import {AbsoluteFill, interpolate} from 'remotion';

export type SceneTransitionKind = 'cut' | 'fade' | 'crossfade' | 'flash' | 'slide' | 'zoom';

export function SceneTransition({kind, frame, durationInFrames}: {kind: SceneTransitionKind; frame: number; durationInFrames: number}) {
  if (kind === 'cut') return null;
  const entrance = interpolate(frame, [0, Math.min(12, durationInFrames)], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (kind === 'flash') return <AbsoluteFill style={{backgroundColor: '#FFF6E4', opacity: entrance * 0.82, pointerEvents: 'none'}} />;
  if (kind === 'slide') return <AbsoluteFill style={{backgroundColor: '#F1C66D', opacity: entrance * 0.72, transform: `translateX(${interpolate(frame, [0, 14], [-100, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}%)`, pointerEvents: 'none'}} />;
  if (kind === 'zoom') return <AbsoluteFill style={{backgroundColor: '#F5E9D1', opacity: entrance * 0.24, transform: `scale(${interpolate(frame, [0, 14], [1.12, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})})`, pointerEvents: 'none'}} />;
  return <AbsoluteFill style={{backgroundColor: '#F5E9D1', opacity: entrance * 0.72, pointerEvents: 'none'}} />;
}
