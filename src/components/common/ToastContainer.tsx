"use client";

import { useState, useEffect } from "react";
import { useUIStore } from "@/store/useUIStore";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ToastContainer() {
  const [mounted, setMounted] = useState(false);
  const { toasts, removeToast } = useUIStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 sm:top-6 sm:right-6 sm:left-auto left-3 right-3 z-50 flex flex-col gap-2 max-w-sm sm:w-auto pointer-events-none mx-auto">
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error";
        const isWarning = toast.type === "warning";

        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-center justify-between p-3.5 sm:p-4 rounded-xl shadow-xl border text-xs sm:text-sm bg-white backdrop-blur-md transition-all duration-300 animate-fadeIn",
              isSuccess && "border-df-success/50 text-ink-900",
              isError && "border-accent-red/50 text-ink-900",
              isWarning && "border-amber-500/50 text-ink-900",
              toast.type === "info" && "border-blue-500/50 text-ink-900"
            )}
          >
            <div className="flex items-center gap-2.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-df-success flex-shrink-0" />}
              {isError && <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-accent-red flex-shrink-0" />}
              {isWarning && <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />}
              {toast.type === "info" && <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />}
              <span className="font-medium tracking-tight text-ink-900 leading-snug">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:opacity-70 transition-opacity ml-2 flex-shrink-0 text-ink-400 hover:text-ink-900"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
