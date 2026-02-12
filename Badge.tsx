
import React from 'react';

interface BadgeProps {
  // Made children optional to fix "Property 'children' is missing" errors across the app
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge = ({ children, variant = 'default' }: BadgeProps) => {
  const styles: Record<string, string> = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-[#ecfdf5] text-[#10b981] border border-[#d1fae5]',
    warning: 'bg-[#fffbeb] text-[#f59e0b] border border-[#fef3c7]',
    danger: 'bg-[#fef2f2] text-[#ef4444] border border-[#fee2e2]',
    info: 'bg-[#f0f9ff] text-[#0ea5e9] border border-[#e0f2fe]',
  };
  return (
    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 inline-flex ${styles[variant]}`}>
      <span className="w-1 h-1 rounded-full bg-current opacity-70" /> {children}
    </span>
  );
};
