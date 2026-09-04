import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  children: ReactNode;
  largura?: string;
}

export function Modal({ aberto, onFechar, titulo, children, largura = "max-w-lg" }: ModalProps) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full ${largura} rounded-card border border-border bg-card shadow-lg`}>
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-serif text-lg font-semibold text-text">{titulo}</h3>
          <button onClick={onFechar} className="rounded-md p-1 text-text-muted hover:bg-border/30">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
