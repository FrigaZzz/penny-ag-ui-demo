import { useEffect, useRef, useState } from "react";
import { Code2, LayoutDashboard, LoaderCircle, ShieldCheck } from "lucide-react";
import { rowsFromDocument } from "../lib/data";
import type { Budget } from "../lib/data";
import { Savings, Spending, TransactionTable } from "./Budget";
import { WidgetHeading } from "./WidgetHeading";

/** Widgets chosen and ordered by the agent through render_dashboard. */
export function Dashboard({
  document,
  budget,
  live,
}: {
  document: string;
  budget: Budget;
  live: boolean;
}) {
  const rows = rowsFromDocument(document);
  const widgets = rows.filter((r) => r.type !== "heading");

  return (
    <section className="generated-dashboard" data-testid="generated-dashboard">
      <WidgetHeading
        icon={LayoutDashboard}
        title={
          rows.find((r) => r.type === "heading")?.title ||
          "Your personal dashboard"
        }
        live={live}
      />
      <div className="dashboard-progress" role="status" aria-live="polite">
        <span className={live ? "dashboard-progress-dot live" : "dashboard-progress-dot"} />
        {live
          ? widgets.length
            ? `${widgets.length} widget${widgets.length === 1 ? "" : "s"} placed · composing…`
            : "Waiting for the first widget…"
          : `${widgets.length} widget${widgets.length === 1 ? "" : "s"} composed`}
      </div>
      <div className="dashboard-grid">
        {widgets.map((row, i) => (
          <div className={`dashboard-section ${row.type}`} key={i}>
            <h4>{row.title || row.type}</h4>
            {row.type === "spending" ? (
              <Spending budget={budget} />
            ) : row.type === "transactions" ? (
              <TransactionTable budget={budget} limit={5} />
            ) : row.type === "savings" ? (
              <Savings budget={budget} />
            ) : row.type === "insight" ? (
              <p className="insight">{row.text}</p>
            ) : (
              <p>Unknown widget: {row.type}</p>
            )}
          </div>
        ))}
        {live && <div className="dashboard-awaiting" aria-hidden="true"><span /><span /><span /></div>}
      </div>
      <p className="widget-footnote">
        The agent chose and composed these widgets.
      </p>
    </section>
  );
}

const CSP = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'"><meta name="viewport" content="width=device-width,initial-scale=1">`;

/** Agent-written HTML in a script-only sandbox with the network disabled. */
export function HtmlWidget({ html, live }: { html: string; live: boolean }) {
  const [preview, setPreview] = useState(html);
  const latestHtml = useRef(html);
  latestHtml.current = html;
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => setPreview(latestHtml.current), 500);
    return () => clearInterval(timer);
  }, [live]);
  useEffect(() => {
    if (!live) setPreview(html);
  }, [html, live]);
  return (
    <section className="html-widget" data-testid="html-widget">
      <WidgetHeading
        icon={Code2}
        title="Made for this conversation"
        live={live}
      />
      {preview ? (
        <iframe
          title="Agent-generated savings calculator"
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          srcDoc={CSP + preview}
          style={{ pointerEvents: live ? "none" : "auto" }}
        />
      ) : (
        <div className="draft-placeholder">
          <LoaderCircle className="spin" size={16} />
          Writing your interface…
        </div>
      )}
      <p className="widget-footnote">
        <ShieldCheck size={12} />
        {live ? "Preview updating · interaction available when complete" : "Generated HTML · isolated sandbox · network disabled"}
      </p>
    </section>
  );
}
