import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Profundidade global de modais abertos: só o topo da pilha responde ao Escape. */
let openModals = 0;

export default function Modal({ open, title, onClose, children, footer, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    openModals += 1;
    const index = openModals;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (index === openModals) onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      // Trap de foco só atua quando o foco está NESTE diálogo (evita conflito com modais empilhados).
      if (!dialog || !dialog.contains(document.activeElement)) return;
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    const timer = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
    }, 0);
    return () => {
      openModals -= 1;
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl bg-white shadow-2xl ${
          size === 'lg' ? 'max-w-3xl' : 'max-w-lg'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
