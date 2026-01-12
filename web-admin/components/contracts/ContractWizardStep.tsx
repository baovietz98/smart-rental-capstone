"use client";

import React from "react";
import { CheckCircle } from "lucide-react";

export const ContractWizardStep = ({
  current,
  index,
  icon,
  title,
}: {
  current: number;
  index: number;
  icon: React.ReactNode;
  title: string;
}) => {
  const isActive = current === index;
  const isCompleted = current > index;

  return (
    <div
      className={`flex items-center gap-3 relative ${
        isActive ? "opacity-100" : isCompleted ? "opacity-100" : "opacity-60"
      }`}
    >
      <div
        className={`
            w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10 bg-white
            ${
              isActive
                ? "border-[#D97757] text-[#D97757] shadow-lg shadow-orange-100"
                : isCompleted
                ? "border-green-500 bg-green-50 text-green-600"
                : "border-gray-200 text-gray-400"
            }
        `}
      >
        {isCompleted ? <CheckCircle size={20} /> : icon}
      </div>
      <div className="flex flex-col">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${
            isActive ? "text-[#D97757]" : "text-gray-400"
          }`}
        >
          Step {index + 1}
        </span>
        <span
          className={`text-sm font-bold ${
            isActive ? "text-gray-900" : "text-gray-500"
          }`}
        >
          {title}
        </span>
      </div>
    </div>
  );
};

export default ContractWizardStep;
