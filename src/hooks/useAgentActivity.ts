import { useEffect, useRef, useState } from "react";
import type { useAgent } from "@copilotkit/react-core/v2";
import { partialJSONParse } from "@copilotkit/shared";
import type { View } from "../lib/nav";

type Agent = ReturnType<typeof useAgent>["agent"];
export type Log = { id: number; time: string; type: string; data: string };
export type Step = { id: string; name: string; done: boolean; chunks: number };

const WIDGET_TOOLS = ["show_plan", "render_html", "render_dashboard"];

/**
 * Subscribes to the AG-UI event stream: keeps the protocol log, the tool
 * activity sequence, and the workspace widgets that render from streaming args.
 */
export function useAgentActivity(
  agent: Agent,
  isReady: boolean,
  setView: (view: View) => void,
) {
  const [events, setEvents] = useState<Log[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState("");
  const [html, setHtml] = useState("");
  const [streaming, setStreaming] = useState("");
  const sequence = useRef(0);

  useEffect(() => {
    if (!isReady) return;
    const sub = agent.subscribe({
      onEvent: ({ event }) => {
        // Encrypted model reasoning is intentionally excluded from the tool activity UI.
        if (event.type === "REASONING_ENCRYPTED_VALUE") return;
        setEvents((old) => [
          ...old.slice(-499),
          {
            id: ++sequence.current,
            time: new Date().toLocaleTimeString("en-US", { hour12: false }),
            type: event.type,
            data: JSON.stringify(event, null, 2),
          },
        ]);
      },
      onToolCallStartEvent: ({ event, state }) => {
        setSteps((old) => [
          ...old.slice(-19),
          {
            id: event.toolCallId,
            name: event.toolCallName,
            done: false,
            chunks: 0,
          },
        ]);
        if (event.toolCallName === "show_plan") {
          setView("plan");
          setStreaming("show_plan");
          return { state: { ...state, draft_document: "" } };
        }
        if (
          event.toolCallName === "render_dashboard" ||
          event.toolCallName === "render_html"
        ) {
          setView("playground");
          setStreaming(event.toolCallName);
          if (event.toolCallName === "render_html") setHtml("");
          else setDashboard("");
        }
      },
      onToolCallArgsEvent: ({ event, toolCallName, toolCallBuffer, state }) => {
        setSteps((old) =>
          old.map((s) =>
            s.id === event.toolCallId ? { ...s, chunks: s.chunks + 1 } : s,
          ),
        );
        // AG-UI 1.0.3 supplies the buffer BEFORE this delta. Reuse CopilotKit's parser.
        const args = partialJSONParse(toolCallBuffer + event.delta) as Record<
          string,
          unknown
        >;
        if (toolCallName === "show_plan" && typeof args.document === "string")
          return { state: { ...state, draft_document: args.document } };
        if (
          toolCallName === "render_dashboard" &&
          typeof args.document === "string"
        )
          setDashboard(args.document);
        if (toolCallName === "render_html" && typeof args.html === "string")
          setHtml(args.html);
      },
      onToolCallEndEvent: ({ toolCallName }) => {
        if (WIDGET_TOOLS.includes(toolCallName)) setStreaming("");
      },
      onToolCallResultEvent: ({ event }) => {
        setSteps((old) =>
          old.map((s) =>
            s.id === event.toolCallId ? { ...s, done: true } : s,
          ),
        );
      },
      onRunErrorEvent: ({ event }) => {
        setError(event.message);
        setStreaming("");
      },
      onRunFailed: ({ error: e }) => {
        setError(e.message);
        setStreaming("");
      },
      onRunFinalized: () => setStreaming(""),
    });
    return () => sub.unsubscribe();
  }, [agent, isReady, setView]);

  function reset() {
    setSteps([]);
    setEvents([]);
    setError("");
    setDashboard("");
    setHtml("");
  }

  return {
    events,
    steps,
    error,
    setError,
    dashboard,
    setDashboard,
    html,
    setHtml,
    streaming,
    reset,
  };
}
