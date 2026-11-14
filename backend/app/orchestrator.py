from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any, Callable

from .agents.base import AgentContext
from .agents.mvp import AGENT_CLASSES
from .config import ProviderConfig
from .learning import LearningSupervisor
from .models import AgentResult, ProductionState, ProjectRequest, Task, TaskStatus
from .registry import AgentRegistry
from .store import SQLiteStore

MVP_ORDER = ["research", "script_writer", "script_critic", "prompt_designer", "storyboard", "visual_production", "voice", "alignment", "editor", "quality", "learning"]
DEPENDENCIES = {
    "script_writer": ["research"],
    "script_critic": ["script_writer"],
    "prompt_designer": ["script_critic"],
    "storyboard": ["script_critic"],
    "visual_production": ["prompt_designer", "storyboard"],
    "alignment": ["voice"],
    "editor": ["visual_production", "alignment"],
    "quality": ["editor"],
    "learning": ["quality"],
}


class Director:
    def __init__(self, root: Path):
        self.root = root
        self.registry = AgentRegistry()
        self.store = SQLiteStore(root / ".cache/agent-state.sqlite3")
        self.config = ProviderConfig()

    def create_state(self, request: ProjectRequest) -> ProductionState:
        state = ProductionState(project=request, stage="planned")
        previous = self.store.load_state(request.project_id)
        if previous:
            return previous
        task_ids: dict[str, str] = {}
        for name in MVP_ORDER:
            task = Task(project_id=request.project_id, agent=name, action=f"Run {name}")
            state.tasks.append(task)
            task_ids[name] = task.task_id
        for task in state.tasks:
            task.depends_on = [task_ids[name] for name in DEPENDENCIES.get(task.agent, [])]
            self.store.save_task(task)
        self.store.save_state(state)
        return state

    def run(self, request: ProjectRequest, on_event: Callable[[str], None] | None = None) -> ProductionState:
        state = self.create_state(request)
        try:
            from langgraph.graph import END, START, StateGraph
            graph = StateGraph(dict)
            graph.add_node("execute_ready", lambda payload: self._graph_execute_ready(payload, on_event))
            graph.add_node("retry_gate", lambda payload: self._graph_retry_gate(payload, on_event))
            graph.add_edge(START, "execute_ready")
            graph.add_conditional_edges("execute_ready", self._graph_route, {"continue": "execute_ready", "retry": "retry_gate", "complete": END, "stop": END})
            graph.add_conditional_edges("retry_gate", self._graph_retry_route, {"continue": "execute_ready", "stop": END})
            result = graph.compile().invoke({"state": state.model_dump(mode="json")})
            final_state = ProductionState.model_validate(result["state"])
        except ImportError:
            final_state = self._fallback_loop(state, on_event)
        final_state.stage = "completed" if not final_state.errors else "completed_with_errors"
        self.store.save_state(final_state)
        return final_state

    def _graph_execute_ready(self, payload: dict[str, Any], on_event: Callable[[str], None] | None) -> dict[str, Any]:
        state = ProductionState.model_validate(payload["state"])
        workspace = self.root / "projects" / state.project.project_id / "agent-artifacts"
        workspace.mkdir(parents=True, exist_ok=True)
        learner = LearningSupervisor(self.store)
        context = AgentContext(root=self.root, workspace=workspace, store=self.store, lessons=learner.context(state.project.project_id), settings=self.config)
        ready = [task for task in state.tasks if task.status == TaskStatus.pending and all(self._task_by_id(state, dep).status in (TaskStatus.completed, TaskStatus.skipped) for dep in task.depends_on)]
        if not ready:
            return {"state": state.model_dump(mode="json")}

        def invoke(task: Task) -> tuple[Task, AgentResult]:
            task.status = TaskStatus.running
            task.attempts += 1
            if on_event: on_event(f"{task.agent}:running")
            try:
                agent_type = AGENT_CLASSES.get(task.agent)
                if not agent_type:
                    return task, AgentResult(agent=task.agent, status=TaskStatus.failed, message="Agent implementation missing")
                return task, agent_type().run(task, state, context)
            except Exception as exc:
                return task, AgentResult(agent=task.agent, status=TaskStatus.failed, message=str(exc))

        with ThreadPoolExecutor(max_workers=min(2, len(ready))) as pool:
            results = list(pool.map(invoke, ready))
        for task, result in results:
            task.status = result.status
            task.error = result.message if result.status == TaskStatus.failed else None
            state.artifacts.extend(result.artifacts)
            for item in result.artifacts: self.store.save_artifact(item)
            lesson = learner.review(state, result)
            context.lessons.append(lesson)
            if result.status == TaskStatus.failed: state.errors.append(f"{task.agent}: {result.message}")
            self.store.save_task(task)
            if on_event: on_event(f"{task.agent}:{task.status.value}")
        self.store.save_state(state)
        return {"state": state.model_dump(mode="json")}

    def _graph_retry_gate(self, payload: dict[str, Any], on_event: Callable[[str], None] | None) -> dict[str, Any]:
        state = ProductionState.model_validate(payload["state"])
        for task in state.tasks:
            if task.status == TaskStatus.failed and task.attempts < task.max_attempts:
                task.status = TaskStatus.pending
                task.error = None
                if on_event: on_event(f"{task.agent}:retry_pending")
        return {"state": state.model_dump(mode="json")}

    def _graph_route(self, payload: dict[str, Any]) -> str:
        state = ProductionState.model_validate(payload["state"])
        if all(task.status in (TaskStatus.completed, TaskStatus.skipped) for task in state.tasks): return "complete"
        if any(task.status == TaskStatus.failed for task in state.tasks): return "retry"
        if any(task.status == TaskStatus.pending for task in state.tasks): return "continue"
        return "stop"

    def _graph_retry_route(self, payload: dict[str, Any]) -> str:
        state = ProductionState.model_validate(payload["state"])
        return "continue" if any(task.status == TaskStatus.pending for task in state.tasks) else "stop"

    def _fallback_loop(self, state: ProductionState, on_event: Callable[[str], None] | None) -> ProductionState:
        for _ in range(len(state.tasks) * 3):
            payload = self._graph_execute_ready({"state": state.model_dump(mode="json")}, on_event)
            state = ProductionState.model_validate(payload["state"])
            route = self._graph_route(payload)
            if route == "complete": return state
            if route == "retry":
                state = ProductionState.model_validate(self._graph_retry_gate({"state": state.model_dump(mode="json")}, on_event)["state"])
            elif route == "stop": return state
        state.errors.append("Dependency graph exceeded its execution limit")
        return state

    @staticmethod
    def _task_by_id(state: ProductionState, task_id: str) -> Task:
        return next(task for task in state.tasks if task.task_id == task_id)
