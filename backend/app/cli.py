from __future__ import annotations

import argparse
import json
from pathlib import Path

from .models import ProductionMode, ProjectRequest
from .orchestrator import Director
from .registry import AgentRegistry
from .workflow import ApprovalWorkflow


def main() -> None:
    parser = argparse.ArgumentParser(description='Universal Video Studio local agent orchestrator')
    sub = parser.add_subparsers(dest='command', required=True)
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
    if args.command == 'simulate-production':
        print(json.dumps(ApprovalWorkflow(Path('.')).simulate(args.topic), indent=2))
        return
    request = ProjectRequest(project_id=args.project_id, topic=args.topic, style=args.style, mode=ProductionMode.creation)
    state = Director(Path('.')).run(request, on_event=print)
    print(json.dumps(state.model_dump(mode='json'), indent=2))


if __name__ == '__main__':
    main()
