import os
import runpy
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient
from google import genai
from google.adk.integrations.openai import OpenAILlm
from google.adk.models.google_llm import Gemini
from openai import AsyncOpenAI

from server import store


class ModelTest(unittest.TestCase):
    def test_provider_selection_health_and_shutdown_without_credentials(self):
        for model, vertex, backend, google_client in [
            ("deepseek-ai/DeepSeek-V4.1-Flash", "true", "OpenAI-compatible API", False),
            ("gpt-4o-mini", "true", "OpenAI-compatible API", False),
            ("gemini-3-flash-preview", "true", "Vertex AI", True),
            ("gemini-3-flash-preview", "false", "Gemini Developer API", True),
        ]:
            with self.subTest(model=model, vertex=vertex), tempfile.TemporaryDirectory() as folder:
                client = MagicMock(spec=genai.Client)
                client.aio.aclose = AsyncMock()
                openai_client = MagicMock(spec=AsyncOpenAI)
                openai_client.close = AsyncMock()
                with (
                    patch.dict(os.environ, {
                        "ADK_MODEL": model, "PENNY_VERTEXAI": vertex,
                        "OPENAI_API_KEY": "test-key", "OPENAI_BASE_URL": "https://compatible.example/v1",
                    }, clear=True),
                    patch("dotenv.load_dotenv"),
                    patch("google.genai.Client", return_value=client) as constructor,
                    patch("openai.AsyncOpenAI", return_value=openai_client) as openai_constructor,
                    patch.object(store, "DB", Path(folder) / "test.sqlite"),
                ):
                    server = runpy.run_module("server.main")
                    native = google_client and vertex == "true"
                    streaming = native or not google_client
                    self.assertEqual(constructor.call_count, int(google_client))
                    self.assertEqual(isinstance(server["root_agent"].model, Gemini), google_client)
                    if google_client:
                        openai_constructor.assert_not_called()
                    else:
                        self.assertIs(type(server["root_agent"].model), OpenAILlm)
                        self.assertIs(server["root_agent"].model.client, openai_client)
                    self.assertEqual(server["root_agent"].model.model, model)
                    config = server["root_agent"].generate_content_config
                    self.assertEqual(config.thinking_config is not None, google_client)
                    self.assertEqual(config.tool_config is not None, native)
                    with TestClient(server["app"]) as http:
                        self.assertEqual(http.get("/api/health").json(), {
                            "status": "ok", "model": model,
                            "native_argument_streaming": streaming, "backend": backend,
                        })
                        self.assertEqual(http.get("/api/budget").json()["approvals"], 0)
                    self.assertEqual(client.aio.aclose.await_count, int(google_client))
                    self.assertEqual(openai_client.close.await_count, int(not google_client))


if __name__ == "__main__":
    unittest.main()
