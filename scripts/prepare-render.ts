import {copyFile, mkdir, readFile, stat, writeFile} from 'node:fs/promises';
import {dirname, extname, resolve} from 'node:path';
import {estimateTiming, parseTiming} from '../src/core/timing';
import {validateProjectSemantics} from '../src/core/validation';
import {parseProject} from '../src/types/project';

const projectPath = resolve(process.argv[2] ?? 'projects/sample/project.json');
const projectDirectory = dirname(projectPath);
const project = parseProject(JSON.parse(await readFile(projectPath, 'utf8')));
const timingFile = resolve(process.argv[3] ?? `${projectDirectory}/data/timing.json`);
let timing = estimateTiming(project);

if (await exists(timingFile)) {
  timing = parseTiming(JSON.parse(await readFile(timingFile, 'utf8')));
}

const issues = validateProjectSemantics(project, timing);
if (issues.length > 0) {
  throw new Error(issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n'));
}

const publicDirectory = resolve('public/generated', project.id);
await mkdir(publicDirectory, {recursive: true});
const renderProps: Record<string, unknown> = {project, timing};

const narrationSource = resolve(projectDirectory, 'data/narration.wav');
if (await exists(narrationSource)) {
  await copyFile(narrationSource, resolve(publicDirectory, 'narration.wav'));
  renderProps.narrationPath = `generated/${project.id}/narration.wav`;
}

if (project.music.mode === 'file') {
  const musicSource = resolve(projectDirectory, project.music.path!);
  if (!(await exists(musicSource))) throw new Error(`Music file not found: ${musicSource}`);
  const musicName = `music${extname(musicSource) || '.audio'}`;
  await copyFile(musicSource, resolve(publicDirectory, musicName));
  renderProps.musicPath = `generated/${project.id}/${musicName}`;
}

const outputPath = resolve('.tmp/render-props.json');
await mkdir(dirname(outputPath), {recursive: true});
await writeFile(outputPath, `${JSON.stringify(renderProps, null, 2)}\n`);
console.log(`Prepared render props: ${outputPath}`);
console.log(`Project: ${project.id}`);
console.log(`Timing: ${timing.estimated ? 'estimated' : 'aligned'} (${timing.durationSeconds.toFixed(2)}s)`);
console.log(`Narration: ${renderProps.narrationPath ? 'staged' : 'not present'}`);

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
