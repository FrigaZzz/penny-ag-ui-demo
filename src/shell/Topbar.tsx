import { SlidersHorizontal } from "lucide-react";
import { views } from "../lib/nav";
import type { View } from "../lib/nav";

export function Topbar({
  view,
  setView,
  onGuide,
}: {
  view: View;
  setView: (view: View) => void;
  onGuide: () => void;
}) {
  return (
    <>
      <header className="topbar">
        <div className="crumbs">
          <button className="breadcrumb" onClick={() => setView("overview")}>
            Workspace
          </button>
          <span className="slash" aria-hidden="true">
            /
          </span>
          <strong>{views[view].label}</strong>
        </div>
        <div className="topbar-right">
          <span className="mock-label">Mock financial data</span>
          <button
            className="icon-button"
            aria-label="Open demo feature guide"
            title="Demo features"
            onClick={onGuide}
          >
            <SlidersHorizontal size={18} />
          </button>
          <span className="user-avatar">JL</span>
        </div>
      </header>
      <nav className="mobile-nav" aria-label="Workspace sections">
        {(Object.keys(views) as View[]).map((id) => (
          <button
            key={id}
            aria-current={view === id ? "page" : undefined}
            onClick={() => setView(id)}
          >
            {views[id].short}
          </button>
        ))}
      </nav>
    </>
  );
}
