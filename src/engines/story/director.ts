import type {Line, Scene, VisualPlan} from '../../types/project';

/**
 * Deterministic sentence-to-visual director. It is deliberately provider-free:
 * an LLM or research provider can replace this later while keeping the same
 * VisualPlan artifact contract.
 */
export function directScene(line: Line, scene: Scene): VisualPlan {
  const text = line.text.toLowerCase();
  const stepIndex = scene.id.match(/\d+/) ? Math.max(0, Number(scene.id.match(/\d+/)![0]) - 1) : 0;
  if (/(download|install|model)/.test(text)) return plan('Show a local download workflow', 'voice model', 'download the model', 'download', 'ui-push', 'download-progress', stepIndex, 'Download it once');
  if (/(record|sample|microphone)/.test(text)) return plan('Show a recording workflow', 'voice sample', 'record a short sample', 'recording', 'character-close', 'record-waveform', stepIndex, 'Clone your voice');
  if (/(accent|age|pitch|emotion|speed|design)/.test(text)) return plan('Show voice controls being tuned', 'voice settings', 'adjust voice controls', 'voice-design', 'ui-push', 'move-sliders', stepIndex, 'Design the sound');
  if (/(generate|type|script|audio file)/.test(text)) return plan('Show text becoming generated audio', 'voice generator', 'generate the audio', 'generate', 'ui-push', 'generate-waveform', stepIndex, 'Type and generate');
  if (/(caption|word|timing|sync)/.test(text)) return plan('Show narration and captions aligning', 'caption timeline', 'sync words to narration', 'caption-sync', 'object-close', 'caption-timeline', stepIndex, 'Sync captions');
  if (/(permission|own|copy|yes)/.test(text)) return plan('Show a clear permission reminder', 'voice rights', 'use an allowed voice', 'permission', 'permission-wide', 'permission-reveal', stepIndex, 'Get permission');
  if (/(local|computer|free|cost|money)/.test(text)) return plan('Introduce the local voice workflow', 'local voice studio', 'run the workflow locally', 'none', stepIndex === 0 ? 'hook-wide' : 'ui-push', 'orb-pulse', stepIndex, stepIndex === 0 ? 'Voice without the bill' : 'Run it locally');
  return plan('Show the subject in its environment', scene.environment, scene.animation.join(', ') || 'explain the idea', 'none', 'hook-wide', 'orb-pulse', stepIndex, scene.description);
}

function plan(purpose: string, subject: string, action: string, uiComponent: VisualPlan['uiComponent'], camera: VisualPlan['camera'], animationPreset: VisualPlan['animationPreset'], stepIndex: number, heading: string): VisualPlan {
  return {purpose, subject, action, uiComponent, camera, animationPreset, stepIndex, heading};
}
