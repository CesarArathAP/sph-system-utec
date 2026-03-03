import React, { useState, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

const ICON_CONFIG: Record<ToastType, { icon: React.ElementType; bg: string; border: string; icon_color: string }> = {
  success: { icon: CheckCircle, bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon_color: 'text-emerald-400' },
  error: { icon: AlertCircle, bg: 'bg-red-500/10', border: 'border-red-500/20', icon_color: 'text-red-400' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon_color: 'text-amber-400' },
  info: { icon: Info, bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon_color: 'text-blue-400' },
};

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  const config = ICON_CONFIG[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(onClose, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  return (
    <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl ${config.bg} border ${config.border} backdrop-blur-xl shadow-lg animate-in slide-in-from-top-2 fade-in duration-300`}>
      <Icon size={20} className={`shrink-0 mt-0.5 ${config.icon_color}`} strokeWidth={2.5} />
      <div className="min-w-0 flex-1">
        <p className={`font-black text-sm ${config.icon_color.replace('text-', 'text-').replace('400', '300')}`}>
          {toast.title}
        </p>
        {toast.message && <p className="text-xs text-white/70 mt-1">{toast.message}</p>}
      </div>
      <button
        onClick={onClose}
        className="shrink-0 p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
      >
        <X size={16} strokeWidth={3} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] space-y-3 max-w-md pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
}

export function showToast(type: ToastType, title: string, message?: string) {
  // Esta función se llama de forma global si es necesario
  // Pero lo recomendado es usar el hook useToast()
  const context = React.useContext(ToastContext);
  if (context) {
    context.addToast({ type, title, message, duration: 4000 });
  }
}
