import {useAnimations, useGLTF} from '@react-three/drei';
import {useEffect, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {applyMouthMorphs} from '../animation/visemes';
import {chooseClip, type AnimationClipMap, type AnimationState} from '../animation/stateMachine';

export function GltfCharacter({url, state = 'idle', clips = {}, position = [0, 0, 0] as [number, number, number], scale = 1}: {url: string; state?: AnimationState; clips?: AnimationClipMap; position?: [number, number, number]; scale?: number}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const group = useRef<any>(null);
  const gltf = useGLTF(url);
  const animation = useAnimations(gltf.animations, group);
  const clip = chooseClip(state, clips);

  useEffect(() => {
    if (!group.current) return;
    const time = frame / fps;
    for (const action of Object.values(animation.actions)) {
      if (!action) continue;
      action.reset();
      action.paused = true;
      action.time = time;
    }
    if (clip && animation.actions[clip]) {
      animation.actions[clip]!.play();
      animation.actions[clip]!.paused = true;
      animation.actions[clip]!.time = time;
    }
    applyMouthMorphs(gltf.scene, state === 'talk' ? 0.35 + Math.abs(Math.sin(time * 8)) * 0.55 : 0);
  }, [animation.actions, clip, fps, frame, gltf.scene, state]);

  return <group ref={group} position={position} scale={scale}><primitive object={gltf.scene} /></group>;
}
