"use client";

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { message, Modal, Form, Input, Select, Button } from 'antd';
import axiosClient from '@/lib/axios-client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

enum IssueStatus {
  OPEN = 'OPEN',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
}

interface Issue {
  id: number;
  title: string;
  description: string;
  status: IssueStatus;
  roomId: number;
  createdAt: string;
  room?: {
    name: string;
    building?: {
      name: string;
    };
  };
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    fetchIssues();
  }, [filterStatus]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus !== 'ALL') params.status = filterStatus;
      
      const res = await axiosClient.get('/issues', { params });
      setIssues(res.data);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
      message.error('Không thể tải danh sách sự cố');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case IssueStatus.OPEN:
        return <span className="claude-badge claude-badge-red flex items-center gap-1"><AlertCircle size={12} /> Open</span>;
      case IssueStatus.PROCESSING:
        return <span className="claude-badge claude-badge-orange flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Processing</span>;
      case IssueStatus.DONE:
        return <span className="claude-badge claude-badge-green flex items-center gap-1"><CheckCircle2 size={12} /> Resolved</span>;
      default:
        return <span className="claude-badge bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="claude-page p-6 md:p-12 transition-all">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl claude-header mb-3">Issues Tracking</h1>
            <p className="text-gray-500 font-sans text-lg">Manage and resolve reported issues efficiently.</p>
          </div>
          <button className="claude-btn-primary flex items-center gap-2 group">
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            <span>Report Issue</span>
          </button>
        </header>
        
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
           <div className="flex bg-white rounded-lg p-1 border border-[#E5E5E0] shadow-sm">
              {['ALL', 'OPEN', 'PROCESSING', 'DONE'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    filterStatus === s 
                    ? 'bg-[#F4F4F0] text-[#2D2D2C] shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
           </div>

           <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                 type="text" 
                 placeholder="Search issues..." 
                 className="pl-10 pr-4 py-2 rounded-lg border border-[#E5E5E0] bg-white focus:outline-none focus:ring-2 focus:ring-[#D97757]/20 w-full md:w-64 transition-all"
              />
           </div>
        </div>

        {/* Issue List */}
        <div className="grid gap-4">
          {loading ? (
             <div className="py-20 text-center text-gray-400">Loading issues...</div>
          ) : issues.length === 0 ? (
             <div className="py-20 text-center text-gray-400 bg-white/50 rounded-2xl border border-dashed border-gray-200">
                <p>No issues found.</p>
             </div>
          ) : (
            issues.map((issue) => (
              <div key={issue.id} className="claude-card p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center group cursor-pointer hover:bg-white/90">
                <div className="flex-1">
                   <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[#2D2D2C] font-sans group-hover:text-[#D97757] transition-colors">
                        {issue.title}
                      </h3>
                      {getStatusBadge(issue.status)}
                   </div>
                   <p className="text-gray-600 mb-3 line-clamp-2 md:line-clamp-1">{issue.description}</p>
                   
                   <div className="flex items-center gap-6 text-sm text-gray-400">
                      <div className="flex items-center gap-1.5">
                         <MapPin size={14} />
                         <span>{issue.room?.building?.name} - {issue.room?.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <Clock size={14} />
                         <span>{dayjs(issue.createdAt).fromNow()}</span>
                      </div>
                   </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                      <MoreHorizontal size={20} />
                   </button>
                   <button className="hidden md:block claude-btn-secondary text-sm">
                      View Details
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
