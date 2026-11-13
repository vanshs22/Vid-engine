from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from .models import AgentResult, ProductionState
from .store import SQLiteStore


@dataclass
class LearningSupervisor:
    store: SQLiteStore

    def review(self, state: ProductionState, result: AgentResult) -> dict[str, Any]:
        lesson = {
            "project_id": state.project.project_id,
            "agent": result.agent,
            "status": result.status.value,
            "message": result.message,
            "metrics": result.metrics,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "approved": result.status.value == "completed",
        }
        if result.status.value == "failed":
            lesson["improvement"] = "Retry the task with the recorded error and preserve the failed artifact for review."
        else:
            lesson["improvement"] = "Keep the successful artifact contract and reuse it in future projects."
        self.store.save_lesson(state.project.project_id, lesson)
        return lesson

    def context(self, project_id: str) -> list[dict[str, Any]]:
        return self.store.load_lessons(project_id)
