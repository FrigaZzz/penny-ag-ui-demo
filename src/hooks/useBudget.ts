import { useEffect, useState } from "react";
import type { Budget } from "../lib/data";

export type Health = {
  model: string;
  native_argument_streaming: boolean;
  backend: string;
};

/** Seed budget and server health, loaded once before the agent takes over state. */
export function useBudget() {
  const [budget, setBudget] = useState<Budget>();
  const [health, setHealth] = useState<Health>();
  const [loadError, setLoadError] = useState("");

  async function load() {
    setLoadError("");
    try {
      const [b, h] = await Promise.all([
        fetch("/api/budget"),
        fetch("/api/health"),
      ]);
      if (!b.ok || !h.ok)
        throw new Error(
          "The agent server is unavailable. Start it with npm run dev:server, then retry.",
        );
      setBudget(await b.json());
      setHealth(await h.json());
    } catch (e) {
      setLoadError(
        e instanceof Error ? e.message : "Could not load your demo budget.",
      );
    }
  }
  useEffect(() => {
    void load();
  }, []);

  return { budget, setBudget, health, loadError, reload: load };
}
