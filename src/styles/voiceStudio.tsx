import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Scene} from '../types/project';

const INK = '#15151B';
const PANEL = '#211F26';
const PANEL_2 = '#2C2931';
const CREAM = '#F5E9D1';
const GOLD = '#F1C66D';
const ORANGE = '#E9855B';
const ORANGE_LIGHT = '#FFB07E';
const GREEN = '#75C898';
const MUTED = '#97919A';

export function VoiceStudioScene({scene}: {scene: Scene}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const progress = interpolate(frame, [0, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const drift = Math.sin(seconds * 0.55) * 6;
  const number = Number(scene.id.replace(/\D/g, '')) || 1;
  const panel = number > 1;
  const panelY = interpolate(frame, [0, 14], [360, 300], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: INK, overflow: 'hidden'}}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" role="img" aria-label={scene.description}>
        <defs>
          <radialGradient id="orb-gradient" cx="35%" cy="25%" r="80%"><stop offset="0" stopColor="#FFB083" /><stop offset="0.48" stopColor="#E87850" /><stop offset="1" stopColor="#9C3F3B" /></radialGradient>
          <linearGradient id="room-light" x1="0" x2="1"><stop stopColor="#302021" /><stop offset="0.5" stopColor="#5A3828" /><stop offset="1" stopColor="#211B20" /></linearGradient>
          <filter id="soft-shadow"><feGaussianBlur stdDeviation="18" /></filter>
        </defs>
        <RoomScene drift={drift} />
        <Presenter x={320 + drift * 0.3} y={1420} />
        <VoiceOrb x={770 + drift * 0.2} y={880} pulse={1 + Math.sin(seconds * 3) * 0.025} />
        {!panel ? <HookMark /> : <WorkflowCard step={number - 1} y={panelY} progress={progress} />}
        <text x="60" y="1780" fill="#C5B9A5" fontFamily="Arial, sans-serif" fontSize="25" fontWeight="700" letterSpacing="3">LOCAL VOICE WORKFLOW</text>
      </svg>
    </AbsoluteFill>
  );
}

function RoomScene({drift}: {drift: number}) {
  return <g transform={`translate(${drift} 0)`}>
    <rect width="1080" height="1920" fill="url(#room-light)" />
    <rect y="1220" width="1080" height="700" fill="#251A1A" />
    <path d="M0 1200L1080 1200L1080 1320L0 1320Z" fill="#17151A" />
    <rect x="60" y="280" width="175" height="700" fill="#D58D40" opacity="0.65" />
    <rect x="245" y="260" width="52" height="740" fill="#7E3434" opacity="0.8" />
    <rect x="300" y="300" width="55" height="680" fill="#E7B159" opacity="0.75" />
    <rect x="800" y="210" width="85" height="800" fill="#D59A43" opacity="0.8" />
    <rect x="895" y="250" width="50" height="760" fill="#775071" opacity="0.9" />
    <rect x="955" y="220" width="65" height="790" fill="#E0AF51" opacity="0.6" />
    <AcousticPanel x={400} y={400} w={150} h={150} />
    <AcousticPanel x={580} y={270} w={190} h={190} />
    <AcousticPanel x={450} y={620} w={220} h={150} />
    <rect x="70" y="1040" width="480" height="230" rx="16" fill="#4B2A25" stroke="#1A1418" strokeWidth="18" />
    <rect x="120" y="970" width="390" height="100" rx="16" fill="#6A392B" stroke="#1A1418" strokeWidth="16" />
    <Laptop x={130} y={1040} />
    <Microphone x={585} y={1000} />
    <Fan x={925} y={1375} />
    <ellipse cx="570" cy="1640" rx="500" ry="60" fill="#000" opacity="0.45" filter="url(#soft-shadow)" />
  </g>;
}

function AcousticPanel({x, y, w, h}: {x: number; y: number; w: number; h: number}) {
  return <g transform={`translate(${x} ${y})`} opacity="0.82"><rect width={w} height={h} rx="10" fill="#29242B" stroke="#18161C" strokeWidth="10" /><path d={`M0 ${h * 0.25}H${w}M0 ${h * 0.5}H${w}M0 ${h * 0.75}H${w}`} stroke="#40363D" strokeWidth="8" /><path d={`M${w * 0.25} 0V${h}M${w * 0.5} 0V${h}M${w * 0.75} 0V${h}`} stroke="#1B1820" strokeWidth="8" /></g>;
}

function Presenter({x, y}: {x: number; y: number}) {
  return <g transform={`translate(${x} ${y})`} stroke="#17151A" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
    <path d="M-160 200Q-100 80 20 90Q150 80 190 220L130 470H-160Z" fill="#1E463E" />
    <circle cx="0" cy="0" r="116" fill="#9A5A3C" />
    <path d="M-116 -20Q-120 -145 18 -150Q125 -130 110 -30L60 -78L-30 -72Z" fill="#17151A" />
    <circle cx="-34" cy="5" r="11" fill="#F5E9D1" stroke="none" /><circle cx="44" cy="5" r="11" fill="#F5E9D1" stroke="none" />
    <path d="M-24 55Q10 72 42 50" fill="none" />
    <path d="M-110 260L-285 365M135 265L300 350" fill="none" />
    <path d="M-40 460L-160 650M100 460L245 650" fill="none" />
    <path d="M-160 650h-110M245 650h110" fill="none" />
    <rect x="-23" y="170" width="46" height="210" rx="18" fill="#D87854" stroke="none" />
  </g>;
}

function VoiceOrb({x, y, pulse}: {x: number; y: number; pulse: number}) {
  return <g transform={`translate(${x} ${y}) scale(${pulse})`}>
    <ellipse rx="220" ry="52" fill="none" stroke="#D47B54" strokeWidth="12" opacity="0.8" transform="rotate(-10)" />
    <ellipse rx="205" ry="45" fill="none" stroke="#E4A072" strokeWidth="7" opacity="0.65" transform="rotate(54)" />
    <circle r="170" fill="url(#orb-gradient)" stroke="#17151A" strokeWidth="20" />
    <circle r="115" fill="#080A0E" stroke="#E5A477" strokeWidth="8" />
    <rect x="-48" y="-26" width="30" height="20" rx="8" fill="#F5E9D1" /><rect x="18" y="-26" width="30" height="20" rx="8" fill="#F5E9D1" />
    <path d="M-55 35Q0 82 55 35" fill="none" stroke="#F5E9D1" strokeWidth="13" strokeLinecap="round" />
    <circle cx="0" cy="-205" r="16" fill="#FFD34F" /><path d="M0 -190V-170" stroke="#FFD34F" strokeWidth="12" />
  </g>;
}

function HookMark() {
  return <g><text x="75" y="250" fill={CREAM} fontFamily="Georgia, serif" fontSize="78" fontWeight="700">Voice, without</text><text x="75" y="340" fill={GOLD} fontFamily="Georgia, serif" fontSize="78" fontWeight="700">the per-minute bill.</text><path d="M78 385H700" stroke={ORANGE} strokeWidth="10" strokeLinecap="round" /></g>;
}

function WorkflowCard({step, y, progress}: {step: number; y: number; progress: number}) {
  const titles = ['Run it locally', 'Download it once', 'Clone your voice', 'Design the sound', 'Type and generate', 'Sync captions', 'Get permission'];
  const title = titles[Math.min(step, titles.length - 1)];
  return <g transform={`translate(40 ${y})`}>
    <rect width="1000" height="760" rx="32" fill={PANEL} stroke="#615761" strokeWidth="5" />
    <text x="35" y="62" fill={ORANGE_LIGHT} fontFamily="Arial, sans-serif" fontSize="25" fontWeight="900">STEP {Math.min(step + 1, 7)}/7</text>
    <ProgressBar x={205} y={42} active={Math.min(step + 1, 7)} />
    <text x="35" y="135" fill={CREAM} fontFamily="Georgia, serif" fontSize="57" fontWeight="700">{title}</text>
    <rect x="35" y="168" width="930" height="54" rx="10" fill="#F1EDE5" />
    <circle cx="65" cy="195" r="10" fill="#DD7164" /><circle cx="95" cy="195" r="10" fill="#E5B15C" /><circle cx="125" cy="195" r="10" fill="#69B77E" />
    <text x="465" y="204" textAnchor="middle" fill="#68616A" fontFamily="Arial, sans-serif" fontSize="20">VoiceStudio · {title}</text>
    {step === 1 ? <LocalPanel progress={progress} />
      : step === 2 ? <LocalPanel progress={progress} />
        : step === 3 ? <ClonePanel progress={progress} />
          : step === 4 ? <DesignPanel progress={progress} />
            : step === 5 ? <GeneratePanel progress={progress} />
              : step === 6 ? <SyncPanel progress={progress} />
                : <PermissionPanel />}
  </g>;
}

function ProgressBar({x, y, active}: {x: number; y: number; active: number}) {
  return <g transform={`translate(${x} ${y})`}>{Array.from({length: 7}, (_, i) => <rect key={i} x={i * 105} width="92" height="14" rx="7" fill={i < active ? ORANGE : '#514A55'} />)}</g>;
}

function LocalPanel({progress}: {progress: number}) {
  return <g><text x="60" y="315" fill={CREAM} fontFamily="Arial" fontSize="30" fontWeight="800">Download local voice models</text><rect x="60" y="355" width="850" height="100" rx="16" fill={PANEL_2} /><rect x="80" y="382" width={720 * progress} height="20" rx="10" fill={ORANGE} /><text x="80" y="430" fill={MUTED} fontFamily="Arial" fontSize="22">Runs on your own computer</text><rect x="60" y="500" width="360" height="75" rx="14" fill="#3D2A2A" stroke="#744840" strokeWidth="3" /><text x="240" y="548" textAnchor="middle" fill={CREAM} fontFamily="Arial" fontSize="25" fontWeight="800">First setup only</text></g>;
}

function ClonePanel({progress}: {progress: number}) {
  return <g><text x="60" y="315" fill="#E97D76" fontFamily="Arial" fontSize="25" fontWeight="900">RECORDING… 00:10</text><Waveform x={65} y={375} progress={progress} /><circle cx="500" cy="550" r="48" fill="#3C252C" stroke="#B35C5B" strokeWidth="7" /><rect x="480" y="530" width="40" height="40" rx="8" fill="#E66A65" /></g>;
}

function DesignPanel({progress}: {progress: number}) {
  return <g>{['Accent', 'Age', 'Pitch', 'Emotion', 'Speed'].map((label, i) => { const y = 315 + i * 82; const value = i === 1 ? 0.78 : i === 2 ? 0.6 : progress; return <g key={label}><text x="60" y={y} fill={CREAM} fontFamily="Arial" fontSize="26" fontWeight="800">{label}</text><line x1="180" y1={y - 8} x2="880" y2={y - 8} stroke="#695B61" strokeWidth="10" strokeLinecap="round" /><line x1="180" y1={y - 8} x2={180 + 700 * value} y2={y - 8} stroke={ORANGE_LIGHT} strokeWidth="10" strokeLinecap="round" /><circle cx={180 + 700 * value} cy={y - 8} r="18" fill={CREAM} stroke={ORANGE} strokeWidth="7" /></g>;})}<rect x="60" y="690" width="850" height="55" rx="12" fill={ORANGE} /><text x="485" y="727" textAnchor="middle" fill="#271C1B" fontFamily="Arial" fontSize="25" fontWeight="900">SAVE TO VOICE GALLERY</text></g>;
}

function GeneratePanel({progress}: {progress: number}) {
  return <g><rect x="60" y="285" width="850" height="145" rx="16" fill="#2F2B33" /><text x="90" y="335" fill={CREAM} fontFamily="Arial" fontSize="28">Hey, it&apos;s me. This voice costs zero dollars.</text><Waveform x={75} y={490} progress={progress} /><rect x="60" y="610" width="360" height="62" rx="12" fill="#3F3538" /><text x="240" y="650" textAnchor="middle" fill={CREAM} fontFamily="Arial" fontSize="24">EXPORT WAV</text><rect x="445" y="610" width="360" height="62" rx="12" fill={ORANGE} /><text x="625" y="650" textAnchor="middle" fill="#281B1B" fontFamily="Arial" fontSize="24" fontWeight="900">GENERATE</text></g>;
}

function SyncPanel({progress}: {progress: number}) {
  return <g><text x="60" y="315" fill={CREAM} fontFamily="Arial" fontSize="27" fontWeight="800">Word timing follows the real audio</text><rect x="60" y="365" width="850" height="130" rx="15" fill="#2F2B33" /><Waveform x={90} y={430} progress={progress} /><rect x="75" y="555" width="190" height="52" rx="12" fill={ORANGE} /><text x="170" y="590" textAnchor="middle" fill="#281B1B" fontFamily="Arial" fontSize="22" fontWeight="900">VOICE</text><rect x="285" y="555" width="190" height="52" rx="12" fill="#51464F" /><text x="380" y="590" textAnchor="middle" fill={CREAM} fontFamily="Arial" fontSize="22">CAPTIONS</text><rect x="495" y="555" width="190" height="52" rx="12" fill="#51464F" /><text x="590" y="590" textAnchor="middle" fill={CREAM} fontFamily="Arial" fontSize="22">SCENES</text></g>;
}

function PermissionPanel() {
  return <g><rect x="60" y="290" width="850" height="380" rx="18" fill="#F5F1E9" /><text x="485" y="355" textAnchor="middle" fill={INK} fontFamily="Georgia, serif" fontSize="37" fontWeight="700">Use only voices with permission</text><circle cx="485" cy="470" r="62" fill="#24232B" /><path d="M390 550H580" stroke="#C84B55" strokeWidth="20" /><text x="485" y="570" textAnchor="middle" fill="#C84B55" fontFamily="Arial" fontSize="28" fontWeight="900">NO COPYING</text><rect x="90" y="700" width="790" height="42" rx="10" fill="#DDF2E2" /><text x="485" y="730" textAnchor="middle" fill="#327B4C" fontFamily="Arial" fontSize="23" fontWeight="800">Your own voice · someone who said yes</text></g>;
}

function ExportPanel({progress}: {progress: number}) {
  return <g><text x="60" y="315" fill={CREAM} fontFamily="Arial" fontSize="28" fontWeight="800">Your finished voice is ready</text><Waveform x={70} y={390} progress={progress} /><rect x="60" y="520" width="850" height="78" rx="14" fill="#3D2A2A" /><text x="485" y="570" textAnchor="middle" fill={CREAM} fontFamily="Arial" fontSize="25">narration.wav · captions.json · final.mp4</text><rect x="60" y="650" width="850" height="62" rx="12" fill={ORANGE} /><text x="485" y="690" textAnchor="middle" fill="#281B1B" fontFamily="Arial" fontSize="25" fontWeight="900">EXPORT YOUR STORY</text></g>;
}

function Waveform({x, y, progress}: {x: number; y: number; progress: number}) {
  return <g transform={`translate(${x} ${y})`}>{Array.from({length: 46}, (_, i) => { const height = 18 + Math.abs(Math.sin(i * 2.1 + progress * 8)) * 58; return <rect key={i} x={i * 18} y={-height / 2} width="8" height={height} rx="4" fill={i / 46 < progress ? ORANGE_LIGHT : '#7D6670'} />;})}</g>;
}

function Laptop({x, y}: {x: number; y: number}) {
  return <g transform={`translate(${x} ${y})`}><rect width="160" height="110" rx="8" fill="#A9B5B6" stroke="#17151A" strokeWidth="12" transform="rotate(-8)" /><path d="M-20 110H190L150 145H10Z" fill="#525963" stroke="#17151A" strokeWidth="12" /></g>;
}

function Microphone({x, y}: {x: number; y: number}) {
  return <g transform={`translate(${x} ${y})`} stroke="#17151A" strokeWidth="12" strokeLinecap="round"><ellipse cx="0" cy="0" rx="38" ry="75" fill="#B9B5AB" /><path d="M-65 20Q-65 100 0 100Q65 100 65 20M0 100V250M-80 250H80" fill="none" /></g>;
}

function Fan({x, y}: {x: number; y: number}) {
  return <g transform={`translate(${x} ${y})`} stroke="#77787C" strokeWidth="9"><circle r="95" fill="#37383D" opacity="0.8" /><circle r="20" fill="#B1B2AF" /><path d="M0 -20Q-90 -80 -40 0Q-20 10 0 -20M20 0Q80 -90 0 -40Q-10 -20 20 0M0 20Q90 80 40 0Q20 -10 0 20" fill="#929496" /><path d="M0 95V200M-70 200H70" /></g>;
}
