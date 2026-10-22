import { ArrowUpRight, ChevronDown, Terminal, Wallet } from "lucide-react";
import { views } from "../lib/nav";
import type { View } from "../lib/nav";

export function Brand() {
  return (
    <span className="brand">
      <Wallet size={24} strokeWidth={1.7} />
      penny<span aria-hidden="true">↗</span>
    </span>
  );
}

export function Sidebar({
  view,
  setView,
  planLive,
  onGuide,
  onInspector,
}: {
  view: View;
  setView: (view: View) => void;
  planLive: boolean;
  onGuide: () => void;
  onInspector: () => void;
}) {
  return (
    <aside className="sidebar">
      <a
        className="brand-link"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setView("overview");
        }}
        aria-label="Penny home"
      >
        <Brand />
      </a>
      <div className="workspace-label">
        <span className="avatar">JL</span>
        <div>
          Jamie’s workspace<small>Personal budget</small>
        </div>
        <ChevronDown size={14} />
      </div>
      <nav aria-label="Main navigation">
        {(Object.keys(views) as View[]).map((id) => {
          const { label, icon: Icon } = views[id];
          return (
            <button
              key={id}
              aria-current={view === id ? "page" : undefined}
              onClick={() => setView(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === "plan" && planLive && (
                <span className="nav-live" aria-label="Streaming" />
              )}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-note">
        <h3>
          Less spreadsheet.
          <br />
          More possibility.
        </h3>
        <p>Small changes today. More room for tomorrow.</p>
        <button onClick={onGuide}>
          Explore the demo <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="sidebar-bottom">
        <span className="demo-status">
          <span />
          Demo workspace
        </span>
        <p>Illustrative data. Real AI.</p>
        <button onClick={onInspector}>
          <Terminal size={15} />
          AG-UI event inspector
        </button>
      </div>
    </aside>
  );
}
