import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {parseProject} from '../src/types/project';
import {estimateTiming} from '../src/core/timing';
import {validateProjectSemantics} from '../src/core/validation';

const projectPath = resolve(process.argv[2] ?? 'projects/sample/project.json');
const outputPath = resolve(process.argv[3] ?? `${dirname(projectPath)}/data/timing.json`);
const project = parseProject(JSON.parse(await readFile(projectPath, 'utf8')));
const timing = estimateTiming(project);
const issues = validateProjectSemantics(project, timing);
if (issues.length) throw new Error(issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n'));
await mkdir(dirname(outputPath), {recursive: true});
await writeFile(outputPath, `${JSON.stringify(timing, null, 2)}\n`);
console.log(`WROTE: ${outputPath}`);
console.log(`Estimated duration: ${timing.durationSeconds.toFixed(2)}s`);
