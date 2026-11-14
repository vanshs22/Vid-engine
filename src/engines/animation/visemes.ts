export type VisemeCue = {startSeconds: number; endSeconds: number; value: number};

export function visemeValueAt(cues: VisemeCue[], seconds: number): number {
  const cue = cues.find((candidate) => seconds >= candidate.startSeconds && seconds <= candidate.endSeconds);
  return cue?.value ?? 0;
}

export function applyMouthMorphs(root: any, value: number): void {
  root.traverse?.((node: any) => {
    const dictionary = node.morphTargetDictionary;
    const influences = node.morphTargetInfluences;
    if (!dictionary || !influences) return;
    for (const name of ['mouthOpen', 'viseme_aa', 'jawOpen', 'mouth_open']) {
      const index = dictionary[name];
      if (typeof index === 'number') influences[index] = value;
    }
  });
}
