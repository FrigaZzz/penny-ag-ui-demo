import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  useFrontendTool,
  useHumanInTheLoop,
  useInterrupt,
  useRenderTool,
} from "@copilotkit/react-core/v2";
import { z } from "zod";
import { Check, Target } from "lucide-react";
import type { Budget } from "../lib/data";
import type { View } from "../lib/nav";
import { Approval, GoalPicker } from "../widgets/Decisions";
import { Dashboard, HtmlWidget } from "../widgets/Generated";
import { Plan } from "../widgets/Plan";
import { ToolResult } from "../widgets/ToolResult";

export const GOAL_SLOT = "goal-slot";

/** Renders the goal picker into the workspace while the chat shows a pointer. */
function GoalPortal({
  prompt,
  budget,
  respond,
  pending,
}: {
  prompt: string;
  budget: Budget;
  respond?: (s: string) => void;
  pending: (value: boolean) => void;
}) {
  useEffect(() => {
    pending(true);
    return () => pending(false);
  }, [pending]);
  const slot = document.getElementById(GOAL_SLOT);
  return (
    <>
      <p className="inline-notice">
        <Target size={15} />
        Choose a goal in your workspace to continue.
      </p>
      {slot &&
        createPortal(
          <GoalPicker
            prompt={prompt}
            current={budget.goal}
            max={budget.income}
            onRespond={(value) => respond?.(value)}
          />,
          slot,
        )}
    </>
  );
}

const Loading = () => <p className="inline-notice">Loading budget…</p>;

/** Every tool Penny can call, and how each one renders in chat or workspace. */
export function usePennyTools({
  budget,
  draft,
  setDashboard,
  setHtml,
  setView,
}: {
  budget?: Budget;
  draft: string;
  setDashboard: (doc: string) => void;
  setHtml: (html: string) => void;
  setView: (view: View) => void;
}) {
  const [goalPending, setGoalPending] = useState(false);

  useRenderTool({
    name: "*",
    agentId: "penny",
    render: (props) => <ToolResult {...props} />,
  });
  useRenderTool(
    {
      name: "show_plan",
      agentId: "penny",
      parameters: z.object({ document: z.string() }),
      render: ({ parameters, status }) =>
        budget ? (
          <Plan
            document={parameters.document || ""}
            budget={budget}
            compact
            live={status === "inProgress"}
          />
        ) : (
          <Loading />
        ),
    },
    [budget],
  );
  useFrontendTool(
    {
      name: "render_dashboard",
      agentId: "penny",
      description:
        "Compose a personalized dashboard. document is NDJSON: heading, then spending, transactions, savings, or insight widget objects.",
      parameters: z.object({ document: z.string() }),
      handler: async ({ document }) => {
        setDashboard(document);
        setView("playground");
        return "Dashboard displayed in the workspace.";
      },
      render: ({ args, status }) =>
        budget ? (
          <Dashboard
            document={args.document || ""}
            budget={budget}
            live={status === "inProgress"}
          />
        ) : (
          <Loading />
        ),
    },
    [budget],
  );
  useFrontendTool({
    name: "render_html",
    agentId: "penny",
    description:
      "Render a complete self-contained HTML calculator or custom UI. Inline CSS/JS allowed, no external resources or network.",
    parameters: z.object({ html: z.string() }),
    handler: async ({ html }) => {
      setHtml(html);
      setView("playground");
      return "Custom interface displayed in an isolated sandbox.";
    },
    render: ({ args, status }) => (
      <HtmlWidget html={args.html || ""} live={status === "inProgress"} />
    ),
  });
  useHumanInTheLoop(
    {
      name: "ask_goal",
      agentId: "penny",
      description:
        "Ask the user to select a monthly savings goal in the application. Wait for the user to respond; then use set_savings_goal unless cancelled.",
      parameters: z.object({ prompt: z.string() }),
      render: ({ args, status, respond }) =>
        status === "executing" && budget ? (
          <GoalPortal
            prompt={args.prompt || ""}
            budget={budget}
            respond={respond}
            pending={setGoalPending}
          />
        ) : (
          <p className="inline-notice">
            <Check size={14} />
            {status === "complete"
              ? "Goal selection received"
              : "Preparing your goal picker…"}
          </p>
        ),
    },
    [budget?.goal, budget?.income],
  );
  const interrupt = useInterrupt({
    agentId: "penny",
    renderInChat: false,
    render: ({ event, resolve, cancel }) => {
      const payload = event.value?.metadata?.adk?.toolConfirmation?.payload;
      return budget ? (
        <Approval
          document={
            typeof payload?.document === "string" ? payload.document : draft
          }
          reason={typeof payload?.reason === "string" ? payload.reason : ""}
          budget={budget}
          onApprove={() => resolve({ approved: true })}
          onReject={() => cancel()}
        />
      ) : (
        <Loading />
      );
    },
  });

  return { interrupt, goalPending };
}
