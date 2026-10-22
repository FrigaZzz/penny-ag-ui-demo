export type Budget = {
  income: number;
  goal: number;
  revision: number;
  approvals: number;
  categories: { category: string; amount: number; spent: number }[];
  transactions: {
    id: number;
    date: string;
    merchant: string;
    category: string;
    amount: number;
  }[];
};
export type AgentState = {
  budget?: Budget;
  draft_document?: string;
  draft_revision?: number;
  last_saved?: number;
};
export type Row = {
  type: string;
  title?: string;
  summary?: string;
  category?: string;
  amount?: number;
  reason?: string;
  text?: string;
};
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 ? 2 : 0,
  }).format(cents / 100);
export const colors = [
  "#254f41",
  "#6b8764",
  "#b6c894",
  "#d2b16e",
  "#dd9e7c",
  "#a3bfc1",
  "#8d82a6",
  "#b2b4a6",
];

// Category colors follow the budget's category order everywhere in the app.
export const categoryColor = (budget: Budget, category?: string) =>
  colors[
    Math.max(0, budget.categories.findIndex((c) => c.category === category)) %
      colors.length
  ];

export function totals(budget: Budget) {
  const budgeted = budget.categories.reduce((sum, c) => sum + c.amount, 0);
  const spent = budget.categories.reduce((sum, c) => sum + c.spent, 0);
  return { budgeted, spent, available: budget.income - budgeted };
}

export function rowsFromDocument(document = ""): Row[] {
  // Ignore the incomplete final row; completed rows render as arguments arrive.
  return document.split("\n").flatMap((line) => {
    try {
      const row: unknown = JSON.parse(line);
      if (
        !row ||
        typeof row !== "object" ||
        !("type" in row) ||
        typeof row.type !== "string"
      )
        return [];
      const record = row as Record<string, unknown>;
      const strings = Object.fromEntries(
        ["title", "summary", "category", "reason", "text"]
          .filter((key) => typeof record[key] === "string")
          .map((key) => [key, record[key]]),
      );
      return [
        {
          type: row.type,
          ...strings,
          ...(typeof record.amount === "number" &&
          Number.isSafeInteger(record.amount) &&
          record.amount >= 0
            ? { amount: record.amount }
            : {}),
        },
      ];
    } catch {
      return [];
    }
  });
}

export const demos = [
  {
    id: "plan",
    title: "Build a savings plan",
    detail: "Watch budget rows arrive live",
    feature: "Tool-based generative UI",
    prompt:
      "Read my budget and build a thoughtful savings plan for my current goal. Use show_plan so I can watch each category arrive. Do not save it yet.",
  },
  {
    id: "interrupt",
    title: "Review & save a plan",
    detail: "The agent pauses for your approval",
    feature: "Generative UI interrupt",
    prompt:
      "Create a budget draft if needed, then apply it using apply_budget. Pause for my approval before saving anything.",
  },
  {
    id: "html",
    title: "Make me a calculator",
    detail: "An interface written just for you",
    feature: "Open generative UI",
    prompt:
      "Use render_html to build a custom interactive savings calculator with monthly contribution and number of months inputs. Show the total saved dynamically. Use my current savings goal as the default contribution.",
  },
  {
    id: "catchall",
    title: "Explore my transactions",
    detail: "Every tool gets a useful renderer",
    feature: "Default tool rendering",
    prompt:
      "Read my budget and transactions with read_budget. Which three merchants account for the most spending? Keep the answer short.",
  },
  {
    id: "dashboard",
    title: "Build my dashboard",
    detail: "Let the agent choose the widgets",
    feature: "Agentic generative UI",
    prompt:
      "Use read_budget, then render_dashboard to compose a dashboard for me. Pick spending, savings, and an insight widget. Use my real demo data.",
  },
  {
    id: "activity",
    title: "Show your work",
    detail: "Follow the observable tool sequence",
    feature: "Reasoning-chain tool rendering",
    prompt:
      "Read my budget, search the mock web for two practical spending ideas, then build a savings plan with show_plan. Do not save it. I want to follow the tool activity.",
  },
  {
    id: "goal",
    title: "Choose a savings goal",
    detail: "Make a decision inside the app",
    feature: "Human in the loop, in app",
    prompt:
      "Help me choose a new savings goal. Call ask_goal to let me pick the amount in the app, then save exactly the goal I choose using set_savings_goal. Do not create a plan yet.",
  },
  {
    id: "shared",
    title: "Use my edited goal",
    detail: "Your edits become agent context",
    feature: "Shared state read / write",
    prompt:
      "Read my latest edited savings goal from the budget and create a plan for it using show_plan. Do not save the plan yet.",
  },
  {
    id: "stream",
    title: "Stream a live draft",
    detail: "The workspace updates with the chat",
    feature: "Shared state streaming",
    prompt:
      "Use show_plan to write a complete eight-category savings plan with detailed reasons. I want to watch the draft build live in the workspace. Do not save it.",
  },
] as const;
