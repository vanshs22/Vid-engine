from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from ..models import AgentResult, ProductionState, Task, TaskStatus
from ..store import SQLiteStore


@dataclass
class AgentContext:
    root: Path
    workspace: Path
    store: SQLiteStore


class Agent:
    name = "agent"

    def run(self, task: Task, state: ProductionState, context: AgentContext) -> AgentResult:
        raise NotImplementedError

    def complete(self, task: Task, message: str = "") -> AgentResult:
        return AgentResult(agent=self.name, status=TaskStatus.completed, message=message)
