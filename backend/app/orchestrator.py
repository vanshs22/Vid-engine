from __future__ import annotations

from pathlib import Path
from typing import Callable

from .agents.base import AgentContext
from .agents.mvp import AGENT_CLASSES
from .learning import LearningSupervisor
from .models import ProductionState, ProjectRequest, Task, TaskStatus
from .registry import AgentRegistry
from .store import SQLiteStore


MVP_ORDER = ["research", "script_writer", "script_critic", "prompt_designer", "storyboard", "visual_production", "voice", "alignment", "editor", "quality", "learning"]


class Director:
    def __init__(self, root: Path):
        self.root = root
        self.registry = AgentRegistry()
        self.store = SQLiteStore(root / ".cache/agent-state.sqlite3")

    def create_state(self, request: ProjectRequest) -> ProductionState:
        state = ProductionState(project=request, stage="planned")
        previous = self.store.load_state(request.project_id)
        if previous:
            return previous
        for name in MVP_ORDER:
            task = Task(project_id=request.project_id, agent=name, action=f"Run {name}")
            state.tasks.append(task)
            self.store.save_task(task)
        self.store.save_state(state)
        return state

    def run(self, request: ProjectRequest, on_event: Callable[[str], None] | None = None) -> ProductionState:
        state = self.create_state(request)
        workspace = self.root / "projects" / request.project_id / "agent-artifacts"
        workspace.mkdir(parents=True, exist_ok=True)
        learner = LearningSupervisor(self.store)
        context = AgentContext(root=self.root, workspace=workspace, store=self.store, lessons=learner.context(request.project_id))
        for task in state.tasks:
            if task.status == TaskStatus.completed:
                continue
            task.status = TaskStatus.running
            task.attempts += 1
            self.store.save_task(task)
            if on_event:
                on_event(f"{task.agent}:running")
            agent_type = AGENT_CLASSES.get(task.agent)
            if not agent_type:
                task.status = TaskStatus.failed
                task.error = "Agent implementation missing"
                state.errors.append(task.error)
                continue
            try:
                result = agent_type().run(task, state, context)
                task.status = result.status
                task.error = result.message if result.status == TaskStatus.failed else None
                state.artifacts.extend(result.artifacts)
                for item in result.artifacts:
                    self.store.save_artifact(item)
                lesson = learner.review(state, result)
                context.lessons.append(lesson)
                if result.status == TaskStatus.failed:
                    state.errors.append(result.message)
            except Exception as exc:
                task.status = TaskStatus.failed
                task.error = str(exc)
                state.errors.append(f"{task.agent}: {exc}")
            self.store.save_task(task)
            if on_event:
                on_event(f"{task.agent}:{task.status.value}")
            self.store.save_state(state)
        state.stage = "completed" if not state.errors else "completed_with_errors"
        self.store.save_state(state)
        return state
