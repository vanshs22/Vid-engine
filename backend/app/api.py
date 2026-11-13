from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI

from .models import ProjectRequest
from .orchestrator import Director
from .registry import AgentRegistry


def create_app(root: Path = Path('.')) -> FastAPI:
    app = FastAPI(title='Universal Video Studio Agent API', version='0.1.0')
    director = Director(root)

    @app.get('/agents')
    def agents():
        return [item.__dict__ for item in AgentRegistry().list()]

    @app.post('/projects/run')
    def run_project(request: ProjectRequest):
        state = director.run(request)
        return state.model_dump(mode='json')

    @app.get('/projects/{project_id}')
    def get_project(project_id: str):
        state = director.store.load_state(project_id)
        return state.model_dump(mode='json') if state else {'error': 'not_found'}

    return app
