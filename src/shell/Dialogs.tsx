import { ArrowDown, ArrowUpRight } from "lucide-react";
import { demos } from "../lib/data";
import { demoIcons } from "../lib/nav";
import type { Health } from "../hooks/useBudget";
import type { Log } from "../hooks/useAgentActivity";
import { Modal } from "./Modal";

function exportEvents(events: Log[]) {
  const url = URL.createObjectURL(
    new Blob(
      [JSON.stringify(events.map((e) => JSON.parse(e.data)), null, 2)],
      { type: "application/json" },
    ),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "penny-ag-ui-events.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function EventInspector({
  open,
  onClose,
  events,
  health,
}: {
  open: boolean;
  onClose: () => void;
  events: Log[];
  health?: Health;
}) {
  const chunks = events.filter((e) => e.type === "TOOL_CALL_ARGS").length;
  return (
    <Modal
      open={open}
      onClose={onClose}
      className="event-dialog"
      title="The live event stream"
      subtitle={`Actual AG-UI events from this conversation · ${chunks} tool-argument chunks`}
      closeLabel="Close event inspector"
    >
      <div className="stream-info">
        <span
          className={
            health?.native_argument_streaming ? "native-flag" : "mock-label"
          }
        >
          {health?.native_argument_streaming
            ? "Native function-argument streaming"
            : "Arguments arrive as complete tool calls"}
        </span>
        <code>{health?.model}</code>
        <button
          className="text-button"
          disabled={!events.length}
          onClick={() => exportEvents(events)}
        >
          Export JSON <ArrowDown size={13} />
        </button>
      </div>
      <div className="event-list">
        {events.length ? (
          events.map((event) => (
            <details key={event.id}>
              <summary>
                <time>{event.time}</time>
                <code
                  className={event.type === "TOOL_CALL_ARGS" ? "arg-event" : ""}
                >
                  {event.type}
                </code>
                <span>#{event.id}</span>
              </summary>
              <pre>{event.data}</pre>
            </details>
          ))
        ) : (
          <p className="empty-events">
            Start a conversation to see the protocol in action.
          </p>
        )}
      </div>
    </Modal>
  );
}

export function FeatureGuide({
  open,
  onClose,
  busy,
  send,
}: {
  open: boolean;
  onClose: () => void;
  busy: boolean;
  send: (prompt: string) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      className="feature-guide"
      label="Demo capabilities"
      title="Nine ways to see it work."
      subtitle="Real model calls. Mock financial data. Try a capability."
      closeLabel="Close feature guide"
    >
      <div className="feature-list">
        {demos.map((demo, i) => {
          const Icon = demoIcons[i];
          return (
            <button
              key={demo.id}
              disabled={busy}
              onClick={() => {
                onClose();
                send(demo.prompt);
              }}
            >
              <span className="feature-icon">
                <Icon size={18} />
              </span>
              <span>
                <strong>{demo.title}</strong>
                <small>{demo.feature}</small>
              </span>
              <ArrowUpRight size={16} />
            </button>
          );
        })}
      </div>
      <p className="guide-note">
        For shared state, first edit the savings goal in Overview, then choose
        “Use my edited goal.” Saving a draft always pauses for your approval.
      </p>
    </Modal>
  );
}
