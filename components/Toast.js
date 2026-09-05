"use client";

import { Undo2, X } from "lucide-react";

export default function Toast({ toast, onUndo, onDismiss }) {
  if (!toast) return null;
  return (
    <div className="toast no-print" role="status">
      <span>{toast.message}</span>
      {onUndo ? (
        <button className="btn btn-quiet toast-action" onClick={onUndo}>
          <Undo2 size={14} /> Undo
        </button>
      ) : null}
      <button className="btn btn-quiet toast-close" onClick={onDismiss} aria-label="Dismiss">
        <X size={13} />
      </button>
    </div>
  );
}
