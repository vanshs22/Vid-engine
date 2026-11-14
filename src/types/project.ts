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

export const VisualPlanSchema = z.object({
  purpose: z.string().min(1),
  subject: z.string().min(1),
  action: z.string().min(1),
  uiComponent: z.enum(['none', 'download', 'recording', 'voice-design', 'generate', 'caption-sync', 'permission', 'screen-recording']),
  shotType: z.enum(['hook-wide', 'character-close', 'ui-demo', 'object-close', 'reaction', 'diagram', 'permission-wide']),
  camera: z.enum(['hook-wide', 'ui-push', 'character-close', 'object-close', 'permission-wide']),
  animationPreset: z.enum(['orb-pulse', 'download-progress', 'record-waveform', 'move-sliders', 'generate-waveform', 'caption-timeline', 'permission-reveal', 'screen-recording']),
  stepIndex: z.number().int().nonnegative(),
  heading: z.string().min(1),
  motionSkills: z.array(z.string()).default([]),
});

const SceneSchema = z.object({
  id: z.string().min(1),
  lineId: z.string().min(1),
  visualStyle: z.enum(['inside-out', 'three-proof', 'stick-story', 'claude-animation', 'voice-studio', 'voice-studio-3d']),
  description: z.string().min(1),
  environment: z.string().min(1),
  camera: z.object({preset: z.string().min(1)}),
  animation: z.array(z.string()).default([]),
  transition: z.enum(['cut', 'fade', 'crossfade', 'flash', 'slide', 'zoom']).default('cut'),
  audioCues: z.array(z.object({type: z.string(), atWord: z.string().optional()})).default([]),
  screenRecording: z.object({
    url: z.string().url(),
    assetPath: z.string().min(1).optional(),
    actions: z.array(z.object({type: z.enum(['click', 'fill', 'press', 'wait']), selector: z.string().optional(), value: z.string().optional(), key: z.string().optional(), milliseconds: z.number().int().positive().optional()})).default([]),
    durationSeconds: z.number().positive().default(5),
  }).optional(),
  assets: z.object({characterModelPath: z.string().min(1).optional(), environmentModelPath: z.string().min(1).optional()}).optional(),
  visualPlan: VisualPlanSchema.optional(),
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
  captionStyle: z.enum(['word-by-word', 'phrase', 'cinematic', 'minimal']).default('phrase'),
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
export type VisualPlan = z.infer<typeof VisualPlanSchema>;
export type Line = Project['lines'][number];
export type Scene = Project['scenes'][number];

export function parseProject(input: unknown): Project {
  return ProjectSchema.parse(input);
}
