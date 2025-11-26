'use client';
import { useState } from 'react';

export interface FilterItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface GumroadFilterProps {
  items: FilterItem[];
  onFilterChange?: (id: string) => void;
}

export default function GumroadFilter({ items, onFilterChange }: GumroadFilterProps) {
  const [active, setActive] = useState(items[0]?.id || 'all');

  const handleFilterClick = (id: string) => {
    setActive(id);
    if (onFilterChange) onFilterChange(id);
  };

  return (
    <div className="flex gap-6 overflow-x-auto py-4 mb-6 scrollbar-hide px-1">
      {items.map((f) => (
        <button
          key={f.id}
          onClick={() => handleFilterClick(f.id)}
          className={`
            flex items-center gap-3 px-6 py-3 
            border-2 border-black rounded-full 
            font-bold whitespace-nowrap transition-all
            ${active === f.id 
              ? 'bg-[#FFD6F5] shadow-[4px_4px_0px_0px_black] -translate-y-1' // Active: Pastel Pink + Hard Shadow
              : 'bg-white hover:shadow-[4px_4px_0px_0px_black] hover:-translate-y-1' // Inactive: Pop up effect
            }
          `}
        >
          <span>{f.icon}</span>
          <span>{f.label}</span>
        </button>
      ))}
    </div>
  );
}
