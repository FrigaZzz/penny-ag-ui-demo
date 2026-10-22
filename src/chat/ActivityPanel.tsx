import { ArrowUpRight, Check, ChevronDown, LoaderCircle } from "lucide-react";
import type { Step } from "../hooks/useAgentActivity";

/** The observable tool sequence for this conversation. */
export function ActivityPanel({
  steps,
  chunks,
  running,
  onInspector,
}: {
  steps: Step[];
  chunks: number;
  running: boolean;
  onInspector: () => void;
}) {
  if (!steps.length) return null;
  return (
    <details className="activity-panel">
      <summary>
        <span className={running ? "activity-dot live" : "activity-dot"} />
        Tool activity
        <span className="activity-count">
          {steps.length} calls · {chunks} argument chunks
        </span>
        <ChevronDown size={13} />
      </summary>
      <ol>
        {steps.map((step) => (
          <li key={step.id} className={step.done ? "done" : undefined}>
            <span className="step-mark">
              {step.done ? (
                <Check size={11} />
              ) : (
                <LoaderCircle size={11} className={running ? "spin" : ""} />
              )}
            </span>
            <code>{step.name}</code>
            <small>{step.chunks} chunks</small>
          </li>
        ))}
      </ol>
      <button className="text-button" onClick={onInspector}>
        Inspect protocol events <ArrowUpRight size={12} />
      </button>
    </details>
  );
}
