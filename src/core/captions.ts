import type {Line} from '../types/project';
import type {Timing, WordTiming} from './timing';

export type CaptionChunk = {
  text: string;
  highlight: string | null;
  startSeconds: number;
  endSeconds: number;
};

export function parseCaptionChunks(line: Line, words: WordTiming[]): CaptionChunk[] {
  const source = line.caption.split('|').map((chunk) => chunk.trim()).filter(Boolean);
  if (source.length === 0 || words.length === 0) return [];
  let searchFrom = 0;

  return source.map((chunk, index) => {
    const tokens = chunk.split(/\s+/).filter(Boolean);
    const highlighted = tokens.find((token) => token.startsWith('*'))?.replace(/^\*/, '') ?? null;
    const cleanTokens = tokens.map((token) => token.replace(/^\*/, ''));
    const first = cleanTokens[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? '';
    const matchingIndex = words.findIndex((word, wordIndex) => wordIndex >= searchFrom && word.text.toLowerCase().replace(/[^a-z0-9]/g, '').startsWith(first));
    const resolvedStartIndex = matchingIndex >= 0 ? matchingIndex : Math.min(searchFrom, words.length - 1);
    const startWord = words[resolvedStartIndex];
    const nextChunk = source[index + 1];
    const nextFirst = nextChunk?.split(/\s+/)[0]?.replace(/^\*/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const nextIndex = nextFirst ? words.findIndex((word, wordIndex) => wordIndex > resolvedStartIndex && word.text.toLowerCase().replace(/[^a-z0-9]/g, '').startsWith(nextFirst)) : -1;
    const endIndex = nextIndex > resolvedStartIndex ? nextIndex - 1 : words.length - 1;
    const endWord = words[endIndex];
    searchFrom = Math.max(resolvedStartIndex + 1, endIndex + 1);

    return {
      text: cleanTokens.join(' '),
      highlight: highlighted,
      startSeconds: startWord.startSeconds,
      endSeconds: Math.max(startWord.endSeconds, endWord.endSeconds),
    };
  });
}

export function captionsForLine(line: Line, timing: Timing): CaptionChunk[] {
  const lineWords = timing.words.filter((word) => word.lineId === line.id);
  const lineTiming = timing.lines.find((candidate) => candidate.lineId === line.id);
  return parseCaptionChunks(line, lineWords).map((chunk) => ({
    ...chunk,
    startSeconds: Math.max(lineTiming?.startSeconds ?? chunk.startSeconds, chunk.startSeconds),
    endSeconds: Math.min(lineTiming?.endSeconds ?? chunk.endSeconds, chunk.endSeconds),
  }));
}
