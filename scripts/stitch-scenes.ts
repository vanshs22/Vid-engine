import {execFileSync} from 'node:child_process';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {parseProject} from '../src/types/project';

const projectPath = resolve(process.argv[2] ?? 'projects/sample/project.json');
const project = parseProject(JSON.parse(await readFile(projectPath, 'utf8')));
const cacheRoot = resolve('.cache/scenes', project.id);
const ffmpeg = process.env.FFMPEG ?? resolve('node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg');
const files = project.scenes.map((scene) => resolve(cacheRoot, `${scene.id}.mp4`));
const listPath = resolve(cacheRoot, 'concat.txt');
const videoOnly = resolve(cacheRoot, 'stitched-video-only.mp4');
const final = resolve(cacheRoot, 'stitched-final.mp4');
await mkdir(dirname(listPath), {recursive: true});
await writeFile(listPath, files.map((file) => `file '${file.replaceAll("'", "'\\''")}'`).join('\n') + '\n');
execFileSync(ffmpeg, ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', videoOnly], {stdio: 'inherit'});
const mix = resolve(dirname(projectPath), 'data/mix.wav');
try {
  await readFile(mix);
  execFileSync(ffmpeg, ['-y', '-v', 'error', '-i', videoOnly, '-i', mix, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', final], {stdio: 'inherit'});
} catch {
  await writeFile(final, await readFile(videoOnly));
}
console.log(JSON.stringify({project: project.id, scenes: files.length, videoOnly, final, audio: await exists(mix)}, null, 2));

async function exists(path: string) { try { await readFile(path); return true; } catch { return false; } }
