import { categoryColor, colors, money, totals } from "../lib/data";
import type { Budget } from "../lib/data";

const pct = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 100) : 0;

/** Where this month's income goes: spent, still budgeted, and left to save. */
export function IncomeLedger({ budget }: { budget: Budget }) {
  const { budgeted, spent, available } = totals(budget);
  const still = Math.max(0, budgeted - spent);
  const spentShown = Math.min(spent, budgeted);
  const room = Math.max(0, available);
  const parts = [
    { key: "spent", label: "Spent so far", value: spent, flex: spentShown },
    { key: "still", label: "Still budgeted", value: still, flex: still },
    { key: "room", label: "Room for savings", value: available, flex: room },
  ];
  return (
    <section className="ledger" aria-label="Monthly budget summary">
      <div className="ledger-figure">
        <span>Room for savings</span>
        <strong>{money(available)}</strong>
        <p>
          {pct(available, budget.income)}% of your {money(budget.income)}{" "}
          monthly income, after taxes.{" "}
          {available >= budget.goal
            ? `Your ${money(budget.goal)} goal fits.`
            : `${money(budget.goal - available)} short of your goal.`}
        </p>
      </div>
      <div className="ledger-split">
        <div className="ledger-bar" role="img" aria-label="Income split">
          {parts.map((p) => (
            <span
              key={p.key}
              className={p.key}
              style={{ flexGrow: p.flex }}
            />
          ))}
          {budget.goal > 0 && budget.goal <= budget.income && (
            <i
              className="goal-mark"
              style={{ left: `${100 - pct(budget.goal, budget.income)}%` }}
              title={`Savings goal ${money(budget.goal)}`}
            />
          )}
        </div>
        <dl>
          {parts.map((p) => (
            <div key={p.key}>
              <dt>
                <i className={p.key} />
                {p.label}
              </dt>
              <dd>{money(p.value)}</dd>
            </div>
          ))}
          <div className="ledger-income">
            <dt>Monthly income</dt>
            <dd>{money(budget.income)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

export function BudgetTable({ budget }: { budget: Budget }) {
  return (
    <table className="budget-table">
      <caption className="sr-only">Current monthly spending plan</caption>
      <thead>
        <tr>
          <th>Category</th>
          <th className="number">Spent</th>
          <th className="number">Budget</th>
          <th className="usage-cell">Used</th>
        </tr>
      </thead>
      <tbody>
        {budget.categories.map((c, i) => {
          const used = c.amount ? pct(c.spent, c.amount) : 100;
          const over = c.spent > c.amount;
          return (
            <tr key={c.category} className={over ? "over" : undefined}>
              <td>
                <span
                  className="category-dot"
                  style={{ background: colors[i % colors.length] }}
                />
                {c.category}
              </td>
              <td className="number">{money(c.spent)}</td>
              <td className="number budget-value">{money(c.amount)}</td>
              <td className="usage-cell">
                <div className="usage">
                <div
                  className="usage-bar"
                  aria-label={`${c.category}: ${used}% of budget spent`}
                >
                  <span
                    style={{
                      width: `${Math.min(100, used)}%`,
                      background: over ? undefined : colors[i % colors.length],
                    }}
                  />
                </div>
                <small>
                  {over ? `${money(c.spent - c.amount)} over` : `${used}%`}
                </small>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function Spending({ budget }: { budget: Budget }) {
  const { spent } = totals(budget);
  return (
    <div className="spending-widget">
      <div className="chart-heading">
        <span>Spent this month</span>
        <strong>{money(spent)}</strong>
      </div>
      <div
        className="spending-strip"
        role="img"
        aria-label={`Spending by category, total ${money(spent)}`}
      >
        {budget.categories.map((c, i) => (
          <div
            key={c.category}
            title={`${c.category}: ${money(c.spent)}`}
            style={{ flex: c.spent, background: colors[i % colors.length] }}
          />
        ))}
      </div>
      <div className="chart-legend">
        {budget.categories.map((c, i) => (
          <span key={c.category}>
            <i style={{ background: colors[i % colors.length] }} />
            {c.category}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TransactionTable({
  budget,
  limit,
}: {
  budget: Budget;
  limit?: number;
}) {
  const rows = budget.transactions.slice(0, limit);
  if (!rows.length)
    return <p className="table-empty">No transactions match that search.</p>;
  return (
    <div className="transactions">
      <table>
        <caption className="sr-only">Mock October 2026 transactions</caption>
        <thead>
          <tr>
            <th>Merchant</th>
            <th>Category</th>
            <th className="number">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td>
                <strong>{t.merchant}</strong>
                <small>
                  {new Date(t.date + "T12:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </small>
              </td>
              <td>
                <span className="category-label">
                  <i
                    style={{ background: categoryColor(budget, t.category) }}
                  />
                  {t.category}
                </span>
              </td>
              <td className="number">{money(t.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Savings({ budget }: { budget: Budget }) {
  const { available } = totals(budget);
  return (
    <div className="savings-widget">
      <span>Monthly savings goal</span>
      <strong>{money(budget.goal)}</strong>
      <p>
        Your current budget leaves {money(available)} for savings.{" "}
        {available >= budget.goal
          ? "You have room to reach your goal."
          : `Make room for another ${money(budget.goal - available)}.`}
      </p>
      <div className="savings-comparison">
        <span>
          Available <b>{money(available)}</b>
        </span>
        <span>
          Goal <b>{money(budget.goal)}</b>
        </span>
      </div>
    </div>
  );
}
