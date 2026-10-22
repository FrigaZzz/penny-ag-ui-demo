import { useState } from "react";
import {
  useAgent,
  useCopilotKit,
  UseAgentUpdate,
} from "@copilotkit/react-core/v2";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { ChatPanel } from "./chat/ChatPanel";
import { useAgentActivity } from "./hooks/useAgentActivity";
import { useBudget } from "./hooks/useBudget";
import type { AgentState, Budget } from "./lib/data";
import { views } from "./lib/nav";
import type { View } from "./lib/nav";
import { EventInspector, FeatureGuide } from "./shell/Dialogs";
import { Brand, Sidebar } from "./shell/Sidebar";
import { Topbar } from "./shell/Topbar";
import { GOAL_SLOT, usePennyTools } from "./tools/usePennyTools";
import { LivePlan } from "./views/LivePlan";
import { Overview } from "./views/Overview";
import { Playground } from "./views/Playground";
import { TransactionsView } from "./views/Transactions";

export default function App() {
  const { agent, isReady } = useAgent({
    agentId: "penny",
    updates: [
      UseAgentUpdate.OnMessagesChanged,
      UseAgentUpdate.OnRunStatusChanged,
      UseAgentUpdate.OnStateChanged,
    ],
    throttleMs: 40,
  });
  const { copilotkit } = useCopilotKit();
  const seed = useBudget();
  const state = agent.state as AgentState;
  const budget = state.budget || seed.budget;
  const draft = state.draft_document || "";

  const [view, setView] = useState<View>("overview");
  const [inspector, setInspector] = useState(false);
  const [guide, setGuide] = useState(false);
  const activity = useAgentActivity(agent, isReady, setView);
  const { interrupt, goalPending } = usePennyTools({
    budget,
    draft,
    setDashboard: activity.setDashboard,
    setHtml: activity.setHtml,
    setView,
  });
  const busy = agent.isRunning || Boolean(interrupt) || goalPending;

  function send(message: string) {
    if (!message.trim() || !isReady || busy) return false;
    activity.setError("");
    agent.addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    });
    copilotkit.runAgent({ agent }).catch((e: unknown) =>
      activity.setError(
        e instanceof Error
          ? e.message
          : "The agent could not complete this request. Try again.",
      ),
    );
    return true;
  }
  function newChat() {
    if (busy) return;
    agent.setMessages([]);
    agent.threadId = crypto.randomUUID();
    agent.setState({ budget });
    activity.reset();
    setView("overview");
  }
  function saveGoal(b: Budget) {
    seed.setBudget(b);
    agent.setState({ ...agent.state, budget: b });
  }

  if (!budget)
    return (
      <div className="loading-screen">
        <Brand />
        {seed.loadError ? (
          <>
            <p role="alert">{seed.loadError}</p>
            <button className="primary" onClick={() => void seed.reload()}>
              Retry connection
            </button>
          </>
        ) : (
          <p>
            <LoaderCircle className="spin" size={17} /> Opening your workspace…
          </p>
        )}
      </div>
    );

  const chunks = activity.events.filter(
    (e) => e.type === "TOOL_CALL_ARGS",
  ).length;
  const page = views[view];

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        setView={setView}
        planLive={activity.streaming === "show_plan"}
        onGuide={() => setGuide(true)}
        onInspector={() => setInspector(true)}
      />

      <div className="application">
        <Topbar view={view} setView={setView} onGuide={() => setGuide(true)} />
        <div className="split-layout">
          <main className="workspace" id="main-content">
            <div className="workspace-inner">
              <header className="page-heading" key={view}>
                <h1>{page.title}</h1>
                <p>{page.lede}</p>
              </header>
              <div
                id={GOAL_SLOT}
                className={goalPending ? "goal-slot visible" : "goal-slot"}
              />
              {goalPending && view !== "overview" && (
                <p className="inline-notice">
                  Your goal picker is open above. Choose a goal to continue.
                </p>
              )}
              {view === "overview" && (
                <Overview
                  budget={budget}
                  busy={busy}
                  onGoalSaved={saveGoal}
                  onAllTransactions={() => setView("transactions")}
                />
              )}
              {view === "transactions" && <TransactionsView budget={budget} />}
              {view === "plan" && (
                <LivePlan
                  budget={budget}
                  draft={draft}
                  live={activity.streaming === "show_plan"}
                  streaming={Boolean(activity.streaming)}
                  busy={busy}
                  send={send}
                />
              )}
              {view === "playground" && (
                <Playground
                  budget={budget}
                  dashboard={activity.dashboard}
                  html={activity.html}
                  streaming={activity.streaming}
                  busy={busy}
                  send={send}
                />
              )}
              <footer className="workspace-footer">
                <span>Penny is a local generative UI demo.</span>
                <button className="text-button" onClick={() => setGuide(true)}>
                  What can I try? <ArrowUpRight size={13} />
                </button>
              </footer>
            </div>
          </main>

          <ChatPanel
            agent={agent}
            isReady={isReady}
            health={seed.health}
            interrupt={interrupt}
            goalPending={goalPending}
            busy={busy}
            building={Boolean(activity.streaming)}
            error={activity.error}
            steps={activity.steps}
            chunks={chunks}
            send={send}
            onRetry={() => {
              activity.setError("");
              send(
                "Please try that last request again, recovering from the previous error.",
              );
            }}
            onNewChat={newChat}
            onGuide={() => setGuide(true)}
            onInspector={() => setInspector(true)}
          />
        </div>
      </div>

      <EventInspector
        open={inspector}
        onClose={() => setInspector(false)}
        events={activity.events}
        health={seed.health}
      />
      <FeatureGuide
        open={guide}
        onClose={() => setGuide(false)}
        busy={busy}
        send={send}
      />
    </div>
  );
}
