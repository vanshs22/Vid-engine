import {ThreeCanvas} from '@remotion/three';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Scene} from '../types/project';

export function ThreeProofScene({scene}: {scene: Scene}) {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const rotation = interpolate(frame, [0, 90], [0, Math.PI * 1.4], {extrapolateLeft: 'clamp', extrapolateRight: 'extend'});
  const glow = 0.5 + Math.sin(frame / 12) * 0.25;

  return (
    <ThreeCanvas width={width} height={height} camera={{fov: 42, position: [0, 0, 7]}} style={{backgroundColor: '#0D1C2A'}}>
      <ambientLight intensity={0.55} />
      <pointLight position={[2, 3, 4]} intensity={2.3} color="#BFEAFF" />
      <pointLight position={[-3, -1, 2]} intensity={1.4} color="#FFB58A" />
      <mesh rotation={[rotation * 0.4, rotation, rotation * 0.15]}>
        <icosahedronGeometry args={[1.8, 2]} />
        <meshStandardMaterial color="#4FD1E8" emissive="#12657A" emissiveIntensity={glow} roughness={0.28} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0, -2]} scale={[4.8, 4.8, 0.2]}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color="#102F42" roughness={0.8} />
      </mesh>
      <mesh position={[0, -2.1, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[1.8, 0.025, 8, 64]} />
        <meshBasicMaterial color="#B9F4FF" transparent opacity={0.55} />
      </mesh>
      <directionalLight position={[0, 2, 5]} intensity={0.6} />
    </ThreeCanvas>
  );
}
