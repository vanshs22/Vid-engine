import type {Project} from '../../types/project';
import type {Timing} from '../../core/timing';

export type VoiceArtifact = {
  audioPath: string | null;
  timing: Timing;
  provider: 'estimated' | 'kokoro-onnx' | 'recording';
  cacheKey: string;
};

export interface VoiceProvider {
  readonly name: VoiceArtifact['provider'];
  generate(project: Project): Promise<VoiceArtifact>;
}
