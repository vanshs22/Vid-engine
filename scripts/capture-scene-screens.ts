import {execFileSync} from 'node:child_process';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {parseProject} from '../src/types/project';

const projectPath = resolve(process.argv[2] ?? 'projects/sample/project.json');
const project = parseProject(JSON.parse(await readFile(projectPath, 'utf8')));
const outputRoot = resolve(dirname(projectPath), 'data/screen-recordings');
await mkdir(outputRoot, {recursive: true});
const captures = [];
for (const scene of project.scenes) {
  if (!scene.screenRecording) continue;
  const output = resolve(outputRoot, `${scene.id}.mp4`);
  const actionsPath = resolve(outputRoot, `${scene.id}.actions.json`);
  await writeFile(actionsPath, `${JSON.stringify(scene.screenRecording.actions, null, 2)}\n`);
  execFileSync('node', ['scripts/capture-screen.ts', scene.screenRecording.url, output, actionsPath], {cwd: resolve('.'), stdio: 'inherit'});
  captures.push({sceneId: scene.id, url: scene.screenRecording.url, assetPath: `data/screen-recordings/${scene.id}.mp4`, output});
}
console.log(JSON.stringify({project: project.id, captures}, null, 2));
