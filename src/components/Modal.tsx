import { X } from "lucide-react";
import type { ReactNode } from "react";
import { GlassCard } from "@/components/GlassCard";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, title, onClose, children, maxWidth = "max-w-md" }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <GlassCard
        className={`max-h-[90vh] w-full ${maxWidth} rounded-t-2xl border shadow-2xl sm:rounded-2xl`}
        contentClassName="flex max-h-[90vh] flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </GlassCard>
    </div>
  );
}
