import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

/** Native <dialog> with focus trapping, Escape and backdrop-click to close. */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  label,
  closeLabel,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: ReactNode;
  label?: string;
  closeLabel: string;
  className: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-label={label}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dialog-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <button className="icon-button" onClick={onClose} aria-label={closeLabel}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
