import { Check, ExternalLink, LoaderCircle } from "lucide-react";

/** Catch-all renderer: every tool call gets a readable, expandable record. */
export function ToolResult({
  name,
  parameters,
  result,
  status,
}: {
  name: string;
  parameters: unknown;
  result?: string;
  status: string;
}) {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(result || "{}");
  } catch {
    /* Raw result stays available below. */
  }
  const done = status === "complete";
  return (
    <details className="tool-result" data-testid="catchall-tool">
      <summary>
        <span className={done ? "tool-state done" : "tool-state"}>
          {done ? (
            <Check size={12} />
          ) : (
            <LoaderCircle className="spin" size={12} />
          )}
        </span>
        <code>{name}</code>
        <small>
          {done
            ? "Complete"
            : status === "executing"
              ? "Running"
              : "Receiving arguments"}
        </small>
      </summary>
      {name === "search_web" && Array.isArray(parsed.results) ? (
        <div className="mock-results">
          <span className="mock-label">Mock web results</span>
          {(
            parsed.results as { title: string; snippet: string; url: string }[]
          ).map((r, i) => (
            <article key={i}>
              <strong>
                {r.title}
                <ExternalLink size={12} />
              </strong>
              <p>{r.snippet}</p>
              <small>{r.url}</small>
            </article>
          ))}
        </div>
      ) : (
        <pre>
          {JSON.stringify(
            { arguments: parameters, result: result ? parsed : "Waiting…" },
            null,
            2,
          )}
        </pre>
      )}
    </details>
  );
}
