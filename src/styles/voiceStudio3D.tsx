import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Scene, VisualPlan} from '../types/project';

const palette = {
  wall: '#2B2020',
  floor: '#17151A',
  wood: '#5A382B',
  panel: '#29242C',
  orange: '#E9855B',
  orangeLight: '#FFB07E',
  gold: '#F1C66D',
  cream: '#F5E9D1',
  green: '#75C898',
};

export function VoiceStudio3DScene({scene}: {scene: Scene}) {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const plan = scene.visualPlan;
  const number = (plan?.stepIndex ?? (Number(scene.id.replace(/\D/g, '')) || 1) - 1) + 1;
  const progress = interpolate(frame, [0, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cameraX = Math.sin(frame / 180) * 0.18;
  const cameraZ = 11 - interpolate(frame, [0, 90], [0, 0.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: palette.floor}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 45, position: [cameraX, 1.4, cameraZ]}} shadows style={{backgroundColor: palette.wall}}>
        <color attach="background" args={[palette.wall]} />
        <ambientLight intensity={0.42} color="#FFD9BD" />
        <directionalLight castShadow position={[-4, 6, 5]} intensity={2.5} color="#FFD1A3" shadow-mapSize={[1024, 1024]} />
        <pointLight position={[3, 2.5, 2]} intensity={8} distance={8} color="#E9855B" />
        <pointLight position={[-3, 4, 1]} intensity={4} distance={9} color="#6E93FF" />
        <StudioGeometry frame={frame} sceneNumber={number} progress={progress} />
      </ThreeCanvas>
      <UiOverlay sceneNumber={number} plan={plan} progress={progress} />
    </AbsoluteFill>
  );
}

function StudioGeometry({frame, sceneNumber, progress}: {frame: number; sceneNumber: number; progress: number}) {
  const orbPulse = 1 + Math.sin(frame / 11) * 0.035;
  const orbAngle = frame / 28;
  const presenterBob = Math.sin(frame / 26) * 0.035;
  const gesture = sceneNumber === 4 ? Math.sin(frame / 8) * 0.25 : sceneNumber === 7 ? Math.sin(frame / 7) * 0.12 : 0;
  return <>
    <mesh receiveShadow position={[0, -1.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[14, 14]} />
      <meshStandardMaterial color={palette.floor} roughness={0.9} />
    </mesh>
    <mesh receiveShadow position={[0, 2.2, -1.5]}>
      <boxGeometry args={[8, 7.5, 0.25]} />
      <meshStandardMaterial color={palette.wall} roughness={0.85} />
    </mesh>
    <AcousticPanel position={[-2.6, 2.2, -1.25]} scale={[1.2, 1.5, 0.12]} />
    <AcousticPanel position={[-0.9, 3.2, -1.25]} scale={[1.45, 1.1, 0.12]} />
    <AcousticPanel position={[1.2, 2.8, -1.25]} scale={[1.7, 1.3, 0.12]} />
    <AcousticPanel position={[2.9, 3.6, -1.25]} scale={[0.8, 1.8, 0.12]} />
    <mesh castShadow receiveShadow position={[-0.8, -0.85, 0.2]}>
      <boxGeometry args={[4.8, 0.35, 1.5]} />
      <meshStandardMaterial color={palette.wood} roughness={0.55} />
    </mesh>
    <mesh castShadow position={[-0.8, -1.25, 0.2]}>
      <boxGeometry args={[4.35, 0.55, 1.1]} />
      <meshStandardMaterial color="#3D2525" roughness={0.75} />
    </mesh>
    <Laptop position={[-2.3, -0.35, 0.1]} />
    <Microphone position={[0.05, 0.15, 0.5]} />
    <Fan position={[3.0, -0.6, 0.5]} frame={frame} />
    <Presenter position={[-1.65, -0.85, 0.35]} bob={presenterBob} gesture={gesture} />
    <VoiceOrb position={[1.65, 1.15, 0.45]} pulse={orbPulse} angle={orbAngle} />
    <mesh position={[0, -1.65, 2.5]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[7, 0.05]} />
      <meshBasicMaterial color={palette.orange} transparent opacity={0.22 + progress * 0.1} />
    </mesh>
  </>;
}

function AcousticPanel({position, scale}: {position: [number, number, number]; scale: [number, number, number]}) {
  return <mesh receiveShadow position={position} scale={scale}>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color={palette.panel} roughness={0.95} />
  </mesh>;
}

function Presenter({position, bob, gesture}: {position: [number, number, number]; bob: number; gesture: number}) {
  return <group position={position} rotation={[0, 0, bob]}>
    <mesh castShadow position={[0, 1.25, 0]}>
      <sphereGeometry args={[0.55, 24, 16]} />
      <meshStandardMaterial color="#9A5A3C" roughness={0.75} />
    </mesh>
    <mesh castShadow position={[0, 1.28, 0.02]} scale={[1.02, 0.35, 0.8]}>
      <sphereGeometry args={[0.55, 24, 16]} />
      <meshStandardMaterial color="#17151A" roughness={0.85} />
    </mesh>
    <mesh castShadow position={[0, 0.1, 0]} scale={[0.8, 1.1, 0.5]}>
      <capsuleGeometry args={[0.48, 1.25, 8, 16]} />
      <meshStandardMaterial color="#1E463E" roughness={0.8} />
    </mesh>
    <mesh castShadow position={[-0.75, 0.15, 0]} rotation={[0, 0, -0.7 + gesture]}>
      <capsuleGeometry args={[0.12, 1.0, 8, 12]} />
      <meshStandardMaterial color="#9A5A3C" roughness={0.8} />
    </mesh>
    <mesh castShadow position={[0.75, 0.2, 0]} rotation={[0, 0, 0.65 - gesture]}>
      <capsuleGeometry args={[0.12, 1.0, 8, 12]} />
      <meshStandardMaterial color="#9A5A3C" roughness={0.8} />
    </mesh>
    <mesh castShadow position={[-0.45, -1.15, 0]} rotation={[0, 0, -0.15]}>
      <capsuleGeometry args={[0.15, 1.3, 8, 12]} />
      <meshStandardMaterial color="#191A22" roughness={0.85} />
    </mesh>
    <mesh castShadow position={[0.45, -1.15, 0]} rotation={[0, 0, 0.15]}>
      <capsuleGeometry args={[0.15, 1.3, 8, 12]} />
      <meshStandardMaterial color="#191A22" roughness={0.85} />
    </mesh>
  </group>;
}

function VoiceOrb({position, pulse, angle}: {position: [number, number, number]; pulse: number; angle: number}) {
  return <group position={position} scale={pulse}>
    <mesh castShadow>
      <sphereGeometry args={[0.95, 32, 20]} />
      <meshStandardMaterial color={palette.orange} emissive="#5B211D" emissiveIntensity={0.65} roughness={0.34} metalness={0.12} />
    </mesh>
    <mesh position={[0, 0, 0.78]}>
      <circleGeometry args={[0.64, 32]} />
      <meshStandardMaterial color="#070A0E" roughness={0.6} />
    </mesh>
    <mesh position={[-0.2, 0.14, 0.86]}><boxGeometry args={[0.12, 0.08, 0.03]} /><meshBasicMaterial color={palette.cream} /></mesh>
    <mesh position={[0.2, 0.14, 0.86]}><boxGeometry args={[0.12, 0.08, 0.03]} /><meshBasicMaterial color={palette.cream} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, angle]}><torusGeometry args={[1.25, 0.035, 12, 64]} /><meshStandardMaterial color="#E4A072" emissive="#7E3B2D" emissiveIntensity={0.5} /></mesh>
    <mesh rotation={[Math.PI / 2, angle, 0]}><torusGeometry args={[1.12, 0.025, 12, 64]} /><meshStandardMaterial color="#D47B54" /></mesh>
    <mesh position={[0, 1.18, 0]}><sphereGeometry args={[0.09, 12, 8]} /><meshBasicMaterial color="#FFD34F" /></mesh>
  </group>;
}

function Laptop({position}: {position: [number, number, number]}) {
  return <group position={position} rotation={[0.1, 0.2, -0.08]}>
    <mesh castShadow><boxGeometry args={[1.1, 0.7, 0.06]} /><meshStandardMaterial color="#A9B5B6" roughness={0.35} metalness={0.25} /></mesh>
    <mesh position={[0, -0.38, 0.25]} rotation={[0.3, 0, 0]}><boxGeometry args={[1.35, 0.08, 0.75]} /><meshStandardMaterial color="#515963" roughness={0.7} /></mesh>
  </group>;
}

function Microphone({position}: {position: [number, number, number]}) {
  return <group position={position}>
    <mesh castShadow position={[0, 0.5, 0]}><capsuleGeometry args={[0.16, 0.7, 8, 12]} /><meshStandardMaterial color="#B9B5AB" roughness={0.5} metalness={0.2} /></mesh>
    <mesh position={[0, -0.25, 0]}><cylinderGeometry args={[0.025, 0.025, 1.7, 8]} /><meshStandardMaterial color="#17151A" /></mesh>
    <mesh position={[0, -1.1, 0]}><boxGeometry args={[0.8, 0.04, 0.35]} /><meshStandardMaterial color="#17151A" /></mesh>
  </group>;
}

function Fan({position, frame}: {position: [number, number, number]; frame: number}) {
  return <group position={position}>
    <mesh><cylinderGeometry args={[0.7, 0.7, 0.08, 32]} /><meshStandardMaterial color="#37383D" roughness={0.8} /></mesh>
    <mesh position={[0, 0, 0.08]} rotation={[0, 0, frame / 12]}><torusGeometry args={[0.48, 0.025, 8, 32]} /><meshBasicMaterial color="#9EA0A4" /></mesh>
    <mesh position={[0, -1.0, 0]}><cylinderGeometry args={[0.05, 0.05, 2, 10]} /><meshStandardMaterial color="#77787C" /></mesh>
  </group>;
}

function UiOverlay({sceneNumber, plan, progress}: {sceneNumber: number; plan?: VisualPlan; progress: number}) {
  if (sceneNumber === 1) return <div style={{position: 'absolute', top: '12%', left: '7%', right: '7%', color: palette.cream, fontFamily: 'Georgia, serif', fontSize: 58, fontWeight: 700, textShadow: '0 4px 12px #111'}}>Voice, without<br /><span style={{color: palette.gold}}>the per-minute bill.</span><div style={{width: 330, height: 7, marginTop: 16, background: palette.orange, borderRadius: 4}} /></div>;
  const title = plan?.heading ?? 'Explain the workflow';
  return <div style={{position: 'absolute', top: '17%', left: '4%', right: '4%', height: '39%', background: 'rgba(31, 29, 36, 0.96)', border: '3px solid #615761', borderRadius: 24, padding: '20px 24px', color: palette.cream, fontFamily: 'Arial, sans-serif', boxSizing: 'border-box'}}>
    <div style={{fontSize: 18, color: palette.orange, fontWeight: 900}}>STEP {Math.min(sceneNumber - 1, 7)}/7</div>
    <div style={{display: 'flex', gap: 8, marginTop: 8}}>{Array.from({length: 7}, (_, i) => <div key={i} style={{height: 7, flex: 1, borderRadius: 5, background: i < sceneNumber - 1 ? palette.orange : '#514A55'}} />)}</div>
    <div style={{fontFamily: 'Georgia, serif', fontSize: 38, fontWeight: 700, marginTop: 18}}>{title}</div>
    <div style={{height: 28, marginTop: 14, background: '#F1EDE5', borderRadius: 6, color: '#68616A', textAlign: 'center', fontSize: 12, paddingTop: 8, boxSizing: 'border-box'}}>VoiceStudio · {title}</div>
    <UiPanel uiComponent={plan?.uiComponent ?? 'none'} progress={progress} />
  </div>;
}

function UiPanel({uiComponent, progress}: {uiComponent: VisualPlan['uiComponent']; progress: number}) {
  const common = {fontFamily: 'Arial, sans-serif', fontSize: 17, color: palette.cream} as const;
  if (uiComponent === 'download') return <div style={{...common, marginTop: 34}}><strong>Download local voice models</strong><div style={{height: 34, marginTop: 18, background: '#2C2931', borderRadius: 8, overflow: 'hidden'}}><div style={{width: `${35 + progress * 55}%`, height: '100%', background: palette.orange}} /></div><div style={{color: '#97919A', marginTop: 10}}>Runs on your own computer · first setup only</div></div>;
  if (uiComponent === 'recording') return <div style={{...common, marginTop: 34, color: '#E97D76'}}>RECORDING… 00:10<div style={{display: 'flex', gap: 5, alignItems: 'center', height: 80, marginTop: 18}}>{Array.from({length: 32}, (_, i) => <i key={i} style={{width: 5, height: 15 + Math.abs(Math.sin(i * 2 + progress * 7)) * 48, background: palette.orangeLight, borderRadius: 3}} />)}</div></div>;
  if (uiComponent === 'voice-design') return <div style={{...common, marginTop: 28}}>{['Accent', 'Age', 'Pitch', 'Emotion', 'Speed'].map((label, i) => <div key={label} style={{marginTop: 10, display: 'flex', alignItems: 'center', gap: 16}}><span style={{width: 70}}>{label}</span><div style={{height: 6, flex: 1, background: '#695B61', borderRadius: 4}}><div style={{width: `${35 + ((i + 1) * 11) % 50}%`, height: '100%', background: palette.orangeLight, borderRadius: 4}} /></div></div>)}</div>;
  if (uiComponent === 'generate') return <div style={{...common, marginTop: 34}}><div style={{padding: 18, borderRadius: 8, background: '#2F2B33'}}>Hey, it&apos;s me. This voice costs zero dollars.</div><WaveformHtml progress={progress} /></div>;
  if (uiComponent === 'caption-sync') return <div style={{...common, marginTop: 34}}><strong>Word timing follows the real audio</strong><WaveformHtml progress={progress} /><div style={{display: 'flex', gap: 10}}>{['VOICE', 'CAPTIONS', 'SCENES'].map((x, i) => <span key={x} style={{padding: '9px 18px', borderRadius: 7, background: i === 0 ? palette.orange : '#51464F', color: i === 0 ? '#281B1B' : palette.cream, fontSize: 13}}>{x}</span>)}</div></div>;
  if (uiComponent === 'permission') return <div style={{marginTop: 28, background: '#F5F1E9', borderRadius: 10, padding: 24, color: '#15151B', textAlign: 'center', fontFamily: 'Arial, sans-serif', fontWeight: 700}}>Use only voices you own or have permission to use.<div style={{marginTop: 24, color: '#327B4C', background: '#DDF2E2', padding: 8, borderRadius: 6, fontSize: 13}}>Your own voice · someone who said yes</div></div>;
  return <div style={{...common, marginTop: 34}}>The studio explains the idea with the presenter and orb.</div>;
}

function WaveformHtml({progress}: {progress: number}) {
  return <div style={{display: 'flex', gap: 3, alignItems: 'center', height: 64, margin: '18px 0'}}>{Array.from({length: 40}, (_, i) => <i key={i} style={{width: 4, height: 12 + Math.abs(Math.sin(i * 2.1 + progress * 8)) * 42, background: i / 40 < progress ? palette.orangeLight : '#7D6670', borderRadius: 2}} />)}</div>;
}
