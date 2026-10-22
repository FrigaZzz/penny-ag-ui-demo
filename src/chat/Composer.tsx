import { useState } from "react";
import { ArrowUp, Code2 } from "lucide-react";
import { demos } from "../lib/data";

const byId = (id: string) => demos.find((d) => d.id === id)!.prompt;

export function Composer({
  send,
  disabled,
  placeholder,
  showChips,
  onInspector,
}: {
  send: (message: string) => boolean;
  disabled: boolean;
  placeholder: string;
  showChips: boolean;
  onInspector: () => void;
}) {
  const [input, setInput] = useState("");
  function submit() {
    if (send(input)) setInput("");
  }
  return (
    <div className="chat-bottom">
      {showChips && (
        <div className="follow-up-chips">
          <button onClick={() => send(byId("dashboard"))}>
            Build a dashboard
          </button>
          <button onClick={() => send(byId("goal"))}>
            Change my goal
          </button>
        </div>
      )}
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <textarea
          aria-label="Message Penny"
          placeholder={placeholder}
          value={input}
          disabled={disabled}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
        />
        <div>
          <span>Enter to send · Shift+Enter for a new line</span>
          <button
            type="submit"
            aria-label="Send message"
            disabled={disabled || !input.trim()}
          >
            <ArrowUp size={17} />
          </button>
        </div>
      </form>
      <div className="chat-disclaimer">
        <span className="protocol-logo">AG-UI</span>
        <span aria-hidden="true">×</span>
        <span>Google ADK</span>
        <button onClick={onInspector} aria-label="Open event inspector">
          <Code2 size={14} />
        </button>
      </div>
    </div>
  );
}
