"use client";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({ isOpen, onClose, title, description, children, footer, size = "md", className }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative w-full bg-white rounded-lg shadow-modal flex flex-col max-h-[90vh]",
              sizes[size],
              className
            )}
          >
            {/* Header */}
            {(title || description) && (
              <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
                {title && <h2 className="text-lg font-semibold text-slate-900 leading-tight">{title}</h2>}
                {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
              </div>
            )}
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition-all"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            {/* Content */}
            <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">{children}</div>
            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message?: string;
  description?: string;
  confirmLabel?: string;
  variant?: "primary" | "danger";
  confirmVariant?: "primary" | "danger";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmLabel = "Confirm",
  variant,
  confirmVariant = "danger",
  isLoading,
}: ConfirmModalProps) {
  const resolvedVariant = variant ?? confirmVariant;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={message ?? description} size="sm">
      <div className="flex justify-end gap-3 mt-2">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant={resolvedVariant} onClick={onConfirm} isLoading={isLoading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
