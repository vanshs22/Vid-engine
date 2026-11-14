from __future__ import annotations

import argparse
import json
from pathlib import Path

from .models import PageProfile, ProductionMode, ProjectRequest
from .longform import LongFormEditor
from .raw_pipeline import RawFootagePipeline
from .orchestrator import Director
from .registry import AgentRegistry
from .workflow import ApprovalWorkflow


def main() -> None:
    parser = argparse.ArgumentParser(description='Universal Video Studio local agent orchestrator')
    sub = parser.add_subparsers(dest='command', required=True)
    raw = sub.add_parser('raw-plan')
    raw.add_argument('source')
    raw.add_argument('--output', default='out/edit-plan.json')
    raw.add_argument('--max-silence', type=float, default=0.25)
    raw_render = sub.add_parser('raw-render')
    raw_render.add_argument('plan')
    raw_render.add_argument('--output', default='out/raw-edited.mp4')
    lf = sub.add_parser('longform-plan')
    lf.add_argument('source')
    lf.add_argument('--seconds', type=int, default=30)
    lf.add_argument('--transcript')
    lf.add_argument('--split-screen', action='store_true')
    lf.add_argument('--screencast', action='store_true')
    page_save = sub.add_parser('page-save')
    page_save.add_argument('--page-id', required=True)
    page_save.add_argument('--style', default='voice-studio-3d')
    page_save.add_argument('--caption-style', default='word-by-word')
    page_save.add_argument('--voice-profile', default='default')
    page_save.add_argument('--audio-profile', default='default')
    page_save.add_argument('--competitor', action='append', default=[])
    page_save.add_argument('--reference-url', action='append', default=[])
    page_show = sub.add_parser('page-show')
    page_show.add_argument('--page-id', required=True)
    sim = sub.add_parser('simulate-production')
    sim.add_argument('--topic', default='How local voice generation works')
    sub.add_parser('agents')
    run = sub.add_parser('run-mvp')
    run.add_argument('--topic', default='How local voice generation works')
    run.add_argument('--project-id', default='agent-mvp')
    run.add_argument('--style', default='voice-studio-3d')
    args = parser.parse_args()
    if args.command == 'agents':
        print(json.dumps([item.__dict__ for item in AgentRegistry().list()], indent=2))
        return
    if args.command == 'raw-plan':
        pipeline = RawFootagePipeline()
        plan = pipeline.plan(Path(args.source), args.max_silence)
        Path(args.output).parent.mkdir(parents=True, exist_ok=True)
        Path(args.output).write_text(plan.model_dump_json(indent=2) + '\\n')
        print(plan.model_dump_json(indent=2))
        return
    if args.command == 'raw-render':
        plan = __import__('backend.app.raw_pipeline', fromlist=['EditDecisionList']).EditDecisionList.model_validate_json(Path(args.plan).read_text())
        RawFootagePipeline().render(plan, Path(args.output))
        print(args.output)
        return
    if args.command == 'longform-plan':
        plan = LongFormEditor().plan(Path(args.source), args.seconds, Path(args.transcript) if args.transcript else None, args.split_screen, args.screencast)
        print(plan.model_dump_json(indent=2))
        return
    if args.command == 'page-save':
        from .orchestrator import Director
        profile = PageProfile(page_id=args.page_id, style=args.style, caption_style=args.caption_style, voice_profile=args.voice_profile, audio_profile=args.audio_profile, competitors=args.competitor, reference_urls=args.reference_url)
        Director(Path('.')).store.save_page_profile(profile)
        print(json.dumps(profile.model_dump(mode='json'), indent=2))
        return
    if args.command == 'page-show':
        from .orchestrator import Director
        profile = Director(Path('.')).store.load_page_profile(args.page_id)
        print(json.dumps(profile.model_dump(mode='json') if profile else {'error': 'not_found'}, indent=2))
        return
    if args.command == 'simulate-production':
        print(json.dumps(ApprovalWorkflow(Path('.')).simulate(args.topic), indent=2))
        return
    request = ProjectRequest(project_id=args.project_id, topic=args.topic, style=args.style, mode=ProductionMode.creation)
    state = Director(Path('.')).run(request, on_event=print)
    print(json.dumps(state.model_dump(mode='json'), indent=2))


if __name__ == '__main__':
    main()
