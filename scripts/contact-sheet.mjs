import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const input = resolve(process.argv[2] ?? 'out/voice-studio-explainer.mp4');
const output = resolve(process.argv[3] ?? 'out/voice-studio-contact-sheet.svg');
const ffmpeg = process.env.FFMPEG ?? resolve('node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg');
const ffprobe = process.env.FFPROBE ?? resolve('node_modules/@remotion/compositor-linux-x64-gnu/ffprobe');
const metadata = JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', input], {encoding: 'utf8'}));
const duration = Number(metadata.format.duration);
const step = 3;
const times = Array.from({length: Math.ceil(duration / step)}, (_, index) => Math.min(index * step, Math.max(0, duration - 0.05)));
const temp = resolve('.tmp/contact-sheet-frames');
mkdirSync(temp, {recursive: true});
const columns = 5;
const frameWidth = 270;
const frameHeight = 480;
const labelHeight = 34;
const rows = Math.ceil(times.length / columns);
const parts = [];

for (let index = 0; index < times.length; index += 1) {
  const file = resolve(temp, `frame-${String(index).padStart(3, '0')}.jpg`);
  execFileSync(ffmpeg, ['-y', '-v', 'error', '-ss', String(times[index]), '-i', input, '-frames:v', '1', '-vf', `scale=${frameWidth}:${frameHeight}`, file]);
  const data = readFileSync(file).toString('base64');
  const x = (index % columns) * frameWidth;
  const y = Math.floor(index / columns) * (frameHeight + labelHeight);
  parts.push(`<rect x="${x}" y="${y}" width="${frameWidth}" height="${frameHeight + labelHeight}" fill="#111"/><image x="${x}" y="${y}" width="${frameWidth}" height="${frameHeight}" href="data:image/jpeg;base64,${data}"/><text x="${x + 8}" y="${y + frameHeight + 24}" fill="#fff" font-family="sans-serif" font-size="18">${times[index].toFixed(1)}s</text>`);
}

writeFileSync(output, `<svg xmlns="http://www.w3.org/2000/svg" width="${columns * frameWidth}" height="${rows * (frameHeight + labelHeight)}" viewBox="0 0 ${columns * frameWidth} ${rows * (frameHeight + labelHeight)}">${parts.join('')}</svg>\n`);
console.log(`${output} (${times.length} frames, every ${step}s)`);
