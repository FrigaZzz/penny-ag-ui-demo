import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { demos } from "../lib/data";
import type { Budget } from "../lib/data";
import { Plan } from "../widgets/Plan";
import { EmptyWorkspace } from "./EmptyWorkspace";

const APPLY =
  "Apply the current budget draft using apply_budget, and wait for my approval before saving.";

export function LivePlan({
  budget,
  draft,
  live,
  streaming,
  busy,
  send,
}: {
  budget: Budget;
  draft: string;
  live: boolean;
  streaming: boolean;
  busy: boolean;
  send: (message: string) => boolean;
}) {
  if (!draft)
    return (
      <EmptyWorkspace
        icon={Sparkles}
        title="A fresh start for your budget."
        text="Ask Penny for a savings plan. Each category will appear here while the agent is still writing it."
        action="Build my savings plan"
        onClick={() => send(demos[0].prompt)}
        disabled={busy}
      />
    );
  return (
    <>
      <Plan document={draft} budget={budget} live={live} />
      {!streaming && (
        <div className="draft-actions">
          <p>
            <ShieldCheck size={15} />
            Your existing budget stays in place until you approve.
          </p>
          <button
            className="primary"
            disabled={busy}
            onClick={() => send(APPLY)}
          >
            Review & save <ArrowRight size={16} />
          </button>
        </div>
      )}
    </>
  );
}
