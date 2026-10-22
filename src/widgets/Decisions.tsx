import { useEffect, useState } from "react";
import { ArrowRight, Check, ShieldCheck, Target, X } from "lucide-react";
import type { Budget } from "../lib/data";
import { Plan } from "./Plan";
import { WidgetHeading } from "./WidgetHeading";

/** Native ADK interrupt: the agent is paused until the person decides. */
export function Approval({
  document,
  reason,
  budget,
  onApprove,
  onReject,
}: {
  document: string;
  reason: string;
  budget: Budget;
  onApprove: () => Promise<unknown>;
  onReject: () => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function decide(approve: boolean) {
    setBusy(true);
    try {
      await (approve ? onApprove() : onReject());
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not resume the agent. Try again.",
      );
      setBusy(false);
    }
  }
  return (
    <section className="approval-widget" data-testid="approval-widget">
      <WidgetHeading icon={ShieldCheck} title="It’s your call.">
        <span className="waiting-tag">Awaiting approval</span>
      </WidgetHeading>
      <p>
        {reason ||
          "Review this draft before the agent saves it to your local budget."}
      </p>
      <Plan document={document} budget={budget} compact />
      <div className="approval-actions">
        <button
          className="primary"
          disabled={busy}
          onClick={() => void decide(true)}
        >
          <Check size={16} />
          Approve & save
        </button>
        <button
          className="secondary"
          disabled={busy}
          onClick={() => void decide(false)}
        >
          <X size={15} />
          Keep my budget
        </button>
      </div>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      <small>The agent is paused. No budget changes have been saved.</small>
    </section>
  );
}

/** Frontend human-in-the-loop tool: the agent waits for a chosen goal. */
export function GoalPicker({
  prompt,
  current,
  max,
  onRespond,
}: {
  prompt: string;
  current: number;
  max: number;
  onRespond: (result: string) => void;
}) {
  const [amount, setAmount] = useState(current / 100);
  const [done, setDone] = useState(false);
  return (
    <form
      className="goal-picker"
      data-testid="goal-picker"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
        onRespond(
          JSON.stringify({ amount: Math.round(amount * 100), cancelled: false }),
        );
      }}
    >
      <WidgetHeading icon={Target} title="A goal that feels right." />
      <p>
        {prompt ||
          "Choose your monthly savings goal. The agent will work with your number."}
      </p>
      <label htmlFor="agent-goal">Monthly savings, in dollars</label>
      <div className="goal-input">
        <span>$</span>
        <input
          id="agent-goal"
          type="number"
          min="0"
          max={max / 100}
          step="1"
          required
          value={amount}
          disabled={done}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </div>
      <div className="goal-presets">
        {[1000, 1500, 2000].map((n) => (
          <button
            type="button"
            key={n}
            disabled={done}
            aria-pressed={amount === n}
            onClick={() => setAmount(n)}
          >
            ${n.toLocaleString()}
          </button>
        ))}
      </div>
      <div className="goal-picker-actions">
        <button type="submit" className="primary" disabled={done}>
          Use this goal <ArrowRight size={16} />
        </button>
        <button
          type="button"
          className="text-button"
          disabled={done}
          onClick={() => {
            setDone(true);
            onRespond(JSON.stringify({ cancelled: true }));
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Direct UI edit of shared state; the agent reads the saved goal next run. */
export function GoalEditor({
  budget,
  onSave,
  disabled,
}: {
  budget: Budget;
  onSave: (b: Budget) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState(String(budget.goal / 100));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setValue(String(budget.goal / 100));
  }, [budget.goal]);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSaved(false);
        try {
          const response = await fetch("/api/goal", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: Math.round(Number(value) * 100) }),
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(
              typeof data.detail === "string"
                ? data.detail
                : "Enter a valid goal within your income.",
            );
          }
          onSave(await response.json());
          setSaved(true);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not save the goal.");
        } finally {
          setSaving(false);
        }
      }}
    >
      <label className="sr-only" htmlFor="savings-goal">
        Monthly savings goal in dollars
      </label>
      <div className="goal-editor">
        <span className="goal-field">
          <span>$</span>
          <input
            id="savings-goal"
            type="number"
            min="0"
            max={budget.income / 100}
            step="1"
            required
            value={value}
            disabled={disabled || saving}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
          />
          <span>/ month</span>
        </span>
        <button
          type="submit"
          className={saved ? "secondary saved" : "secondary"}
          disabled={disabled || saving}
        >
          {saving ? "Saving…" : saved ? "Saved" : "Update goal"}
          {saved ? <Check size={14} /> : <ArrowRight size={14} />}
        </button>
      </div>
      {error && (
        <small role="alert" className="error-message">
          {error}
        </small>
      )}
    </form>
  );
}
