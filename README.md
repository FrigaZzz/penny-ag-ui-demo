# Penny

A complete local budgeting demo with **Google ADK Python**, **AG-UI**, and **CopilotKit v2 React hooks**. Financial data and web search are mocked; model calls are real. Supports Gemini and tool-capable OpenAI-compatible models, including DeepSeek, using the OpenAI Python SDK directly.

## Run

For a fresh checkout, install Python 3.11–3.13, uv, and Node.js 24 or newer, then run:

```sh
uv sync
npm ci
```

By default, `ag-ui-adk` installs from PyPI. The optional local checkout override in `pyproject.toml` is commented out; the AG-UI repository is not bundled here.

**To reproduce the recorded DeepSeek argument streaming:** use an AG-UI checkout containing [the non-Gemini streaming fix](https://github.com/ag-ui-protocol/ag-ui/pull/3148), place it at `ag-ui/`, uncomment the `[tool.uv.sources]` table and its `ag-ui-adk` entry, and rerun `uv sync`. That fix is not yet merged upstream. The pinned PyPI release does not include it; the streaming regression test requires it.

Configure `.env` from `.env.example` with your provider key, then start both apps:

```sh
./run.sh
```

Ctrl+C stops both apps and their workers. Alternatively, start them in two terminals:

```sh
npm run dev:server
```

```sh
npm run dev
```

Open **http://127.0.0.1:5173**. Start with **Build a savings plan**, then **Review & save**. The feature guide contains a runnable prompt for each of the nine capabilities.

For a single-server build:

```sh
npm run build
uv run uvicorn server.main:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000. Restart the Python server after building if it was already running: the static mount is registered at startup.

## Credentials and model selection

The server loads the root `.env`; exported variables take precedence. Credentials stay on the Python server.

For DeepSeek through Nebius, configure:

```dotenv
ADK_MODEL=deepseek-ai/DeepSeek-V4.1-Flash
OPENAI_BASE_URL=https://api.tokenfactory.us-north1.nebius.com/v1
OPENAI_API_KEY=your-nebius-api-key
```

Use the endpoint's model ID directly, without an `openai/` prefix. ADK's `OpenAILlm` uses an explicit `AsyncOpenAI` client configured by `OPENAI_BASE_URL` and `OPENAI_API_KEY`. No Google credentials or client are required for this path. With the middleware fix described above, backend tool arguments stream incrementally, including the budget draft. Text, tools, shared state, and approval interrupts use the same ADK/AG-UI flow. In ag-ui-adk 0.11, frontend tools (`render_html`, `render_dashboard`, and `ask_goal`) are buffered until complete by its long-running-tool path.

Native Gemini function-argument streaming requires Vertex AI and a supported Gemini 3+ model. Penny creates an explicit Vertex client using `GOOGLE_CLOUD_PROJECT` and the `global` location, without changing your `.env` or its `GOOGLE_GENAI_USE_VERTEXAI` setting.

Optional server variables:

| Variable | Default | Purpose |
|---|---|---|
| `ADK_MODEL` | `gemini-3-flash-preview` | Native Gemini model or OpenAI-compatible endpoint's model ID |
| `OPENAI_BASE_URL` | OpenAI default | Custom OpenAI-compatible API endpoint |
| `OPENAI_API_KEY` | None | Key for the selected OpenAI-compatible API |
| `PENNY_VERTEXAI` | `true` | Use Vertex AI for native incremental arguments |
| `PENNY_LOCATION` | `global` | Vertex location |
| `PENNY_DB` | `data/penny.sqlite` | Local SQLite budget store |
| `PENNY_API_URL` | `http://127.0.0.1:8000` | Vite proxy target, useful for tests |

If using this on another machine, supply Google ADC and a project with Vertex AI enabled. `PENNY_VERTEXAI=false` uses your Gemini Developer API key, but tool arguments then arrive as complete calls. The inspector labels that mode honestly; Penny does not simulate streaming with timers or chunk a completed model response.

## All nine showcase capabilities

| Capability | Where to try it | Implementation |
|---|---|---|
| Tool-based generative UI | Build a savings plan | `show_plan(document)` → live allocation rows in React |
| Generative UI interrupt | Review & save a plan | Native ADK `request_confirmation`, AG-UI interrupt outcome, `useInterrupt` resume/cancel |
| Open generative UI | Make me a calculator | Real LLM-written HTML/CSS/JS rendered in an isolated iframe |
| Default/catchall tool rendering | Explore my transactions | Wildcard `useRenderTool({name: '*'})` with expandable arguments/results |
| Agentic generative UI | Build my dashboard | Agent selects and orders spending, savings, transactions, and insight widgets |
| Reasoning-chain tool rendering | Show your work | Observable read/search/plan sequence with completion and actual argument-chunk counts |
| In-app human in the loop | Choose a savings goal | `useHumanInTheLoop` renders a goal picker in the main workspace; selection resumes ADK |
| Shared state read/write | Edit the goal, then Use my edited goal | UI persists the goal and updates `agent.state`; server publishes authoritative state deltas/snapshots |
| Shared state streaming | Stream a live draft | Incoming `TOOL_CALL_ARGS` update `draft_document` via subscriber state mutations, rendering the same draft in chat and workspace |

“Reasoning-chain” shows tool execution, not private model chain-of-thought. Mock web results are clearly marked and use `example.com`; the tool makes no web requests.

## How the stream becomes UI

```text
React + CopilotKit hooks
        ⇅ AG-UI / SSE
FastAPI → ag-ui-adk → ADK LlmAgent → Gemini or OpenAI SDK
                         ⇅ tools
                       SQLite
```

`stream_function_call_arguments=True` enables native Gemini partial arguments. OpenAI-compatible streams already supply argument deltas. Both paths enable the middleware's `streaming_function_call_arguments` option. The middleware fix described above preserves first-chunk arguments and closes the stream when ADK sends the aggregated call. Penny uses ADK's `OpenAILlm` directly, without an application streaming patch.

The current ADK middleware translator reliably handles a **single string argument** per tool, so tools intentionally use that shape. Rich data uses NDJSON inside `document`: a heading object followed by one complete object per allocation or widget. Complete rows render as the argument grows; an unfinished last line waits for more bytes.

AG-UI client 1.0.3 supplies `toolCallBuffer` before the current delta and its `partialToolCallArgs` callback value is not consistently an object. Penny combines the buffer and current delta, uses CopilotKit's existing `partialJSONParse`, and returns a subscriber **state mutation**. It does not mutate the event inputs or replace SDK state while the reducer is applying the event.

Open **AG-UI event inspector** to inspect and export actual events, including `TOOL_CALL_START`, multiple `TOOL_CALL_ARGS`, `TOOL_CALL_END`, `STATE_DELTA`, `STATE_SNAPSHOT`, and native interrupt outcomes. Encrypted reasoning values are excluded. The inspector retains the latest 500 events.

## Store and approvals

SQLite is seeded with October 2026 income, eight budget categories, and 19 merchant transactions. Amounts are integer cents. Goal edits persist immediately; generated budget plans remain drafts until approved. Approval validates all eight unique categories, nonnegative integer amounts, enough room for the savings goal, and a matching revision. Budget writes and approval history are committed atomically. Rejecting an interrupt makes no budget write.

Budget and goal edits survive server restarts. Conversations and pending agent interrupts live in memory and reset on restart. This is a single-user localhost demo; the development commands bind to loopback.

Generated HTML runs with `sandbox="allow-scripts"` and no same-origin permission. Its CSP blocks connections, external resources, and form submissions. Only inline styling/scripts and data images are allowed. No host API or credentials are passed to it.

## Verify

```sh
npm test
npm run test:server
npm run build
npm run test:e2e
```

The end-to-end test starts isolated servers on 5174/8001, uses a separate temporary SQLite store, and makes real requests with the model selected in `.env` or exported `ADK_MODEL`. It verifies shared goal edits, native rejection/approval, in-app goal selection, agent-composed widgets, a working generated calculator, and protocol events. Incremental argument rendering is checked only when the backend reports native argument streaming. The selected provider's credentials are required. Server unit tests exercise Gemini and OpenAI client startup/shutdown without credentials. Install the Playwright browser with `npx playwright install chromium` if necessary.

Pinned current releases: Google ADK **2.12.0**, ag-ui-adk **0.11.0**, AG-UI client **1.0.3**, CopilotKit **1.79.1**, React **19.3.1**, Vite **8.3.5**. Python and npm lockfiles make installs reproducible. CopilotKit pins an older AG-UI patch internally; npm overrides align its AG-UI packages to 1.0.3 to avoid duplicate incompatible `AbstractAgent` types.

`npm audit` reports seven low-severity transitive findings around KaTeX through CopilotKit's markdown stack. This app renders chat as text and does not invoke KaTeX or Mermaid. No forced dependency downgrade was applied; recheck when upgrading CopilotKit.

## Source references

- [AG-UI Dojo v2 examples](https://github.com/ag-ui-protocol/ag-ui/tree/main/apps/dojo/src/app/%5BintegrationId%5D/feature/%28v2%29)
- [Google ADK middleware](https://github.com/ag-ui-protocol/ag-ui/tree/main/integrations/adk-middleware/python)
- [Native Gemini function-argument streaming](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/tools/function-calling)
- [CopilotKit source and current docs](https://github.com/CopilotKit/CopilotKit)
