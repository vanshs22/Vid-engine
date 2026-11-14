# Bang Motion integration

Source inspected: [bangtutorial/bang-motion](https://github.com/bangtutorial/bang-motion), MIT.

Bang Motion is an agent skill library for browser motion graphics, kinetic UI, openers, explainers, living stages, and anti-slide production rules. It is not imported as a runtime package.

Our `src/engines/motion/capabilities.ts` maps its reusable principles to scenes:

- `bang-anti-slide`: reject blank panels, repeated layouts, and frozen scenes.
- `bang-kinetic-ui`: use contextual UI motion and living stages when the sentence calls for it.
- `remocn-transitions`: use frame-driven transitions only when a scene plan asks for one.
- `screen-capture`: use Playwright for real websites/apps instead of fictional screenshots.

The sentence director emits the selected motion-skill IDs into every visual plan. The selection is deterministic and can later be replaced or enriched by the configured LLM prompt director without changing the renderer contract.
