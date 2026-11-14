import {execFileSync} from 'node:child_process';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {estimateTiming, timingForScene} from '../src/core/timing';
import {parseProject} from '../src/types/project';

const projectPath = resolve(process.argv[2] ?? 'projects/sample/project.json');
const project = parseProject(JSON.parse(await readFile(projectPath, 'utf8')));
const timing = estimateTiming(project);
const cacheRoot = resolve('.cache/scenes', project.id);
await mkdir(cacheRoot, {recursive: true});
const fps = project.format.fps;
const outputs: string[] = [];

for (const scene of project.scenes) {
  const range = timingForScene(timing, scene.lineId, fps);
  const from = range.from;
  const to = from + range.durationInFrames - 1;
  const output = resolve(cacheRoot, `${scene.id}.mp4`);
  const command = ['npx', 'remotion', 'render', 'src/index.tsx', 'UniversalVideoStudio', output, '--props=.tmp/render-props.json', '--frames', `${from}-${to}`, '--gl=swangle', '--audio-codec=none'];
  try {
    execFileSync(command[0], command.slice(1), {cwd: resolve('.'), stdio: 'inherit'});
    outputs.push(output);
    await writeFile(resolve(cacheRoot, `${scene.id}.json`), `${JSON.stringify({sceneId: scene.id, from, to, output, status: 'rendered'}, null, 2)}\n`);
  } catch (error) {
    await writeFile(resolve(cacheRoot, `${scene.id}.json`), `${JSON.stringify({sceneId: scene.id, from, to, output, status: 'failed', error: String(error)}, null, 2)}\n`);
    throw error;
  }
}

const listPath = resolve(cacheRoot, 'concat.txt');
await writeFile(listPath, outputs.map((file) => `file '${file.replaceAll("'", "'\\''")}'`).join('\n') + '\n');
const stitched = resolve(cacheRoot, 'stitched-video-only.mp4');
const ffmpeg = process.env.FFMPEG ?? resolve('node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg');
execFileSync(ffmpeg, ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', stitched], {stdio: 'inherit'});
console.log(JSON.stringify({project: project.id, scenes: outputs.length, stitched}, null, 2));
