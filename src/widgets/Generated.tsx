import { useEffect, useState } from "react";
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
      {rows
        .filter((r) => r.type !== "heading")
        .map((row, i) => (
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
  useEffect(() => {
    const timer = setTimeout(() => setPreview(html), live ? 250 : 0);
    return () => clearTimeout(timer);
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
        Generated HTML · isolated sandbox · network disabled
      </p>
    </section>
  );
}
