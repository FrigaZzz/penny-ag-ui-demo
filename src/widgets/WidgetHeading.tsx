import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function LiveTag({ live }: { live: boolean }) {
  return (
    <span className={`status-tag ${live ? "live" : ""}`}>
      <span />
      {live ? "Building live" : "Ready"}
    </span>
  );
}

export function WidgetHeading({
  title,
  icon: Icon = Sparkles,
  live,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  live?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="widget-heading">
      <span className="widget-icon">
        <Icon size={16} />
      </span>
      <h3>{title}</h3>
      {live !== undefined && <LiveTag live={live} />}
      {children}
    </div>
  );
}
