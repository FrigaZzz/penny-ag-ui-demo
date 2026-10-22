import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useRenderToolCall } from "@copilotkit/react-core/v2";
import type { useAgent } from "@copilotkit/react-core/v2";
import type { ToolMessage } from "@ag-ui/client";
import { Plus, RotateCcw, Sparkles } from "lucide-react";
import type { Health } from "../hooks/useBudget";
import type { Step } from "../hooks/useAgentActivity";
import { ActivityPanel } from "./ActivityPanel";
import { ChatWelcome } from "./ChatWelcome";
import { Composer } from "./Composer";

type Agent = ReturnType<typeof useAgent>["agent"];

export function ChatPanel({
  agent,
  isReady,
  health,
  interrupt,
  goalPending,
  busy,
  building,
  error,
  steps,
  chunks,
  send,
  onRetry,
  onNewChat,
  onGuide,
  onInspector,
}: {
  agent: Agent;
  isReady: boolean;
  health?: Health;
  interrupt: ReactNode;
  goalPending: boolean;
  busy: boolean;
  building: boolean;
  error: string;
  steps: Step[];
  chunks: number;
  send: (message: string) => boolean;
  onRetry: () => void;
  onNewChat: () => void;
  onGuide: () => void;
  onInspector: () => void;
}) {
  const renderToolCall = useRenderToolCall();
  const scroller = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const messages = agent.messages.filter(
    (m) => m.role === "user" || m.role === "assistant",
  );

  useEffect(() => {
    if (follow.current && agent.messages.length)
      bottom.current?.scrollIntoView({ behavior: "instant", block: "end" });
  }, [agent.messages, agent.isRunning, steps, Boolean(interrupt)]);

  const followSend = (message: string) => {
    follow.current = true;
    return send(message);
  };

  return (
    <aside className="chat-panel" aria-label="Penny AI assistant">
      <div className="chat-header">
        <div className="assistant-mark">
          <Sparkles size={18} />
        </div>
        <div>
          <h2>A little help from Penny</h2>
          <p>
            <span className={health ? "online-dot" : "offline-dot"} />
            {health ? `${health.backend} · Google ADK` : "Connecting to agent…"}
          </p>
        </div>
        <button
          className="icon-button"
          onClick={onNewChat}
          disabled={busy}
          aria-label="New conversation"
          title="New conversation"
        >
          <Plus size={18} />
        </button>
      </div>
      <div
        className="chat-messages"
        ref={scroller}
        onScroll={() => {
          const el = scroller.current;
          if (el)
            follow.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 100;
        }}
      >
        {!messages.length && (
          <ChatWelcome
            disabled={busy || !isReady}
            send={followSend}
            onGuide={onGuide}
          />
        )}
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            {message.role === "assistant" && (
              <span className="message-author">
                <Sparkles size={12} />
                Penny
              </span>
            )}
            {typeof message.content === "string" && message.content && (
              <p>{message.content}</p>
            )}
            {"toolCalls" in message &&
              message.toolCalls?.map((call) => (
                <div className="tool-container" key={call.id}>
                  {renderToolCall({
                    toolCall: call,
                    toolMessage: agent.messages.find(
                      (m) => m.role === "tool" && m.toolCallId === call.id,
                    ) as ToolMessage | undefined,
                  })}
                </div>
              ))}
          </div>
        ))}
        {interrupt}
        {agent.isRunning && !goalPending && !interrupt && (
          <div className="agent-working" role="status">
            <span className="working-dots">
              <i />
              <i />
              <i />
            </span>
            {building ? "Building your interface…" : "Penny is working…"}
          </div>
        )}
        {error && (
          <div className="error-message" role="alert">
            <strong>The agent couldn’t finish this request.</strong>
            <p>{error}</p>
            <button className="text-button" disabled={busy} onClick={onRetry}>
              <RotateCcw size={14} />
              Try again
            </button>
          </div>
        )}
        <div ref={bottom} />
      </div>
      <ActivityPanel
        steps={steps}
        chunks={chunks}
        running={agent.isRunning}
        onInspector={onInspector}
      />
      <Composer
        send={followSend}
        disabled={busy || !isReady}
        placeholder={
          interrupt
            ? "Review the approval above to continue"
            : goalPending
              ? "Choose a goal in your workspace to continue"
              : "Ask about your money…"
        }
        showChips={messages.length > 0 && !busy}
        onInspector={onInspector}
      />
    </aside>
  );
}
