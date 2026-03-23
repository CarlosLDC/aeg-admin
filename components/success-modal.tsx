'use client';

import { useEffect } from 'react';

export type SuccessModalProps = {
  open: boolean;
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

/**
 * Modal de confirmación tras crear un registro (servicio / inspección).
 */
export function SuccessModal({
  open,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel = 'Cerrar',
  onSecondary,
}: SuccessModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') (onSecondary ?? onPrimary)();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onPrimary, onSecondary]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="success-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
          <button
            type="button"
            onClick={onSecondary ?? onPrimary}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {secondaryLabel}
          </button>
          <button
            type="button"
            onClick={onPrimary}
            className="px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
