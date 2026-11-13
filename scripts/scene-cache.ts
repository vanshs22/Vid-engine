import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {estimateTiming} from '../src/core/timing';
import {parseProject} from '../src/types/project';

const projectPath = resolve(process.argv[2] ?? 'projects/sample/project.json');
const project = parseProject(JSON.parse(await readFile(projectPath, 'utf8')));
const timing = estimateTiming(project);
const cacheRoot = resolve('.cache/scenes');
await mkdir(cacheRoot, {recursive: true});
const results = [];
for (const scene of project.scenes) {
  const line = project.lines.find((candidate) => candidate.id === scene.lineId);
  const hash = createHash('sha256').update(JSON.stringify({scene, line, timing, format: project.format, renderer: project.style})).digest('hex').slice(0, 16);
  const manifestPath = resolve(cacheRoot, `${scene.id}.json`);
  let previous: {hash?: string} = {};
  try { previous = JSON.parse(await readFile(manifestPath, 'utf8')); } catch {}
  const status = previous.hash === hash ? 'reusable' : 'invalidated';
  await writeFile(manifestPath, `${JSON.stringify({sceneId: scene.id, hash, status, updatedAt: new Date().toISOString()}, null, 2)}\n`);
  results.push({sceneId: scene.id, status, hash});
}
console.log(JSON.stringify({project: project.id, scenes: results}, null, 2));
