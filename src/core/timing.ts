import {z} from 'zod';
import type {Line, Project} from '../types/project';

export type WordTiming = {
  text: string;
  lineId: string;
  lineIndex: number;
  startSeconds: number;
  endSeconds: number;
};

export type LineTiming = {
  lineId: string;
  lineIndex: number;
  text: string;
  startSeconds: number;
  endSeconds: number;
};

export type Timing = z.infer<typeof TimingSchema>;

const TimingNumber = z.number().finite().nonnegative();
export const TimingSchema = z.object({
  durationSeconds: z.number().finite().positive(),
  lines: z.array(z.object({
    lineId: z.string().min(1),
    lineIndex: z.number().int().nonnegative(),
    text: z.string().min(1),
    startSeconds: TimingNumber,
    endSeconds: TimingNumber,
  })),
  words: z.array(z.object({
    text: z.string().min(1),
    lineId: z.string().min(1),
    lineIndex: z.number().int().nonnegative(),
    startSeconds: TimingNumber,
    endSeconds: TimingNumber,
  })),
  estimated: z.boolean(),
});

export function parseTiming(input: unknown): Timing {
  return TimingSchema.parse(input);
}

const WORDS_PER_SECOND = 2.8;

function wordsFor(line: Line): string[] {
  return line.text.split(/\s+/).filter(Boolean);
}

export function estimateTiming(project: Project, wordsPerSecond = WORDS_PER_SECOND): Timing {
  let cursor = 0.45;
  const lines: LineTiming[] = [];
  const words: WordTiming[] = [];

  project.lines.forEach((line, lineIndex) => {
    const tokens = wordsFor(line);
    const weights = tokens.map((token) => Math.max(1, token.replace(/[^a-z0-9]/gi, '').length) + 2.5);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const speechDuration = tokens.length / (wordsPerSecond * project.voice.speed);
    const startSeconds = cursor;

    tokens.forEach((token, wordIndex) => {
      const wordDuration = speechDuration * (weights[wordIndex] / totalWeight);
      const speakingEnd = cursor + wordDuration * 0.92;
      words.push({
        text: token,
        lineId: line.id,
        lineIndex,
        startSeconds: round(cursor),
        endSeconds: round(speakingEnd),
      });
      cursor += wordDuration;
      if (/,\s*$/.test(token)) cursor += 0.16;
      if (/[.!?]$/.test(token) && wordIndex < tokens.length - 1) cursor += 0.32;
    });

    const endSeconds = cursor;
    lines.push({lineId: line.id, lineIndex, text: line.text, startSeconds: round(startSeconds), endSeconds: round(endSeconds)});
    cursor += line.gapSeconds;
  });

  return TimingSchema.parse({
    durationSeconds: round(cursor + 0.9),
    lines,
    words,
    estimated: true,
  });
}

export function secondsToFrames(seconds: number, fps: number): number {
  return Math.max(0, Math.round(seconds * fps));
}

export function framesToSeconds(frames: number, fps: number): number {
  return frames / fps;
}

export function timingForScene(timing: Timing, lineId: string, fps: number) {
  const lineIndex = timing.lines.findIndex((candidate) => candidate.lineId === lineId);
  const line = timing.lines[lineIndex];
  if (!line) throw new Error(`No timing found for line ${lineId}`);
  const nextLine = timing.lines[lineIndex + 1];
  const start = secondsToFrames(line.startSeconds, fps);
  const sceneEndSeconds = nextLine?.startSeconds ?? timing.durationSeconds;
  const end = Math.max(start + 1, secondsToFrames(sceneEndSeconds, fps));
  return {from: start, durationInFrames: end - start};
}

export function wordsForLine(timing: Timing, lineId: string): WordTiming[] {
  return timing.words.filter((word) => word.lineId === lineId);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
