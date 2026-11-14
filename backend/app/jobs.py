from __future__ import annotations

from concurrent.futures import Future, ThreadPoolExecutor
from dataclasses import dataclass
from typing import Callable


@dataclass
class Job:
    job_id: str
    future: Future


class LocalJobQueue:
    """Small SQLite-compatible process-local queue for VPS migration later."""

    def __init__(self, workers: int = 2):
        self.pool = ThreadPoolExecutor(max_workers=max(1, workers))
        self.jobs: dict[str, Job] = {}

    def submit(self, job_id: str, handler: Callable[[], object]) -> Job:
        future = self.pool.submit(handler)
        job = Job(job_id=job_id, future=future)
        self.jobs[job_id] = job
        return job

    def status(self, job_id: str) -> dict:
        job = self.jobs[job_id]
        if not job.future.done(): return {"job_id": job_id, "status": "running"}
        error = job.future.exception()
        return {"job_id": job_id, "status": "failed" if error else "completed", "error": str(error) if error else None}
