from __future__ import annotations

import argparse
import json
from pathlib import Path

from .models import PageProfile, ProductionMode, ProjectRequest
from .orchestrator import Director
from .registry import AgentRegistry
from .workflow import ApprovalWorkflow


def main() -> None:
    parser = argparse.ArgumentParser(description='Universal Video Studio local agent orchestrator')
    sub = parser.add_subparsers(dest='command', required=True)
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
