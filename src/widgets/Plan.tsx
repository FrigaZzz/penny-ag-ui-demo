import { LoaderCircle } from "lucide-react";
import { categoryColor, money, rowsFromDocument } from "../lib/data";
import type { Budget } from "../lib/data";
import { WidgetHeading } from "./WidgetHeading";

/** A budget draft rendered row by row from streamed NDJSON tool arguments. */
export function Plan({
  document,
  budget,
  live = false,
  compact = false,
}: {
  document: string;
  budget: Budget;
  live?: boolean;
  compact?: boolean;
}) {
  const rows = rowsFromDocument(document);
  const header = rows.find((r) => r.type === "heading");
  const allocations = rows.filter(
    (r) =>
      r.type === "allocation" &&
      typeof r.category === "string" &&
      typeof r.amount === "number" &&
      Number.isFinite(r.amount),
  );
  const total = allocations.reduce((sum, r) => sum + (r.amount || 0), 0);
  const complete = allocations.length === budget.categories.length;
  return (
    <section
      className={`plan-widget ${compact ? "compact" : ""}`}
      data-testid="plan-widget"
    >
      <WidgetHeading
        title={header?.title || "Making room for more"}
        live={live}
      />
      {header?.summary && <p className="widget-summary">{header.summary}</p>}
      <div className="plan-rows">
        {allocations.map((row) => {
          const current =
            budget.categories.find((c) => c.category === row.category)
              ?.amount || 0;
          const delta = row.amount! - current;
          return (
            <div className="plan-row" key={row.category}>
              <span
                className="category-dot"
                style={{ background: categoryColor(budget, row.category) }}
              />
              <div className="plan-row-text">
                <strong>{row.category}</strong>
                {!compact && row.reason && <p>{row.reason}</p>}
              </div>
              <div className="plan-amount">
                <strong>{money(row.amount!)}</strong>
                {delta !== 0 && (
                  <span className={delta < 0 ? "delta down" : "delta up"}>
                    <del>{money(current)}</del>
                    {delta < 0 ? "−" : "+"}
                    {money(Math.abs(delta))}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {live && (
          <div className="draft-placeholder">
            <LoaderCircle className="spin" size={15} />
            {allocations.length
              ? "Adding the next category…"
              : "Waiting for the first row…"}
          </div>
        )}
      </div>
      <div className="plan-total">
        <span>
          {complete
            ? "Room for savings"
            : `${allocations.length} of ${budget.categories.length} categories received`}
        </span>
        <strong>{complete ? money(budget.income - total) : "…"}</strong>
      </div>
      <p className="widget-footnote">
        {live
          ? "Rendered from incoming tool arguments"
          : "Draft only. Saving requires your approval."}
      </p>
    </section>
  );
}
