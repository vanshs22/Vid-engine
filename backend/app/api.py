from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI

from .models import PageProfile, ProjectRequest
from .orchestrator import Director
from .registry import AgentRegistry
from .jobs import LocalJobQueue
from .workflow import ApprovalWorkflow


def create_app(root: Path = Path('.')) -> FastAPI:
    app = FastAPI(title='Universal Video Studio Agent API', version='0.1.0')
    director = Director(root)
    queue = LocalJobQueue(workers=2)
    workflow = ApprovalWorkflow(root)

    @app.post('/workflow/start')
    def workflow_start(request: ProjectRequest):
        return workflow.start(request.topic, request.duration_seconds, request.style)

    @app.get('/workflow/{workflow_id}')
    def workflow_state(workflow_id: str):
        return workflow.load(workflow_id)

    @app.post('/workflow/{workflow_id}/approve/{stage}')
    def workflow_approve(workflow_id: str, stage: str, feedback: str | None = None):
        return workflow.approve(workflow_id, stage, feedback)

    @app.post('/workflow/{workflow_id}/reject/{stage}')
    def workflow_reject(workflow_id: str, stage: str, feedback: str):
        return workflow.reject(workflow_id, stage, feedback)

    @app.get('/agents')
    def agents():
        return [item.__dict__ for item in AgentRegistry().list()]

    @app.post('/pages')
    def save_page(profile: PageProfile):
        director.store.save_page_profile(profile)
        return profile.model_dump(mode='json')

    @app.get('/pages')
    def list_pages():
        return director.store.list_page_profiles()

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
