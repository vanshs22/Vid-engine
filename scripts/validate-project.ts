import {readFile} from 'node:fs/promises';
import {parseProject} from '../src/types/project';
import {estimateTiming} from '../src/core/timing';
import {validateProjectSemantics} from '../src/core/validation';

const path = process.argv[2] ?? 'projects/sample/project.json';
const project = parseProject(JSON.parse(await readFile(path, 'utf8')));
const timing = estimateTiming(project);
const issues = validateProjectSemantics(project, timing);

if (issues.length > 0) {
  for (const issue of issues) console.error(`${issue.path}: ${issue.message}`);
  process.exit(1);
}

console.log(`VALID: ${project.id}`);
console.log(`Estimated duration: ${timing.durationSeconds.toFixed(2)}s`);
console.log(`Lines: ${timing.lines.length}; words: ${timing.words.length}`);
