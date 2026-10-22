import { ArrowRight, ArrowUpRight, Sparkles, Wallet } from "lucide-react";
import { demos } from "../lib/data";
import { demoIcons } from "../lib/nav";

const STARTERS = ["plan", "dashboard", "html", "goal"];

export function ChatWelcome({
  disabled,
  send,
  onGuide,
}: {
  disabled: boolean;
  send: (prompt: string) => void;
  onGuide: () => void;
}) {
  return (
    <div className="chat-welcome">
      <div className="welcome-art" aria-hidden="true">
        <Wallet size={28} strokeWidth={1.3} />
        <span>
          <Sparkles size={14} />
        </span>
      </div>
      <h3>
        Your next good money move starts with a conversation.
      </h3>
      <p>
        I can explore your spending, make a plan, or build an interactive tool
        just for you.
      </p>
      <div className="starter-list">
        {demos.map((demo, i) => {
          if (!STARTERS.includes(demo.id)) return null;
          const Icon = demoIcons[i];
          return (
            <button
              key={demo.id}
              disabled={disabled}
              onClick={() => send(demo.prompt)}
            >
              <span className="starter-icon">
                <Icon size={17} />
              </span>
              <span>
                <strong>{demo.title}</strong>
                <small>{demo.detail}</small>
              </span>
              <ArrowUpRight size={15} />
            </button>
          );
        })}
      </div>
      <button className="all-demos" onClick={onGuide}>
        Explore all 9 capabilities <ArrowRight size={14} />
      </button>
    </div>
  );
}
