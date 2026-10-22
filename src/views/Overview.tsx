import { ArrowRight, Check, ChevronDown } from "lucide-react";
import type { Budget } from "../lib/data";
import { BudgetTable, IncomeLedger, TransactionTable } from "../widgets/Budget";
import { GoalEditor } from "../widgets/Decisions";

export function Overview({
  budget,
  busy,
  onGoalSaved,
  onAllTransactions,
}: {
  budget: Budget;
  busy: boolean;
  onGoalSaved: (b: Budget) => void;
  onAllTransactions: () => void;
}) {
  return (
    <>
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
