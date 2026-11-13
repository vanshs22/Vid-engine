import {estimateTiming, parseTiming, type Timing} from './timing';
import {validateTimingForProject} from './validation';
import {parseProject, type Project} from '../types/project';

export type RenderProps = {
  project: Project;
  timing: Timing;
  narrationPath?: string;
  musicPath?: string;
  mixPath?: string;
};

export function normalizeRenderProps(input: unknown, fallback: RenderProps): RenderProps {
  const candidate = isRecord(input) && 'project' in input ? input.project : input;
  const project = parseProject(candidate ?? fallback.project);
  const suppliedTiming = isRecord(input) && 'timing' in input && input.timing != null ? parseTiming(input.timing) : undefined;
  const timing = suppliedTiming ?? (project.id === fallback.project.id ? fallback.timing : estimateTiming(project));
  const issues = validateTimingForProject(project, timing);
  if (issues.length > 0) {
    throw new Error(`Invalid timing for ${project.id}: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ')}`);
  }

  return {
    project,
    timing,
    narrationPath: getOptionalString(input, 'narrationPath') ?? (project.id === fallback.project.id ? fallback.narrationPath : undefined),
    musicPath: getOptionalString(input, 'musicPath') ?? (project.id === fallback.project.id ? fallback.musicPath : undefined),
    mixPath: getOptionalString(input, 'mixPath') ?? (project.id === fallback.project.id ? fallback.mixPath : undefined),
  };
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null;
}

function getOptionalString(input: unknown, key: string): string | undefined {
  if (!isRecord(input)) return undefined;
  const value = input[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
