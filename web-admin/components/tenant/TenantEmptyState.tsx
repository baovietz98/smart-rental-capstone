"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "antd";
import { useRouter } from "next/navigation";

interface TenantEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
  secondaryAction?: React.ReactNode;
}

export default function TenantEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionLink,
  secondaryAction,
}: TenantEmptyStateProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100 relative group overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-transparent opacity-50" />
        <Icon
          size={36}
          className="text-slate-400 relative z-10 group-hover:scale-110 group-hover:text-indigo-400 transition-all duration-300"
          strokeWidth={1.5}
        />
      </div>

      <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">
        {title}
      </h3>

      <p className="text-slate-500 text-sm max-w-xs mb-8 leading-relaxed">
        {description}
      </p>

      <div className="flex flex-col gap-3 w-full max-w-[200px]">
        {actionLabel && actionLink && (
          <Button
            type="primary"
            size="large"
            onClick={() => router.push(actionLink)}
            className="bg-slate-900 hover:!bg-indigo-600 h-11 rounded-xl shadow-lg border-none text-sm font-bold"
          >
            {actionLabel}
          </Button>
        )}

        {secondaryAction}
      </div>
    </div>
  );
}
