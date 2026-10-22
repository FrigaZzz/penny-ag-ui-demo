import { Code2 } from "lucide-react";
import { demos } from "../lib/data";
import type { Budget } from "../lib/data";
import { Dashboard, HtmlWidget } from "../widgets/Generated";
import { EmptyWorkspace } from "./EmptyWorkspace";

export function Playground({
  budget,
  dashboard,
  html,
  streaming,
  busy,
  send,
}: {
  budget: Budget;
  dashboard: string;
  html: string;
  streaming: string;
  busy: boolean;
  send: (message: string) => boolean;
}) {
  if (!dashboard && !html && !streaming)
    return (
      <EmptyWorkspace
        icon={Code2}
        title="The conversation becomes the interface."
        text="Let the agent choose useful widgets, or ask it to write a custom, interactive savings calculator from scratch."
        action="Compose my dashboard"
        onClick={() => send(demos[4].prompt)}
        disabled={busy}
      />
    );
  return (
    <div className="playground">
      {dashboard && (
        <Dashboard
          document={dashboard}
          budget={budget}
          live={streaming === "render_dashboard"}
        />
      )}
      {(html || streaming === "render_html") && (
        <HtmlWidget html={html} live={streaming === "render_html"} />
      )}
    </div>
  );
}
