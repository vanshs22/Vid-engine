import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Scene} from '../types/project';

export function InsideOutScene({scene}: {scene: Scene}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const pulse = 1 + Math.sin(t * 5) * 0.035;
  const entrance = interpolate(frame, [0, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const xray = scene.description.toLowerCase().includes('x-ray') || scene.description.toLowerCase().includes('inside');

  return (
    <AbsoluteFill style={{backgroundColor: xray ? '#102f42' : '#F4F1EA', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, opacity: 0.25, backgroundImage: 'linear-gradient(#8aa0aa 1px, transparent 1px), linear-gradient(90deg, #8aa0aa 1px, transparent 1px)', backgroundSize: '72px 72px'}} />
      <div style={{position: 'absolute', top: 190, left: 90, right: 90, color: xray ? '#B9F4FF' : '#141414', fontFamily: 'Arial, sans-serif', fontSize: 34, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase'}}>
        {xray ? 'INSIDE THE SYSTEM' : 'A SIMPLE EXPLAINER'}
      </div>
      <div style={{position: 'absolute', top: 390, left: 90, right: 90, color: xray ? '#FFFFFF' : '#141414', fontFamily: 'Arial, sans-serif', fontSize: 92, lineHeight: 0.96, fontWeight: 900, transform: `translateY(${(1 - entrance) * 45}px)`, opacity: entrance}}>
        {scene.description}
      </div>
      <div style={{position: 'absolute', left: 160, top: 790, width: 760, height: 590, transform: `scale(${pulse})`, transformOrigin: 'center'}}>
        <div style={{position: 'absolute', left: 250, top: 0, width: 260, height: 260, borderRadius: '50%', background: xray ? '#D9FBFF' : '#E8B89A', border: `18px solid ${xray ? '#4FD1E8' : '#1A1A1E'}`}} />
        <div style={{position: 'absolute', left: 190, top: 240, width: 380, height: 300, borderRadius: '45% 45% 30% 30%', background: xray ? 'rgba(79, 209, 232, 0.3)' : '#3B62DB', border: `18px solid ${xray ? '#4FD1E8' : '#1A1A1E'}`}} />
        <div style={{position: 'absolute', left: 285, top: 315, width: 190, height: 165, borderRadius: '50%', background: xray ? '#E57A8A' : '#FFD43B', border: `12px solid ${xray ? '#FFB4C0' : '#1A1A1E'}`, transform: `rotate(${Math.sin(t * 3) * 8}deg)`}} />
        <div style={{position: 'absolute', left: 120, top: 285, width: 130, height: 300, borderRadius: 80, background: xray ? '#4FD1E8' : '#E8B89A', border: `18px solid ${xray ? '#B9F4FF' : '#1A1A1E'}`, transform: 'rotate(18deg)'}} />
        <div style={{position: 'absolute', left: 510, top: 285, width: 130, height: 300, borderRadius: 80, background: xray ? '#4FD1E8' : '#E8B89A', border: `18px solid ${xray ? '#B9F4FF' : '#1A1A1E'}`, transform: 'rotate(-18deg)'}} />
      </div>
      <div style={{position: 'absolute', bottom: 530, left: 90, color: xray ? '#B9F4FF' : '#8A8A8A', fontFamily: 'Arial, sans-serif', fontSize: 28}}>{scene.environment} · {scene.camera.preset}</div>
    </AbsoluteFill>
  );
}
