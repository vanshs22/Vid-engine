export type AnimationState = 'idle' | 'breathe' | 'talk' | 'point' | 'record' | 'celebrate';

export type AnimationClipMap = Partial<Record<AnimationState, string>>;

export function stateForFrame(state: AnimationState, frame: number, fps: number) {
  const t = frame / fps;
  if (state === 'talk') return {phase: t * 8, intensity: 0.8};
  if (state === 'point') return {phase: t * 2.5, intensity: 1};
  if (state === 'record') return {phase: t * 6, intensity: 0.5};
  if (state === 'celebrate') return {phase: t * 4, intensity: 1};
  return {phase: t * 1.5, intensity: 0.25};
}

export function chooseClip(state: AnimationState, clips: AnimationClipMap): string | null {
  return clips[state] ?? clips.idle ?? null;
}
