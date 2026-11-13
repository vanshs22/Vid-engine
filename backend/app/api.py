from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI

from .models import ProjectRequest
from .orchestrator import Director
from .registry import AgentRegistry
from .jobs import LocalJobQueue


def create_app(root: Path = Path('.')) -> FastAPI:
    app = FastAPI(title='Universal Video Studio Agent API', version='0.1.0')
    director = Director(root)
    queue = LocalJobQueue(workers=2)

    @app.get('/agents')
    def agents():
        return [item.__dict__ for item in AgentRegistry().list()]

    @app.post('/jobs/run')
    def submit_job(request: ProjectRequest):
        queue.submit(request.project_id, lambda: director.run(request))
        return {"job_id": request.project_id, "status": "queued"}

    @app.get('/jobs/{job_id}')
    def job_status(job_id: str):
        return queue.status(job_id)
    @app.post('/projects/run')
    def run_project(request: ProjectRequest):
        state = director.run(request)
        return state.model_dump(mode='json')

    @app.get('/projects/{project_id}')
    def get_project(project_id: str):
        state = director.store.load_state(project_id)
        return state.model_dump(mode='json') if state else {'error': 'not_found'}

    return app
