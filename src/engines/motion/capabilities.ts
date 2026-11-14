export type MotionSkillId = 'remocn-transitions' | 'bang-anti-slide' | 'bang-kinetic-ui' | 'claude-stickman' | 'claude-zach-3d' | 'openshorts-longform' | 'screen-capture';

export const MOTION_SKILLS: Record<MotionSkillId, {source: string; license: string; useWhen: string}> = {
  'remocn-transitions': {source: 'Remocn/remocn', license: 'MIT', useWhen: 'Use frame-driven transitions and text reveals when a scene change is motivated.'},
  'bang-anti-slide': {source: 'bangtutorial/bang-motion', license: 'MIT', useWhen: 'Reject empty panels, repeated layouts, and slide-like frozen scenes.'},
  'bang-kinetic-ui': {source: 'bangtutorial/bang-motion', license: 'MIT', useWhen: 'Use kinetic UI, living stages, and contextual motion graphics for explainers.'},
  'claude-stickman': {source: 'artemnovitckii/claude-animation-skills', license: 'MIT', useWhen: 'Use story beats, character anchors, physical actions, and stickman motion.'},
  'claude-zach-3d': {source: 'artemnovitckii/claude-animation-skills', license: 'MIT', useWhen: 'Use 3D cartoon props, impacts, captions, and camera motion for explainers.'},
  'openshorts-longform': {source: 'mutonby/openshorts', license: 'MIT', useWhen: 'Use transcript-driven clip scoring and vertical crop modes for long-form input.'},
  'screen-capture': {source: 'local Playwright integration', license: 'project', useWhen: 'Use a real browser recording when the narration names a real website or app.'},
};

export function motionSkillsForVisual(uiComponent: string, style: string, longform = false): MotionSkillId[] {
  const skills: MotionSkillId[] = ['remocn-transitions', 'bang-anti-slide'];
  if (style.includes('stick')) skills.push('claude-stickman');
  if (style.includes('3d')) skills.push('claude-zach-3d');
  if (uiComponent === 'screen-recording') skills.push('screen-capture', 'bang-kinetic-ui');
  if (uiComponent !== 'none') skills.push('bang-kinetic-ui');
  if (longform) skills.push('openshorts-longform');
  return [...new Set(skills)];
}
