import {
  Code2,
  Database,
  LayoutDashboard,
  ListFilter,
  ReceiptText,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Terminal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type View = "overview" | "transactions" | "plan" | "playground";

export const views: Record<
  View,
  { label: string; short: string; icon: LucideIcon; title: string; lede: string }
> = {
  overview: {
    label: "Overview",
    short: "Overview",
    icon: LayoutDashboard,
    title: "Make room for what matters.",
    lede: "A clearer picture of your money. A little help with what’s next.",
  },
  transactions: {
    label: "Transactions",
    short: "Activity",
    icon: ReceiptText,
    title: "The little things add up.",
    lede: "Explore the seeded transactions your agent can read.",
  },
  plan: {
    label: "Live plan",
    short: "Live plan",
    icon: Sparkles,
    title: "A plan, taking shape.",
    lede: "See your draft as the agent calls its tools.",
  },
  playground: {
    label: "UI playground",
    short: "Playground",
    icon: Code2,
    title: "An interface, just for you.",
    lede: "Ask Penny to compose a dashboard or build a custom calculator.",
  },
};

// Indexed like `demos` in data.ts.
export const demoIcons: LucideIcon[] = [
  Sparkles,
  ShieldCheck,
  Code2,
  Database,
  LayoutDashboard,
  ListFilter,
  Target,
  SlidersHorizontal,
  Terminal,
];
