from __future__ import annotations

import json
import subprocess
from pathlib import Path

from .base import Agent, AgentContext
from ..models import AgentResult, Artifact, ArtifactType, ProductionState, Task, TaskStatus


def artifact(state: ProductionState, kind: ArtifactType, path: Path, producer: str, **metadata: object) -> Artifact:
    return Artifact(project_id=state.project.project_id, artifact_type=kind, path=str(path), producer=producer, metadata=metadata)


class ResearchAgent(Agent):
    name = "research"
    def run(self, task, state, context):
        path = context.workspace / "research.md"
        path.write_text(f"# Research brief\n\nTopic: {state.project.topic}\n\nLocal MVP mode: claims require human review before publication.\n")
        return AgentResult(agent=self.name, status=TaskStatus.completed, artifacts=[artifact(state, ArtifactType.research, path, self.name)])


class ScriptWriterAgent(Agent):
    name = "script_writer"
    def run(self, task, state, context):
        path = context.workspace / "script-brief.md"
        path.write_text(f"# Script brief\n\nTopic: {state.project.topic}\nDuration target: {state.project.duration_seconds}s\nStyle: {state.project.style}\n\nThe existing sample project remains the approved render input until a script provider is configured.\n")
        return AgentResult(agent=self.name, status=TaskStatus.completed, artifacts=[artifact(state, ArtifactType.script, path, self.name)])


class ScriptCriticAgent(Agent):
    name = "script_critic"
    def run(self, task, state, context):
        path = context.workspace / "script-critique.md"
        path.write_text("# Script critique\n\nStatus: approved for deterministic local MVP execution.\nReview required before factual publication.\n")
        return AgentResult(agent=self.name, status=TaskStatus.completed, artifacts=[artifact(state, ArtifactType.script, path, self.name, decision="approved")])


class PromptDesignerAgent(Agent):
    name = "prompt_designer"
    def run(self, task, state, context):
        path = context.workspace / "prompt-plan.json"
        payload = {"style": state.project.style, "principles": ["warm studio", "semantic UI", "stable character identity", "frame-driven motion"]}
        path.write_text(json.dumps(payload, indent=2) + "\n")
        return AgentResult(agent=self.name, status=TaskStatus.completed, artifacts=[artifact(state, ArtifactType.style_profile, path, self.name)])


class StoryboardAgent(Agent):
    name = "storyboard"
    def run(self, task, state, context):
        path = context.workspace / "storyboard.json"
        payload = {"topic": state.project.topic, "style": state.project.style, "mode": state.project.mode.value, "scene_contract": "projects/sample/project.json"}
        path.write_text(json.dumps(payload, indent=2) + "\n")
        return AgentResult(agent=self.name, status=TaskStatus.completed, artifacts=[artifact(state, ArtifactType.storyboard, path, self.name)])


class VisualProductionAgent(Agent):
    name = "visual_production"
    def run(self, task, state, context):
        return self.complete("Existing Remotion and Three.js renderer selected")


class VoiceAgent(Agent):
    name = "voice"
    def run(self, task, state, context):
        audio = context.root / "projects/sample/data/narration.wav"
        if audio.exists():
            return AgentResult(agent=self.name, status=TaskStatus.completed, artifacts=[artifact(state, ArtifactType.audio, audio, self.name, provider="kokoro")])
        return AgentResult(agent=self.name, status=TaskStatus.skipped, message="Optional Kokoro artifact is not present")


class AlignmentAgent(Agent):
    name = "alignment"
    def run(self, task, state, context):
        timing = context.root / "projects/sample/data/timing.json"
        if timing.exists():
            return AgentResult(agent=self.name, status=TaskStatus.completed, artifacts=[artifact(state, ArtifactType.timing, timing, self.name)])
        return AgentResult(agent=self.name, status=TaskStatus.skipped, message="Timing artifact is not present")


class EditorAgent(Agent):
    name = "editor"
    def run(self, task, state, context):
        result = subprocess.run(["npm", "run", "prepare:render"], cwd=context.root, capture_output=True, text=True)
        if result.returncode:
            return AgentResult(agent=self.name, status=TaskStatus.failed, message=result.stderr[-2000:])
        return self.complete("Render manifest prepared")


class QualityAgent(Agent):
    name = "quality"
    def run(self, task, state, context):
        report = context.root / "out/qa-report.json"
        if report.exists():
            return AgentResult(agent=self.name, status=TaskStatus.completed, artifacts=[artifact(state, ArtifactType.qa_report, report, self.name)])
        return AgentResult(agent=self.name, status=TaskStatus.skipped, message="Run npm run qa:video after rendering")


class LearningAgent(Agent):
    name = "learning"
    def run(self, task, state, context):
        lesson = {"project_id": state.project.project_id, "lesson": "Keep semantic scene plans separate from renderer implementations.", "approved": False}
        context.store.save_lesson(state.project.project_id, lesson)
        return self.complete("Lesson recorded as a proposal")


AGENT_CLASSES = {cls.name: cls for cls in [ResearchAgent, ScriptWriterAgent, ScriptCriticAgent, PromptDesignerAgent, StoryboardAgent, VisualProductionAgent, VoiceAgent, AlignmentAgent, EditorAgent, QualityAgent, LearningAgent]}
