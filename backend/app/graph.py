from __future__ import annotations

from collections import defaultdict, deque
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from typing import Callable, Iterable, TypeVar

from .models import Task, TaskStatus

T = TypeVar('T')


@dataclass
class DependencyGraph:
    tasks: list[Task]

    def validate(self) -> None:
        known = {task.task_id for task in self.tasks}
        for task in self.tasks:
            missing = set(task.depends_on) - known
            if missing:
                raise ValueError(f"Task {task.task_id} has missing dependencies: {sorted(missing)}")

    def ready(self, completed: set[str]) -> list[Task]:
        return [task for task in self.tasks if task.status == TaskStatus.pending and set(task.depends_on).issubset(completed)]


class ParallelExecutor:
    def __init__(self, workers: int = 2):
        self.workers = max(1, workers)

    def run(self, items: Iterable[T], handler: Callable[[T], T]) -> list[T]:
        items = list(items)
        if len(items) <= 1 or self.workers == 1:
            return [handler(item) for item in items]
        with ThreadPoolExecutor(max_workers=min(self.workers, len(items))) as pool:
            return list(pool.map(handler, items))
