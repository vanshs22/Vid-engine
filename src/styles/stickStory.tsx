import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Scene} from '../types/project';

const INK = '#1E2430';
const PAPER = '#F8F4EA';
const BLUE = '#4776E6';
const YELLOW = '#FFD45A';
const RED = '#E56B6F';
const GREEN = '#65B891';
const MUTED = '#8B929D';

export function StickStoryScene({scene}: {scene: Scene}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const progress = interpolate(frame, [0, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const beat = 1 + Math.sin(seconds * 7) * 0.025;
  const sceneNumber = Number(scene.id.replace(/\D/g, '')) || 1;
  const visual = sceneNumber === 1 ? <BusStop progress={progress} />
    : sceneNumber === 2 ? <LostKeys progress={progress} />
      : sceneNumber === 3 ? <SearchMontage progress={progress} />
        : sceneNumber === 4 ? <JingleReveal progress={progress} />
          : sceneNumber === 5 ? <DogReveal progress={progress} />
            : <BusEscape progress={progress} />;

  return (
    <AbsoluteFill style={{backgroundColor: PAPER, overflow: 'hidden'}}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" role="img" aria-label={scene.description} style={{transform: `scale(${beat})`}}>
        <rect width="1080" height="1920" fill={PAPER} />
        <path d="M0 260H1080M0 520H1080M0 780H1080M0 1040H1080M0 1300H1080M0 1560H1080" stroke="#E9E1D4" strokeWidth="2" />
        <path d="M180 0V1920M440 0V1920M700 0V1920M960 0V1920" stroke="#EFE8DD" strokeWidth="2" />
        <text x="88" y="150" fill={INK} fontFamily="Arial, sans-serif" fontSize="34" fontWeight="800" letterSpacing="5">STICK STORY · {String(sceneNumber).padStart(2, '0')}</text>
        <text x="88" y="245" fill={INK} fontFamily="Arial, sans-serif" fontSize="76" fontWeight="900">{scene.description}</text>
        <line x1="88" y1="290" x2="992" y2="290" stroke={BLUE} strokeWidth="8" strokeLinecap="round" />
        {visual}
        <text x="88" y="1510" fill={MUTED} fontFamily="Arial, sans-serif" fontSize="27" fontWeight="700">A tiny problem · one very determined stickman</text>
      </svg>
    </AbsoluteFill>
  );
}

function Stickman({x, y, scale = 1, accent = BLUE, pose = 'stand', expression = 'calm'}: {x: number; y: number; scale?: number; accent?: string; pose?: 'stand' | 'run' | 'search' | 'celebrate'; expression?: 'calm' | 'worried' | 'happy'}) {
  const leg = pose === 'run' ? 38 : pose === 'celebrate' ? -28 : 0;
  const arm = pose === 'run' ? -34 : pose === 'search' ? 55 : pose === 'celebrate' ? -65 : 15;
  const eyeY = y - 192 * scale;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={INK} strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <circle cx="0" cy="-260" r="78" fill="#FFFFFF" />
      <circle cx="-25" cy="-275" r="8" fill={INK} stroke="none" />
      <circle cx="25" cy="-275" r="8" fill={INK} stroke="none" />
      {expression === 'worried' ? <path d="M-28 -235 Q0 -255 28 -235" /> : expression === 'happy' ? <path d="M-28 -235 Q0 -260 28 -235" /> : <path d="M-23 -235 H23" />}
      <path d="M0 -180 V100" stroke={accent} strokeWidth="34" />
      <path d={`M0 -125 L${-100 + arm} 25`} />
      <path d={`M0 -125 L${100 - arm} 25`} />
      <path d={`M0 100 L${-80 + leg} 270`} />
      <path d={`M0 100 L${80 - leg} 270`} />
      <path d={`M${-80 + leg} 270 h-45 M${80 - leg} 270 h45`} />
      <circle cx="0" cy="-125" r="18" fill={YELLOW} stroke={INK} strokeWidth="8" />
      <circle cx="0" cy={eyeY - y} r="0" fill="none" stroke="none" />
    </g>
  );
}

function BusStop({progress}: {progress: number}) {
  const runnerX = interpolate(progress, [0, 1], [220, 470]);
  return <g>
    <rect x="100" y="1160" width="880" height="18" rx="9" fill={INK} />
    <rect x="135" y="650" width="22" height="510" fill={INK} />
    <rect x="110" y="610" width="310" height="85" rx="20" fill="#FFFFFF" stroke={INK} strokeWidth="14" />
    <text x="160" y="667" fill={INK} fontFamily="Arial" fontSize="34" fontWeight="900">LAST BUS</text>
    <Bus x={790} y={810} scale={0.78} />
    <Stickman x={runnerX} y={1135} scale={0.82} pose="run" expression="worried" />
    <path d="M170 1280l70 -40m-25 80l70 -40m-15 80l70 -40" stroke={BLUE} strokeWidth="12" strokeLinecap="round" />
    <text x="700" y="710" fill={RED} fontFamily="Arial" fontSize="32" fontWeight="900">DEPARTS SOON</text>
  </g>;
}

function LostKeys({progress}: {progress: number}) {
  const wiggle = Math.sin(progress * Math.PI * 5) * 18;
  return <g>
    <rect x="120" y="810" width="840" height="290" rx="34" fill="#D9B48F" stroke={INK} strokeWidth="14" />
    <rect x="180" y="870" width="200" height="80" rx="18" fill="#B98A67" />
    <rect x="430" y="870" width="200" height="80" rx="18" fill="#B98A67" />
    <rect x="680" y="870" width="200" height="80" rx="18" fill="#B98A67" />
    <Stickman x={540} y={1320} scale={0.9} pose="search" expression="worried" />
    <g transform={`translate(${520 + wiggle} 680) rotate(${wiggle / 3})`}>
      <circle cx="0" cy="0" r="38" fill="none" stroke={YELLOW} strokeWidth="18" />
      <path d="M38 0h110m-28 0v35m35-35v25" stroke={YELLOW} strokeWidth="18" strokeLinecap="round" />
    </g>
    <path d="M470 585 Q540 520 610 585" fill="none" stroke={RED} strokeWidth="12" strokeDasharray="18 18" />
    <text x="390" y="151" fill={RED} fontFamily="Arial" fontSize="38" fontWeight="900">WHERE ARE THEY?</text>
  </g>;
}

function SearchMontage({progress}: {progress: number}) {
  const shake = Math.sin(progress * Math.PI * 8) * 5;
  return <g transform={`translate(${shake} 0)`}>
    <Sofa x={135} y={850} />
    <Table x={665} y={830} />
    <Stickman x={530} y={1330} scale={0.88} pose="search" expression="worried" />
    <g transform="translate(260 560)"><circle cx="0" cy="0" r="55" fill="none" stroke={RED} strokeWidth="12" /><path d="M-40 -40L40 40M40 -40L-40 40" stroke={RED} strokeWidth="12" /></g>
    <g transform="translate(790 560)"><circle cx="0" cy="0" r="55" fill="none" stroke={RED} strokeWidth="12" /><path d="M-40 -40L40 40M40 -40L-40 40" stroke={RED} strokeWidth="12" /></g>
    <text x="180" y="1430" fill={INK} fontFamily="Arial" fontSize="32" fontWeight="800">TABLE</text>
    <text x="740" y="1430" fill={INK} fontFamily="Arial" fontSize="32" fontWeight="800">SOFA</text>
  </g>;
}

function JingleReveal({progress}: {progress: number}) {
  const ring = 1 + Math.sin(progress * Math.PI * 6) * 0.15;
  return <g>
    <Door x={700} y={540} open={progress > 0.35} />
    <Stickman x={390} y={1320} scale={0.9} pose="search" expression="worried" />
    <g transform={`translate(730 1110) scale(${ring})`}>
      <circle cx="0" cy="0" r="32" fill="none" stroke={YELLOW} strokeWidth="16" />
      <path d="M32 0h125m-35 0v35m40-35v25" stroke={YELLOW} strokeWidth="16" strokeLinecap="round" />
    </g>
    <path d="M820 970 Q900 900 970 970M830 900 Q900 845 950 900" fill="none" stroke={BLUE} strokeWidth="12" strokeLinecap="round" />
    <text x="120" y="580" fill={BLUE} fontFamily="Arial" fontSize="38" fontWeight="900">JINGLE!</text>
  </g>;
}

function DogReveal({progress}: {progress: number}) {
  const hop = Math.abs(Math.sin(progress * Math.PI * 3)) * 35;
  return <g>
    <Door x={760} y={530} open />
    <Stickman x={300} y={1320} scale={0.86} pose="celebrate" expression="happy" />
    <Dog x={700} y={1260 - hop} />
    <Shoe x={545} y={1370} rotate={-12} />
    <g transform="translate(578 1300)"><circle cx="0" cy="0" r="26" fill="none" stroke={YELLOW} strokeWidth="12" /><path d="M26 0h85m-30 0v25" stroke={YELLOW} strokeWidth="12" strokeLinecap="round" /></g>
    <path d="M160 565 Q260 490 360 565" fill="none" stroke={GREEN} strokeWidth="14" strokeLinecap="round" />
    <text x="130" y="510" fill={GREEN} fontFamily="Arial" fontSize="36" fontWeight="900">FOUND THEM!</text>
  </g>;
}

function BusEscape({progress}: {progress: number}) {
  const busX = interpolate(progress, [0, 1], [650, 1020]);
  return <g>
    <Stickman x={500} y={1320} scale={0.9} pose="celebrate" expression="happy" />
    <Bus x={busX} y={830} scale={0.78} />
    <Dog x={260} y={1300} />
    <Shoe x={415} y={1430} rotate={-8} />
    <path d="M510 950h95" stroke={GREEN} strokeWidth="16" strokeLinecap="round" />
    <path d="M540 920l35 30-35 30" fill="none" stroke={GREEN} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
    <text x="130" y="570" fill={GREEN} fontFamily="Arial" fontSize="36" fontWeight="900">MADE IT!</text>
  </g>;
}

function Bus({x, y, scale}: {x: number; y: number; scale: number}) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <rect x="-230" y="-130" width="460" height="250" rx="36" fill={BLUE} stroke={INK} strokeWidth="15" />
    <rect x="-170" y="-80" width="125" height="90" rx="12" fill="#DDF2FF" stroke={INK} strokeWidth="10" />
    <rect x="-25" y="-80" width="125" height="90" rx="12" fill="#DDF2FF" stroke={INK} strokeWidth="10" />
    <rect x="125" y="-80" width="55" height="200" rx="12" fill="#DDF2FF" stroke={INK} strokeWidth="10" />
    <circle cx="-125" cy="125" r="34" fill={INK} /><circle cx="125" cy="125" r="34" fill={INK} />
    <text x="-145" y="75" fill="#FFFFFF" fontFamily="Arial" fontSize="30" fontWeight="900">7:10</text>
  </g>;
}

function Sofa({x, y}: {x: number; y: number}) {
  return <g transform={`translate(${x} ${y})`}><rect x="0" y="0" width="360" height="190" rx="40" fill={RED} stroke={INK} strokeWidth="14" /><rect x="35" y="-80" width="290" height="130" rx="45" fill="#F09A8F" stroke={INK} strokeWidth="14" /><path d="M70 190v80m220-80v80" stroke={INK} strokeWidth="16" /></g>;
}

function Table({x, y}: {x: number; y: number}) {
  return <g transform={`translate(${x} ${y})`}><rect x="0" y="0" width="290" height="100" rx="18" fill={YELLOW} stroke={INK} strokeWidth="14" /><path d="M45 100v260m200-260v260" stroke={INK} strokeWidth="18" /></g>;
}

function Door({x, y, open}: {x: number; y: number; open: boolean}) {
  return <g transform={`translate(${x} ${y})`}><rect x="0" y="0" width="240" height="620" fill="#D9E4F2" stroke={INK} strokeWidth="16" /><g transform={open ? 'translate(-115 0) rotate(-18 120 310)' : undefined}><rect x="0" y="0" width="240" height="620" fill="#A8BFE0" stroke={INK} strokeWidth="16" /><circle cx="195" cy="315" r="18" fill={YELLOW} stroke={INK} strokeWidth="8" /></g></g>;
}

function Dog({x, y}: {x: number; y: number}) {
  return <g transform={`translate(${x} ${y})`} stroke={INK} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="0" cy="0" rx="150" ry="92" fill="#B98A67" /><circle cx="-125" cy="-75" r="80" fill="#B98A67" /><path d="M-170 -115l-50 -70 80 35M-90 -130l55 -65 15 85" fill="#8F654D" /><circle cx="-150" cy="-90" r="10" fill={INK} /><circle cx="-95" cy="-90" r="10" fill={INK} /><path d="M-135 -50q25 25 50 0" fill="none" /><path d="M-90 70v90m130-90v90" fill="none" /><path d="M-90 160h-45m175 0h45" fill="none" /><path d="M140 -15q110 -75 115 55" fill="none" /></g>;
}

function Shoe({x, y, rotate}: {x: number; y: number; rotate: number}) {
  return <g transform={`translate(${x} ${y}) rotate(${rotate})`}><path d="M0 0h150q70 0 105 65v45H0z" fill="#5D6673" stroke={INK} strokeWidth="14" /><path d="M40 10v90m45-90v90m45-90v90" stroke="#FFFFFF" strokeWidth="10" /></g>;
}
