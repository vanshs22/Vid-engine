import {z} from 'zod';

export const VisemeCueSchema = z.object({startSeconds: z.number().nonnegative(), endSeconds: z.number().nonnegative(), value: z.number().min(0).max(1)});
export const CharacterAssetSchema = z.object({
  assetId: z.string().min(1),
  modelPath: z.string().min(1),
  license: z.string().min(1),
  scale: z.number().positive().default(1),
  animationClips: z.record(z.string(), z.string()).default({}),
  morphAliases: z.record(z.string(), z.string()).default({}),
  visemes: z.array(VisemeCueSchema).default([]),
});
export type CharacterAsset = z.infer<typeof CharacterAssetSchema>;
