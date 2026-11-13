from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase

from backend.app.models import ProjectRequest
from backend.app.orchestrator import Director
from backend.app.registry import AgentRegistry


class AgentFoundationSmokeTest(TestCase):
    def test_registry_has_mvp_agents(self):
        names = {agent.name for agent in AgentRegistry().list()}
        self.assertIn("director", names)
        self.assertIn("quality", names)
        self.assertGreaterEqual(len(names), 10)

    def test_director_creates_checkpoint(self):
        with TemporaryDirectory() as directory:
            state = Director(Path(directory)).create_state(ProjectRequest(project_id="smoke"))
            self.assertEqual(state.stage, "planned")
            self.assertTrue((Path(directory) / ".cache/agent-state.sqlite3").exists())


if __name__ == "__main__":
    import unittest
    unittest.main()
