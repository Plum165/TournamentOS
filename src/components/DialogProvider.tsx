import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info, HelpCircle } from 'lucide-react';

interface DialogOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface DialogContextType {
  alert: (message: string, options?: DialogOptions) => Promise<void>;
  confirm: (message: string, options?: DialogOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

interface DialogState {
  isOpen: boolean;
  message: string;
  title: string;
  type: 'alert' | 'confirm';
  confirmLabel: string;
  cancelLabel: string;
  resolve?: (value: any) => void;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>({
    isOpen: false,
    message: '',
    title: '',
    type: 'alert',
    confirmLabel: 'OK',
    cancelLabel: 'Cancel',
  });

  const alert = (message: string, options?: DialogOptions) => {
    return new Promise<void>((resolve) => {
      setState({
        isOpen: true,
        message,
        title: options?.title || 'Notice',
        type: 'alert',
        confirmLabel: options?.confirmLabel || 'OK',
        cancelLabel: '',
        resolve: () => {
          resolve();
        },
      });
    });
  };

  const confirm = (message: string, options?: DialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({
        isOpen: true,
        message,
        title: options?.title || 'Confirmation Required',
        type: 'confirm',
        confirmLabel: options?.confirmLabel || 'Confirm',
        cancelLabel: options?.cancelLabel || 'Cancel',
        resolve: (val: boolean) => {
          resolve(val);
        },
      });
    });
  };

  const handleConfirm = () => {
    if (state.resolve) {
      state.resolve(true);
    }
    setState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    if (state.resolve) {
      state.resolve(false);
    }
    setState((prev) => ({ ...prev, isOpen: false }));
  };

  // Determine if this is a destructive action (delete, reset, clear, erase, remove, purge)
  const isDestructive = 
    state.message.toLowerCase().includes('delete') ||
    state.message.toLowerCase().includes('erase') ||
    state.message.toLowerCase().includes('reset') ||
    state.message.toLowerCase().includes('clear') ||
    state.message.toLowerCase().includes('remove') ||
    state.message.toLowerCase().includes('purge');

  return (
    <DialogContext.Provider value={{ alert, confirm }}>
      {children}
      <AnimatePresence>
        {state.isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={state.type === 'confirm' ? handleCancel : handleConfirm}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm cursor-pointer"
            />

            {/* Modal Dialog Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 select-none"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                  isDestructive 
                    ? 'bg-red-500/10 text-red-400' 
                    : state.type === 'confirm' 
                      ? 'bg-amber-500/10 text-amber-400' 
                      : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {isDestructive ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : state.type === 'confirm' ? (
                    <HelpCircle className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    {state.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {state.message}
                  </p>
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex items-center gap-2.5 mt-2 justify-end">
                {state.type === 'confirm' && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-transparent hover:bg-white/5 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {state.cancelLabel}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    isDestructive
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/10'
                      : 'bg-[var(--accent)] text-slate-950 hover:brightness-110 shadow-lg shadow-[var(--accent)]/10'
                  }`}
                >
                  {state.confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
}
