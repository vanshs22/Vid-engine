from __future__ import annotations

import json
import subprocess
from pathlib import Path

from .base import Agent, AgentContext
from ..models import AgentResult, Artifact, ArtifactType, ProductionState, Task, TaskStatus
from ..agent_reach import AgentReachAdapter
from ..providers import LLMRouter, ResearchProvider, VisionReviewProvider
from ..editing import RawFootageEditor
from ..longform import LongFormEditor


def artifact(state: ProductionState, kind: ArtifactType, path: Path, producer: str, **metadata: object) -> Artifact:
    return Artifact(project_id=state.project.project_id, artifact_type=kind, path=str(path), producer=producer, metadata=metadata)


class ResearchAgent(Agent):
    name = "research"
    def run(self, task, state, context):
        path = context.workspace / "research.md"
        source = None
        if state.project.reference_path and state.project.reference_path.startswith(('http://', 'https://')):
            source = ResearchProvider().fetch_url(state.project.reference_path)
        if source and context.settings.llm_enabled:
            text = LLMRouter(context.settings).text([{'role': 'system', 'content': 'Summarize factual claims with source URLs. Do not invent facts.'}, {'role': 'user', 'content': json.dumps(source)[:100000]}])
            path.write_text(f"# Research brief\n\nTopic: {state.project.topic}\n\n{text}\n\nSource: {source['url']}\n")
            return AgentResult(agent=self.name, status=TaskStatus.completed, artifacts=[artifact(state, ArtifactType.research, path, self.name, provider='llm')])
        path.write_text(f"# Research brief\n\nTopic: {state.project.topic}\n\nLocal MVP mode: claims require human review before publication.\n")
        return AgentResult(agent=self.name, status=TaskStatus.completed, artifacts=[artifact(state, ArtifactType.research, path, self.name, provider='deterministic')])


class TrendResearchAgent(Agent):
    name = "trend_research"
    def run(self, task, state, context):
        if not state.project.trend_research:
            return AgentResult(agent=self.name, status=TaskStatus.skipped, message="Trend research not requested")
        adapter = AgentReachAdapter()
        if not adapter.available():
            return AgentResult(agent=self.name, status=TaskStatus.skipped, message="Agent-Reach CLI is not installed")
        queries = []
        terms = [state.project.topic, *state.project.competitors]
        for term in terms:
            for channel in ('youtube', 'twitter', 'reddit', 'instagram', 'tiktok'):
                result = adapter.search(channel, f"{state.project.niche} {term}")
                queries.append(result)
        path = context.workspace / 'trend-research.json'
        path.write_text(json.dumps({'topic': state.project.topic, 'niche': state.project.niche, 'results': queries}, indent=2) + '\\n')
        return AgentResult(agent=self.name, status=TaskStatus.completed, artifacts=[artifact(state, ArtifactType.research, path, self.name, channels=['youtube', 'twitter', 'reddit'])])


class ScriptWriterAgent(Agent):
    name = "script_writer"
    def run(self, task, state, context):
        path = context.workspace / "script-brief.md"
        if context.settings.llm_enabled:
            prompt = f"Write a concise {state.project.duration_seconds}-second vertical explainer script about {state.project.topic}. Use a hook, clear beats, and a conclusion. Return plain text only."
            text = LLMRouter(context.settings).text([{'role': 'system', 'content': 'You are a professional short-form script writer. Never invent factual claims.'}, {'role': 'user', 'content': prompt}])
            path.write_text(f"# Approved script draft\n\n{text}\n")
            provider = 'llm'
        else:
            path.write_text(f"# Script brief\n\nTopic: {state.project.topic}\nDuration target: {state.project.duration_seconds}s\nStyle: {state.project.style}\n\nThe existing sample project remains the approved render input until a script provider is configured.\n")
            provider = 'deterministic'
        return AgentResult(agent=self.name, status=TaskStatus.completed, artifacts=[artifact(state, ArtifactType.script, path, self.name, provider=provider)])


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


class LongFormEditorAgent(Agent):
    name = "longform_editor"
    def run(self, task, state, context):
        if not state.project.raw_path:
            return AgentResult(agent=self.name, status=TaskStatus.skipped, message="No long-form source supplied")
        source = Path(state.project.raw_path).resolve()
        if not source.exists(): return AgentResult(agent=self.name, status=TaskStatus.failed, message=f"Long-form source not found: {source}")
        plan = LongFormEditor().plan(source, min(60, max(15, state.project.duration_seconds)))
        path = context.workspace / 'short-candidates.json'
        path.write_text(plan.model_dump_json(indent=2) + '\\n')
        return AgentResult(agent=self.name, status=TaskStatus.completed, artifacts=[artifact(state, ArtifactType.storyboard, path, self.name, candidates=len(plan.candidates))])


class RawEditingAgent(Agent):
    name = "raw_editor"
    def run(self, task, state, context):
        if not state.project.raw_path:
            return AgentResult(agent=self.name, status=TaskStatus.skipped, message="No raw footage supplied")
        source = Path(state.project.raw_path).resolve()
        if not source.exists(): return AgentResult(agent=self.name, status=TaskStatus.failed, message=f"Raw footage not found: {source}")
        editor = RawFootageEditor()
        plan = editor.edit_plan(source)
        plan_path = context.workspace / 'edit-plan.json'
        plan_path.write_text(json.dumps(plan, indent=2) + '\\n')
        audio_path = context.workspace / 'audio.wav'
        editor.extract_audio(source, audio_path)
        return AgentResult(agent=self.name, status=TaskStatus.completed, artifacts=[artifact(state, ArtifactType.storyboard, plan_path, self.name), artifact(state, ArtifactType.audio, audio_path, self.name)])


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
            metadata = {}
            if context.settings.gemini_enabled:
                review = VisionReviewProvider(context.settings).review([str(context.root / 'out/voice-studio-final.png')], 'Review this rendered video frame for visual defects, composition, and whether the UI matches the narration. Return concise JSON-like feedback.')
                metadata['vision_review'] = review
            return AgentResult(agent=self.name, status=TaskStatus.completed, artifacts=[artifact(state, ArtifactType.qa_report, report, self.name, **metadata)])
        return AgentResult(agent=self.name, status=TaskStatus.skipped, message="Run npm run qa:video after rendering")


class LearningAgent(Agent):
    name = "learning"
    def run(self, task, state, context):
        lesson = {"project_id": state.project.project_id, "lesson": "Keep semantic scene plans separate from renderer implementations.", "approved": False}
        context.store.save_lesson(state.project.project_id, lesson)
        return self.complete("Lesson recorded as a proposal")


AGENT_CLASSES = {cls.name: cls for cls in [ResearchAgent, TrendResearchAgent, ScriptWriterAgent, ScriptCriticAgent, PromptDesignerAgent, StoryboardAgent, VisualProductionAgent, VoiceAgent, AlignmentAgent, LongFormEditorAgent, RawEditingAgent, EditorAgent, QualityAgent, LearningAgent]}
