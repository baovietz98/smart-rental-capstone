"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { MenuOutlined } from "@ant-design/icons";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--bg-page)] relative">
      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <MenuOutlined className="text-xl" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#D97757] rounded-lg flex items-center justify-center">
              <span className="text-white font-serif font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#333333]">
              CAMEL<span className="text-[#888888] font-normal">STAY</span>
            </span>
          </div>
        </div>
      </div>

      {/* SIDEBAR */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* MAIN CONTENT */}
      {/* 
          - Mobile: pt-16 (for header), p-4 (content padding)
          - Desktop: ml-64 (sidebar space), p-12 (content padding), no top padding needed if sidebar handles it or header 
      */}
      <main className="flex-1 w-full md:ml-64 p-4 pt-20 md:p-12 transition-all duration-300">
        {children}
      </main>

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
