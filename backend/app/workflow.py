from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from .config import ProviderConfig
from .prompting import PromptDirector


STAGES = ['script', 'style', 'storyboard', 'audio', 'captions', 'render']


@dataclass
class ApprovalWorkflow:
    root: Path
    config: ProviderConfig = ProviderConfig()

    def __post_init__(self):
        self.store = self.root / '.cache/workflows'
        self.store.mkdir(parents=True, exist_ok=True)

    def start(self, topic: str, duration_seconds: int = 30, style: str = 'voice-studio-3d') -> dict:
        workflow = {
            'id': f'workflow-{uuid4().hex[:8]}', 'topic': topic, 'duration_seconds': duration_seconds, 'style': style,
            'stage': 'script', 'approvals': {stage: {'status': 'pending', 'feedback': None} for stage in STAGES}, 'artifacts': {},
        }
        self._write(workflow)
        self._build_script(workflow)
        return workflow

    def approve(self, workflow_id: str, stage: str, feedback: str | None = None) -> dict:
        workflow = self.load(workflow_id)
        if stage not in STAGES: raise ValueError(f'Unknown approval stage: {stage}')
        gate = workflow['approvals'][stage]
        gate['status'] = 'approved'
        gate['feedback'] = feedback
        index = STAGES.index(stage)
        if index + 1 < len(STAGES):
            workflow['stage'] = STAGES[index + 1]
            self._build_next(workflow, workflow['stage'])
        else:
            workflow['stage'] = 'completed'
        self._write(workflow)
        return workflow

    def reject(self, workflow_id: str, stage: str, feedback: str) -> dict:
        workflow = self.load(workflow_id)
        workflow['approvals'][stage] = {'status': 'rejected', 'feedback': feedback}
        workflow['stage'] = stage
        self._write(workflow)
        return workflow

    def simulate(self, topic: str) -> dict:
        workflow = self.start(topic)
        for stage in STAGES[:-1]:
            workflow = self.approve(workflow['id'], stage, 'Approved by terminal simulation')
        workflow = self.approve(workflow['id'], 'render', 'Approved by terminal simulation')
        return workflow

    def load(self, workflow_id: str) -> dict:
        path = self.store / f'{workflow_id}.json'
        if not path.exists(): raise FileNotFoundError(workflow_id)
        return json.loads(path.read_text())

    def _build_script(self, workflow: dict):
        result = PromptDirector(self.config).build('script', {'topic': workflow['topic'], 'duration_seconds': workflow['duration_seconds'], 'style': workflow['style']})
        workflow['artifacts']['script_prompt.json'] = result
        self._write(workflow)

    def _build_next(self, workflow: dict, stage: str):
        if stage == 'style':
            workflow['artifacts']['style-board.svg'] = self._style_board(workflow)
        elif stage == 'storyboard':
            sentences = [line['text'] for line in self._sample_lines()]
            workflow['artifacts']['storyboard.json'] = PromptDirector(self.config).build('scene', {'sentences': sentences, 'style': workflow['style']})
            workflow['artifacts']['storyboard-preview.svg'] = self._storyboard_preview(sentences)
        elif stage == 'audio':
            workflow['artifacts']['audio-options.json'] = {'default': 'kokoro-local', 'alternatives': ['recording', 'provider-adapter'], 'voice_policy': 'One voice per character; keep voice identity stable.'}
        elif stage == 'captions':
            workflow['artifacts']['caption-options.json'] = {'styles': ['word-by-word', 'phrase', 'cinematic', 'minimal'], 'default': 'word-by-word'}
        elif stage == 'render':
            result = subprocess.run(['npm', 'run', 'render:final'], cwd=self.root, capture_output=True, text=True)
            workflow['artifacts']['render.log'] = {'returncode': result.returncode, 'stdout_tail': result.stdout[-2000:], 'stderr_tail': result.stderr[-2000:]}

    def _sample_lines(self):
        return json.loads((self.root / 'projects/sample/project.json').read_text())['lines']

    def _style_board(self, workflow):
        return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="600"><rect width="1080" height="600" fill="#21191a"/><circle cx="820" cy="280" r="130" fill="#e9855b"/><rect x="60" y="70" width="960" height="80" rx="20" fill="#211f26"/><text x="60" y="250" fill="#f5e9d1" font-size="54" font-family="Georgia">{workflow['style']}</text><text x="60" y="330" fill="#f1c66d" font-size="30" font-family="Arial">Warm studio · procedural 3D · gold captions · semantic UI</text></svg>'''

    def _storyboard_preview(self, sentences):
        cards = ''.join(f'<rect x="{30 + (i % 3) * 350}" y="{30 + (i // 3) * 180}" width="310" height="150" rx="16" fill="#211f26"/><text x="{50 + (i % 3) * 350}" y="{90 + (i // 3) * 180}" fill="#f5e9d1" font-size="20">{i+1}. {sentence[:32]}</text>' for i, sentence in enumerate(sentences[:9]))
        return f'<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="600" fill="#2b2020">{cards}</svg>'

    def _write(self, workflow):
        (self.store / f"{workflow['id']}.json").write_text(json.dumps(workflow, indent=2) + '\n')
