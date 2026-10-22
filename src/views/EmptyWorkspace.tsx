import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function EmptyWorkspace({
  icon: Icon,
  title,
  text,
  action,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  action: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <div className="empty-workspace">
      <div className="empty-art" aria-hidden="true">
        <Icon size={30} strokeWidth={1.4} />
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
      <button className="primary" onClick={onClick} disabled={disabled}>
        {action}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
