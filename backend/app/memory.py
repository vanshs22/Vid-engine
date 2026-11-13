from __future__ import annotations

import sqlite3
from pathlib import Path


class MemoryStore:
    """SQLite memory now; PostgreSQL/pgvector can implement the same interface later."""

    def __init__(self, path: Path = Path('.cache/memory.sqlite3')):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(path) as db:
            db.execute('CREATE TABLE IF NOT EXISTS memories (id INTEGER PRIMARY KEY, scope TEXT, text TEXT, metadata TEXT)')

    def remember(self, scope: str, text: str, metadata: str = '{}') -> None:
        with sqlite3.connect(self.path) as db:
            db.execute('INSERT INTO memories(scope,text,metadata) VALUES(?,?,?)', (scope, text, metadata))

    def search(self, scope: str, query: str, limit: int = 10) -> list[dict]:
        with sqlite3.connect(self.path) as db:
            rows = db.execute('SELECT text,metadata FROM memories WHERE scope=? AND text LIKE ? LIMIT ?', (scope, f'%{query}%', limit)).fetchall()
        return [{"text": row[0], "metadata": row[1]} for row in rows]
