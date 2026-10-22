import json
import os
import runpy
import unittest
from unittest.mock import AsyncMock, patch

from ag_ui_adk.event_translator import EventTranslator
from google.adk.events import Event
from google.adk.models.llm_request import LlmRequest
from google.genai import types
from openai.types.chat import ChatCompletionChunk


class StreamingTest(unittest.IsolatedAsyncioTestCase):
    async def test_openai_arguments_stream_before_completion_and_close_once(self):
        document = '{"type":"heading","title":"Café"}\n{"type":"allocation","reason":"A \\"quote\\""}'
        arguments = json.dumps({"document": document}, ensure_ascii=False)
        fragments = [arguments[:24], arguments[24:45], arguments[45:]]
        events = []

        async def chunks():
            for index, fragment in enumerate(fragments):
                yield ChatCompletionChunk(
                    id="completion", created=0, model="test", object="chat.completion.chunk",
                    choices=[{"index": 0, "delta": {"tool_calls": [{
                        "index": 0, "id": "call_plan" if index == 0 else None,
                        "type": "function", "function": {
                            "name": "show_plan" if index == 0 else None, "arguments": fragment,
                        },
                    }]}}],
                )
                # The SDK is suspended here: args must already have reached AG-UI.
                self.assertTrue(any(e.type == "TOOL_CALL_ARGS" for e in events))
            yield ChatCompletionChunk(
                id="completion", created=0, model="test", object="chat.completion.chunk",
                choices=[{"index": 0, "delta": {}, "finish_reason": "tool_calls"}],
            )

        with (
            patch.dict(os.environ, {"ADK_MODEL": "test", "OPENAI_API_KEY": "test-key"}, clear=True),
            patch("dotenv.load_dotenv"),
        ):
            server = runpy.run_module("server.main")
            client = server["client"]
            try:
                with patch.object(client.chat.completions, "create", new=AsyncMock(return_value=chunks())):
                    translator = EventTranslator(streaming_function_call_arguments=True)
                    async for response in server["model"].generate_content_async(LlmRequest(), stream=True):
                        event = Event(author="penny", **response.model_dump(exclude_none=True))
                        events.extend([e async for e in translator.translate(event, "thread", "run")])
                    result = Event(author="penny", content=types.Content(parts=[types.Part(function_response=types.FunctionResponse(
                        name="show_plan", response={"status": "draft_ready"}, id="call_plan",
                    ))]))
                    events.extend([e async for e in translator.translate(result, "thread", "run")])
            finally:
                await client.close()

        starts = [e for e in events if e.type == "TOOL_CALL_START"]
        ends = [e for e in events if e.type == "TOOL_CALL_END"]
        deltas = [e for e in events if e.type == "TOOL_CALL_ARGS"]
        results = [e for e in events if e.type == "TOOL_CALL_RESULT"]
        self.assertEqual(len(starts), 1)
        self.assertEqual(len(ends), 1)
        self.assertEqual(len(results), 1)
        self.assertGreater(len(deltas), 1)
        self.assertEqual(json.loads("".join(e.delta for e in deltas)), {"document": document})
        self.assertEqual({e.tool_call_id for e in starts + ends + deltas + results}, {starts[0].tool_call_id})
        self.assertTrue(server["bridge"]._streaming_function_call_arguments)


if __name__ == "__main__":
    unittest.main()
