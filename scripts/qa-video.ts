import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

type Stream = {codec_type?: string; codec_name?: string; width?: number; height?: number; r_frame_rate?: string; sample_rate?: string; channels?: number};
type Probe = {streams?: Stream[]; format?: {duration?: string; size?: string}};

const input = resolve(process.argv[2] ?? 'out/voice-studio-explainer.mp4');
const requireAudio = process.argv.includes('--require-audio');
const ffprobe = process.env.FFPROBE ?? resolve('node_modules/@remotion/compositor-linux-x64-gnu/ffprobe');
const reportFlag = process.argv.indexOf('--report');
const reportPath = resolve(reportFlag >= 0 ? process.argv[reportFlag + 1] : 'out/qa-report.json');

const probe = JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', input], {encoding: 'utf8'})) as Probe;
const streams = probe.streams ?? [];
const video = streams.find((stream) => stream.codec_type === 'video');
const audio = streams.find((stream) => stream.codec_type === 'audio');
const duration = Number(probe.format?.duration ?? 0);
const issues: string[] = [];
const warnings: string[] = [];

if (!video) issues.push('No video stream found');
if (video && (video.width !== 1080 || video.height !== 1920)) issues.push(`Expected 1080x1920 video, found ${video.width}x${video.height}`);
if (video && video.r_frame_rate !== '30/1') issues.push(`Expected 30 FPS, found ${video.r_frame_rate}`);
if (!Number.isFinite(duration) || duration <= 0) issues.push('Video duration is missing or invalid');
if (!audio) {
  const message = 'No audio stream found';
  if (requireAudio) issues.push(message);
  else warnings.push(message);
}

const report = {
  input,
  durationSeconds: duration,
  video: video ?? null,
  audio: audio ?? null,
  checks: {
    resolution: Boolean(video && video.width === 1080 && video.height === 1920),
    frameRate: Boolean(video && video.r_frame_rate === '30/1'),
    duration: Number.isFinite(duration) && duration > 0,
    audioStream: Boolean(audio),
    blackFrameScan: 'not-run: bundled FFmpeg build has no blackdetect filter',
    captionBounds: 'not-run: requires rendered-frame geometry scan',
  },
  issues,
  warnings,
};
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exit(1);
