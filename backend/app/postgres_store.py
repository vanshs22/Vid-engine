from __future__ import annotations

import json
import os
from typing import Any


class PostgresStore:
    """Optional PostgreSQL backend. SQLite remains the zero-setup default."""

    def __init__(self, url: str | None = None):
        self.url = url or os.environ.get('DATABASE_URL')
        if not self.url:
            raise RuntimeError('DATABASE_URL is required for PostgreSQL storage')
        try:
            import psycopg
        except ImportError as exc:
            raise RuntimeError('Install psycopg[binary] to use PostgreSQL storage') from exc
        self.psycopg = psycopg
        self._init()

    def _connect(self):
        return self.psycopg.connect(self.url)

    def _init(self):
        with self._connect() as db:
            db.execute('CREATE TABLE IF NOT EXISTS uvs_states (project_id TEXT PRIMARY KEY, payload JSONB NOT NULL)')
            db.execute('CREATE TABLE IF NOT EXISTS uvs_tasks (task_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, payload JSONB NOT NULL)')
            db.execute('CREATE TABLE IF NOT EXISTS uvs_artifacts (artifact_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, payload JSONB NOT NULL)')
            db.execute('CREATE TABLE IF NOT EXISTS uvs_lessons (id BIGSERIAL PRIMARY KEY, project_id TEXT NOT NULL, payload JSONB NOT NULL)')

    def save_state(self, state):
        with self._connect() as db:
            db.execute('INSERT INTO uvs_states(project_id,payload) VALUES(%s,%s) ON CONFLICT(project_id) DO UPDATE SET payload=EXCLUDED.payload', (state.project.project_id, json.dumps(state.model_dump(mode='json'))))

    def load_state(self, project_id: str):
        from .models import ProductionState
        with self._connect() as db:
            row = db.execute('SELECT payload FROM uvs_states WHERE project_id=%s', (project_id,)).fetchone()
        return ProductionState.model_validate(row[0]) if row else None

    def save_task(self, task):
        with self._connect() as db:
            db.execute('INSERT INTO uvs_tasks(task_id,project_id,payload) VALUES(%s,%s,%s) ON CONFLICT(task_id) DO UPDATE SET payload=EXCLUDED.payload', (task.task_id, task.project_id, json.dumps(task.model_dump(mode='json'))))

    def save_artifact(self, artifact):
        with self._connect() as db:
            db.execute('INSERT INTO uvs_artifacts(artifact_id,project_id,payload) VALUES(%s,%s,%s) ON CONFLICT(artifact_id) DO UPDATE SET payload=EXCLUDED.payload', (artifact.artifact_id, artifact.project_id, json.dumps(artifact.model_dump(mode='json'))))

    def save_lesson(self, project_id: str, lesson: dict[str, Any]):
        with self._connect() as db:
            db.execute('INSERT INTO uvs_lessons(project_id,payload) VALUES(%s,%s)', (project_id, json.dumps(lesson)))

    def load_lessons(self, project_id: str) -> list[dict]:
        with self._connect() as db:
            rows = db.execute('SELECT payload FROM uvs_lessons WHERE project_id=%s ORDER BY id', (project_id,)).fetchall()
        return [row[0] for row in rows]
