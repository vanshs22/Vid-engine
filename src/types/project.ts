import {z} from 'zod';

const FormatSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fps: z.number().int().positive(),
});

const VoiceSchema = z.object({
  provider: z.enum(['estimated', 'kokoro-onnx', 'recording']).default('estimated'),
  name: z.string().default('am_michael'),
  speed: z.number().positive().default(1),
});

const SceneSchema = z.object({
  id: z.string().min(1),
  lineId: z.string().min(1),
  visualStyle: z.enum(['inside-out', 'three-proof', 'stick-story', 'voice-studio']),
  description: z.string().min(1),
  environment: z.string().min(1),
  camera: z.object({preset: z.string().min(1)}),
  animation: z.array(z.string()).default([]),
  transition: z.enum(['cut', 'fade', 'crossfade']).default('cut'),
  audioCues: z.array(z.object({type: z.string(), atWord: z.string().optional()})).default([]),
});

const LineSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  caption: z.string().min(1),
  sceneId: z.string().min(1),
  gapSeconds: z.number().nonnegative().default(0.3),
});

export const MusicSchema = z.object({mode: z.enum(['none', 'procedural', 'file']).default('none'), path: z.string().min(1).optional()}).superRefine((music, context) => {
  if (music.mode === 'file' && !music.path) context.addIssue({code: z.ZodIssueCode.custom, path: ['path'], message: 'A file music path is required when music mode is file'});
});

const ProjectBaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  format: FormatSchema,
  targetDurationSeconds: z.number().positive(),
  style: z.string().min(1),
  voice: VoiceSchema,
  music: MusicSchema,
  lines: z.array(LineSchema).min(1),
  scenes: z.array(SceneSchema).min(1),
  sources: z.array(z.object({label: z.string(), url: z.string().url()})).default([]),
});

export const ProjectSchema = ProjectBaseSchema.superRefine((project, context) => {
  const lineIds = new Set(project.lines.map((line) => line.id));
  const sceneIds = new Set(project.scenes.map((scene) => scene.id));
  if (lineIds.size !== project.lines.length) context.addIssue({code: z.ZodIssueCode.custom, path: ['lines'], message: 'Line IDs must be unique'});
  if (sceneIds.size !== project.scenes.length) context.addIssue({code: z.ZodIssueCode.custom, path: ['scenes'], message: 'Scene IDs must be unique'});
  if (project.lines.length !== project.scenes.length) context.addIssue({code: z.ZodIssueCode.custom, path: ['scenes'], message: 'The MVP requires exactly one scene per line'});
  for (const line of project.lines) {
    const matchingScenes = project.scenes.filter((scene) => scene.lineId === line.id);
    if (matchingScenes.length !== 1) context.addIssue({code: z.ZodIssueCode.custom, path: ['lines'], message: `Line ${line.id} must have exactly one scene`});
    if (!sceneIds.has(line.sceneId)) context.addIssue({code: z.ZodIssueCode.custom, path: ['lines'], message: `Line ${line.id} references unknown scene ${line.sceneId}`});
    if (matchingScenes[0] && matchingScenes[0].id !== line.sceneId) context.addIssue({code: z.ZodIssueCode.custom, path: ['lines'], message: `Line ${line.id} sceneId does not match its scene lineId`});
  }
});

export type Project = z.infer<typeof ProjectSchema>;
export type Line = Project['lines'][number];
export type Scene = Project['scenes'][number];

export function parseProject(input: unknown): Project {
  return ProjectSchema.parse(input);
}
