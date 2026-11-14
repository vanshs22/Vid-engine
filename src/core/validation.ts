import type {Project} from '../types/project';
import type {Timing, LineTiming, WordTiming} from './timing';

export type ValidationIssue = {path: string; message: string};

export function validateTimingForProject(project: Project, timing: Timing): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const projectLineIds = new Set(project.lines.map((line) => line.id));
  const lineTimings = new Map<string, LineTiming>();
  const seenTimingLineIds = new Set<string>();
  for (const lineTiming of timing.lines) {
    if (seenTimingLineIds.has(lineTiming.lineId)) issues.push({path: `timing.lines.${lineTiming.lineId}`, message: 'Duplicate line timing'});
    seenTimingLineIds.add(lineTiming.lineId);
    lineTimings.set(lineTiming.lineId, lineTiming);
  }

  if (timing.lines.length !== project.lines.length) {
    issues.push({path: 'timing.lines', message: `Expected ${project.lines.length} line timings, received ${timing.lines.length}`});
  }

  for (const line of project.lines) {
    const lineTiming = lineTimings.get(line.id);
    if (!lineTiming) {
      issues.push({path: `timing.lines.${line.id}`, message: 'Missing line timing'});
      continue;
    }
    if (lineTiming.text !== line.text) issues.push({path: `timing.lines.${line.id}.text`, message: 'Timing text does not match project text'});
    if (lineTiming.lineIndex !== project.lines.indexOf(line)) issues.push({path: `timing.lines.${line.id}.lineIndex`, message: 'Timing line index does not match project order'});
    if (lineTiming.endSeconds <= lineTiming.startSeconds) issues.push({path: `timing.lines.${line.id}`, message: 'End must be after start'});
    if (lineTiming.endSeconds > timing.durationSeconds) issues.push({path: `timing.lines.${line.id}`, message: 'Line ends after timing duration'});
  }

  for (const lineTiming of timing.lines) {
    if (!projectLineIds.has(lineTiming.lineId)) issues.push({path: `timing.lines.${lineTiming.lineId}`, message: 'Unknown line ID'});
  }

  let previousStart = -Infinity;
  for (const lineTiming of timing.lines) {
    if (lineTiming.startSeconds < previousStart) issues.push({path: `timing.lines.${lineTiming.lineId}`, message: 'Line timing is not monotonic'});
    previousStart = lineTiming.startSeconds;
  }

  const wordsByLine = new Map<string, WordTiming[]>();
  for (const word of timing.words) {
    if (!projectLineIds.has(word.lineId)) {
      issues.push({path: `timing.words.${word.text}`, message: 'Unknown line ID'});
      continue;
    }
    if (word.endSeconds < word.startSeconds) issues.push({path: `timing.words.${word.text}`, message: 'End must not be before start'});
    if (word.endSeconds > timing.durationSeconds) issues.push({path: `timing.words.${word.text}`, message: 'Word ends after timing duration'});
    if (word.lineIndex !== project.lines.findIndex((line) => line.id === word.lineId)) issues.push({path: `timing.words.${word.text}`, message: 'Word line index does not match project order'});
    const words = wordsByLine.get(word.lineId) ?? [];
    words.push(word);
    wordsByLine.set(word.lineId, words);
  }

  for (const [lineId, words] of wordsByLine) {
    let previousWordStart = -Infinity;
    for (const word of words) {
      if (word.startSeconds < previousWordStart) issues.push({path: `timing.words.${lineId}`, message: 'Word timing is not monotonic'});
      previousWordStart = word.startSeconds;
    }
  }

  if (!timing.estimated) {
    for (const line of project.lines) {
      if ((wordsByLine.get(line.id) ?? []).length === 0) issues.push({path: `timing.words.${line.id}`, message: 'Non-estimated timing must contain words for every line'});
    }
  }

  if (timing.durationSeconds < Math.max(...timing.lines.map((line) => line.endSeconds), 0)) {
    issues.push({path: 'timing.durationSeconds', message: 'Duration does not cover all line timings'});
  }

  return issues;
}

export function validateProjectSemantics(project: Project, timing: Timing): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const sceneIds = new Set(project.scenes.map((scene) => scene.id));
  const lineIds = new Set(project.lines.map((line) => line.id));

  project.lines.forEach((line, index) => {
    if (!sceneIds.has(line.sceneId)) issues.push({path: `lines.${index}.sceneId`, message: `Unknown scene ${line.sceneId}`});
    const lineWords = timing.words.filter((word) => word.lineId === line.id);
    if (lineWords.length === 0) issues.push({path: `lines.${index}.text`, message: 'Line has no timed words'});
  });

  project.scenes.forEach((scene, index) => {
    if (!lineIds.has(scene.lineId)) issues.push({path: `scenes.${index}.lineId`, message: `Unknown line ${scene.lineId}`});
  });

  for (let index = 1; index < timing.lines.length; index += 1) {
    if (timing.lines[index].startSeconds < timing.lines[index - 1].startSeconds) {
      issues.push({path: `timing.lines.${index}`, message: 'Line timing is not monotonic'});
    }
  }

  if (timing.durationSeconds > project.targetDurationSeconds * 1.5) {
    issues.push({path: 'timing.durationSeconds', message: 'Estimated duration is more than 50% above the target'});
  }

  return [...validateTimingForProject(project, timing), ...issues];
}
