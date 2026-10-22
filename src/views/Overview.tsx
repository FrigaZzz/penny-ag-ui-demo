import { useEffect, useRef } from "react";
import { ArrowRight, Check, ChevronDown, LayoutDashboard, Sparkles } from "lucide-react";
import { demos } from "../lib/data";
import type { Budget } from "../lib/data";
import { BudgetTable, IncomeLedger, TransactionTable } from "../widgets/Budget";
import { GoalEditor } from "../widgets/Decisions";
import { Dashboard, HtmlWidget } from "../widgets/Generated";
import { LivePlan } from "./LivePlan";

export function Overview({
  budget,
  busy,
  draft,
  dashboard,
  html,
  streaming,
  activeWidget,
  send,
  onGoalSaved,
  onAllTransactions,
}: {
  budget: Budget;
  busy: boolean;
  draft: string;
  dashboard: string;
  html: string;
  streaming: string;
  activeWidget: string;
  send: (message: string) => boolean;
  onGoalSaved: (b: Budget) => void;
  onAllTransactions: () => void;
}) {
  const outputRef = useRef<HTMLDivElement>(null);

  // Smoothly scroll the studio output into view when an agent widget begins compiling
  useEffect(() => {
    if (activeWidget && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeWidget, streaming]);

  return (
    <>
      <section className="home-studio" aria-labelledby="studio-title">
        <div className="home-studio-header">
          <div><h2 id="studio-title">Your workspace, in motion.</h2><p>Ask Penny to build with your budget. Watch the details arrive as they’re generated.</p></div>
          <span className={`studio-status ${streaming ? "is-live" : ""}`}><i />{streaming ? "Building live" : "Ready to create"}</span>
        </div>
        <div className="studio-actions">
          <button className="studio-action" disabled={busy} onClick={() => send(demos[0].prompt)}><Sparkles size={17} /><span><strong>Create a plan</strong><small>See each category take shape</small></span><ArrowRight size={16} /></button>
          <button className="studio-action" disabled={busy} onClick={() => send(demos[4].prompt)}><LayoutDashboard size={17} /><span><strong>Compose my dashboard</strong><small>Widgets chosen for your data</small></span><ArrowRight size={16} /></button>
        </div>
        {activeWidget && <div className="studio-output" ref={outputRef}>
          {activeWidget === "show_plan" && <LivePlan budget={budget} draft={draft} live={streaming === "show_plan"} streaming={Boolean(streaming)} busy={busy} send={send} />}
          {activeWidget === "render_dashboard" && <Dashboard document={dashboard} budget={budget} live={streaming === "render_dashboard"} />}
          {activeWidget === "render_html" && <HtmlWidget html={html} live={streaming === "render_html"} />}
        </div>}
      </section>
      <div className="section-heading">
        <h2>October at a glance</h2>
        <span className="period">
          October 2026 <ChevronDown size={13} />
        </span>
      </div>
      <IncomeLedger budget={budget} />

      <section className="panel">
        <div className="section-heading">
          <h2>Your spending plan</h2>
          <span className="saved-indicator">
            <Check size={13} />
            {budget.approvals
              ? `Saved · revision ${budget.revision}`
              : "Current budget"}
          </span>
        </div>
        <BudgetTable budget={budget} />
      </section>

      <section className="goal-section">
        <div>
          <h2>A little intention goes a long way.</h2>
          <p>
            Set your monthly savings goal. Penny can build a plan around it.
          </p>
        </div>
        <GoalEditor budget={budget} onSave={onGoalSaved} disabled={busy} />
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Recent transactions</h2>
          <button className="text-button" onClick={onAllTransactions}>
            View all <ArrowRight size={13} />
          </button>
        </div>
        <TransactionTable budget={budget} limit={5} />
      </section>
    </>
  );
}
