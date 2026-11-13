from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from .models import Artifact, ProductionState, Task


class SQLiteStore:
    def __init__(self, path: Path = Path(".cache/agent-state.sqlite3")):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.path) as connection:
            connection.executescript("""
            CREATE TABLE IF NOT EXISTS states (project_id TEXT PRIMARY KEY, payload TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS tasks (task_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, payload TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS artifacts (artifact_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, payload TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS lessons (lesson_id INTEGER PRIMARY KEY AUTOINCREMENT, project_id TEXT NOT NULL, payload TEXT NOT NULL);
            """)

    def save_state(self, state: ProductionState) -> None:
        with sqlite3.connect(self.path) as connection:
            connection.execute("INSERT OR REPLACE INTO states(project_id,payload) VALUES(?,?)", (state.project.project_id, state.model_dump_json()))

    def load_state(self, project_id: str) -> ProductionState | None:
        with sqlite3.connect(self.path) as connection:
            row = connection.execute("SELECT payload FROM states WHERE project_id=?", (project_id,)).fetchone()
        return ProductionState.model_validate_json(row[0]) if row else None

    def save_task(self, task: Task) -> None:
        with sqlite3.connect(self.path) as connection:
            connection.execute("INSERT OR REPLACE INTO tasks(task_id,project_id,payload) VALUES(?,?,?)", (task.task_id, task.project_id, task.model_dump_json()))

    def save_artifact(self, artifact: Artifact) -> None:
        with sqlite3.connect(self.path) as connection:
            connection.execute("INSERT OR REPLACE INTO artifacts(artifact_id,project_id,payload) VALUES(?,?,?)", (artifact.artifact_id, artifact.project_id, artifact.model_dump_json()))

    def load_lessons(self, project_id: str) -> list[dict]:
        with sqlite3.connect(self.path) as connection:
            rows = connection.execute("SELECT payload FROM lessons WHERE project_id=? ORDER BY lesson_id", (project_id,)).fetchall()
        return [json.loads(row[0]) for row in rows]

    def save_lesson(self, project_id: str, lesson: dict) -> None:
        with sqlite3.connect(self.path) as connection:
            connection.execute("INSERT INTO lessons(project_id,payload) VALUES(?,?)", (project_id, json.dumps(lesson)))
