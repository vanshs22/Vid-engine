import {createHash} from 'node:crypto';
import type {Project} from '../../types/project';
import {estimateTiming} from '../../core/timing';
import type {VoiceArtifact, VoiceProvider} from './types';

export class EstimatedVoiceProvider implements VoiceProvider {
  readonly name = 'estimated' as const;

  async generate(project: Project): Promise<VoiceArtifact> {
    const timing = estimateTiming(project);
    const cacheKey = createHash('sha256').update(JSON.stringify({project, timing})).digest('hex').slice(0, 16);
    return {audioPath: null, timing, provider: this.name, cacheKey};
  }
}
