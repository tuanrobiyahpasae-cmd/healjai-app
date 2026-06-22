import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Info, AlertTriangle, BellRing, X, Sparkles } from 'lucide-react';
import { ToastItem } from '../types';

interface ToastItemInternal extends ToastItem {
  duration: number;
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItemInternal[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        message: string;
        type: ToastItem['type'];
        description?: string;
        duration?: number;
      }>;

      if (!customEvent.detail) return;

      const { message, type, description, duration } = customEvent.detail;
      const newToast: ToastItemInternal = {
        id: Math.random().toString(36).substring(2, 9),
        message,
        type,
        description,
        duration: duration || 4000,
      };

      // Limit to max 3 toasts on screen to prevent piling up
      setToasts((prev) => [...prev.slice(-2), newToast]);
    };

    window.addEventListener('healjai_toast', handleToastEvent);
    return () => {
      window.removeEventListener('healjai_toast', handleToastEvent);
    };
  }, []);

  const handleClose = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div 
      id="healjai-toast-container" 
      className="absolute top-14 left-4 right-4 z-50 pointer-events-none flex flex-col gap-2 max-w-sm mx-auto"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastCard 
            key={toast.id} 
            toast={toast} 
            onClose={handleClose} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastCardProps {
  key?: string;
  toast: ToastItemInternal;
  onClose: (id: string) => void;
}

function ToastCard({ toast, onClose }: ToastCardProps) {
  const { id, message, description, type, duration } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  // Styles map based on type
  const typeStyles = {
    success: {
      bg: 'bg-white/95 border-emerald-100 shadow-lg shadow-emerald-500/5',
      iconBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-600 border border-emerald-200/40',
      icon: CheckCircle2,
      text: 'text-emerald-950 font-black',
      descText: 'text-emerald-800/80',
      accentBar: 'bg-gradient-to-b from-emerald-400 to-emerald-600',
      progressBg: 'bg-emerald-500',
    },
    info: {
      bg: 'bg-white/95 border-emerald-100 shadow-lg shadow-emerald-500/5',
      iconBg: 'bg-gradient-to-br from-[#EEFDF7] to-[#DDF7ED] text-[#1C4E44] border border-[#C6ECD2]/40',
      icon: Sparkles,
      text: 'text-[#1C4E44] font-black',
      descText: 'text-[#2A5950]/80',
      accentBar: 'bg-gradient-to-b from-emerald-400 to-[#1C4E44]',
      progressBg: 'bg-[#1C4E44]',
    },
    warning: {
      bg: 'bg-white/95 border-amber-100 shadow-lg shadow-amber-500/5',
      iconBg: 'bg-gradient-to-br from-amber-50 to-amber-100/50 text-amber-600 border border-amber-200/40',
      icon: AlertTriangle,
      text: 'text-amber-950 font-black',
      descText: 'text-amber-800/80',
      accentBar: 'bg-gradient-to-b from-amber-400 to-amber-600',
      progressBg: 'bg-amber-500',
    },
    alarm: {
      bg: 'bg-white/95 border-rose-100 shadow-lg shadow-rose-500/5',
      iconBg: 'bg-gradient-to-br from-rose-50 to-rose-100/50 text-rose-600 border border-rose-200/40',
      icon: BellRing,
      text: 'text-rose-950 font-black',
      descText: 'text-rose-800/80',
      accentBar: 'bg-gradient-to-b from-rose-400 to-rose-600',
      progressBg: 'bg-rose-500',
    },
  };

  const style = typeStyles[type] || typeStyles.info;
  const IconComponent = style.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -5, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', damping: 22, stiffness: 380 }}
      className={`pointer-events-auto w-full p-4 rounded-[24px] border flex gap-3.5 items-start relative backdrop-blur-md overflow-hidden transition-all ${style.bg}`}
    >
      {/* Dynamic gradients side indicator pill */}
      <div className={`absolute left-0 top-0 bottom-0 w-[5px] ${style.accentBar}`} />

      {/* Decorative background glow matching toast sentiment */}
      <div className="absolute right-0 top-0 w-24 h-24 rounded-full filter blur-2xl opacity-[0.03] pointer-events-none -mr-4 -mt-4 bg-emerald-500" />

      {/* Elegant high-contrast rounded-2xl icon container */}
      <div className={`p-2.5 rounded-2xl shrink-0 flex items-center justify-center ${style.iconBg}`}>
        <IconComponent className="w-4 h-4 animate-pulse shrink-0" />
      </div>

      {/* Notification Text and Meta layout */}
      <div className="flex-1 min-w-0 pr-5 space-y-1">
        <h4 className={`text-[11.5px] leading-tight font-black tracking-tight ${style.text}`}>
          {message}
        </h4>
        {description && (
          <p className={`text-[10px] leading-relaxed font-bold font-sans ${style.descText}`}>
            {description}
          </p>
        )}
      </div>

      {/* Close button containing hover micro-rotations */}
      <button
        onClick={() => onClose(id)}
        className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-150/40 p-1.5 transition-all cursor-pointer group"
      >
        <X className="w-3.5 h-3.5 transition-transform group-hover:rotate-90 duration-200" />
      </button>

      {/* Progress timeline counting down the toast expiry at the base */}
      <motion.div 
        initial={{ width: '100%' }}
        animate={{ width: 0 }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-[3px] opacity-80 ${style.progressBg}`}
      />
    </motion.div>
  );
}
