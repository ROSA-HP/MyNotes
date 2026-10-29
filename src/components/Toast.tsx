import React from 'react';

export interface ToastData {
  id: string;
  message: string;
  onUndo?: () => void;
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  return (
    <div
      id="ts"
      className="fixed z-50 left-1/2 -translate-x-1/2 bottom-20 flex items-center gap-3 px-4 py-2.5 rounded-full border shadow-2xl backdrop-blur-md anim-bl text-xs"
      style={{
        backgroundColor: 'var(--sf2)',
        borderColor: 'var(--bd)',
        color: 'var(--tx)',
      }}
    >
      <span className="font-medium">{toast.message}</span>
      {toast.onUndo && (
        <button
          onClick={() => {
            toast.onUndo?.();
            onDismiss();
          }}
          className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm hover:brightness-110 transition-colors"
          style={{
            backgroundColor: 'var(--br)',
          }}
        >
          Undo
        </button>
      )}
    </div>
  );
};
