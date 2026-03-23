'use client';

import { useEffect, useRef } from 'react';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  titleId?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Ancho máximo del panel (Tailwind), ej: max-w-lg */
  panelClassName?: string;
};

/**
 * Modal basado en `<dialog>` + `showModal()` para comportamiento y foco coherentes
 * entre Chrome, Firefox, Safari y Edge. El fondo usa `::backdrop` (estilos en globals.css).
 */
export function Modal({
  open,
  onClose,
  title,
  titleId = 'modal-title',
  children,
  footer,
  panelClassName = 'w-full max-w-lg',
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onDialogClose = () => onClose();
    el.addEventListener('close', onDialogClose);
    return () => el.removeEventListener('close', onDialogClose);
  }, [onClose]);

  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) ref.current?.close();
  };

  return (
    <dialog
      ref={ref}
      className={`app-modal ${panelClassName}`.trim()}
      aria-labelledby={titleId}
      aria-modal="true"
      onClick={handleDialogClick}
    >
      <div
        className="flex max-h-[min(90vh,40rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-full items-center gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div className="min-w-0 flex-1">
            {title ? (
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
            ) : (
              <span className="sr-only" id={titleId}>
                Diálogo
              </span>
            )}
          </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-700">{footer}</div>
        ) : null}
      </div>
    </dialog>
  );
}
