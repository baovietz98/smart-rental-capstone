"use client";

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Download
} from 'lucide-react';
import { message } from 'antd';
import axiosClient from '@/lib/axios-client';
import dayjs from 'dayjs';

interface Transaction {
  id: number;
  code: string;
  amount: number;
  type: 'DEPOSIT' | 'INVOICE_PAYMENT' | 'EXPENSE' | 'OTHER';
  date: string;
  note: string;
  contract?: {
    room?: {
      name: string;
    };
    tenant?: {
      name: string;
    }
  };
}

interface Stats {
  income: number;
  expense: number;
  net: number;
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({ income: 0, expense: 0, net: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [txRes, statsRes] = await Promise.all([
        axiosClient.get('/transactions', { params: { take: 20 } }), // Get latest 20
        axiosClient.get('/transactions/stats')
      ]);
      
      setTransactions(txRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch finance data:', error);
      message.error('Không thể tải dữ liệu tài chính');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  return (
    <div className="claude-page p-6 md:p-12 transition-all">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl claude-header mb-3">Financial Overview</h1>
            <p className="text-gray-500 font-sans text-lg">Track revenue, expenses, and net profit.</p>
          </div>
          <div className="flex gap-3">
             <button className="claude-btn-secondary flex items-center gap-2">
                <Calendar size={18} />
                <span>This Month</span>
             </button>
             <button className="claude-btn-secondary flex items-center gap-2">
                <Download size={18} />
                <span className="hidden md:inline">Export Report</span>
             </button>
          </div>
        </header>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           {/* Income Card */}
           <div className="claude-card p-8 flex flex-col justify-between h-48 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                 <TrendingUp size={80} color="#137333" />
              </div>
              <div>
                 <p className="text-gray-500 font-medium mb-1 uppercase tracking-wide text-sm">Total Income</p>
                 <h2 className="text-3xl font-bold claude-header text-[#137333]">{formatCurrency(stats.income)}</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#137333] font-medium bg-[#E6F4EA] w-fit px-3 py-1 rounded-full">
                 <ArrowUpRight size={16} />
                 <span>+12.5% vs last month</span>
              </div>
           </div>

           {/* Expense Card */}
           <div className="claude-card p-8 flex flex-col justify-between h-48 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                 <TrendingDown size={80} color="#C5221F" />
              </div>
              <div>
                 <p className="text-gray-500 font-medium mb-1 uppercase tracking-wide text-sm">Total Expenses</p>
                 <h2 className="text-3xl font-bold claude-header text-[#C5221F]">{formatCurrency(stats.expense)}</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#C5221F] font-medium bg-[#FCE8E6] w-fit px-3 py-1 rounded-full">
                 <ArrowUpRight size={16} /> {/* Up is bad for expense, usually */}
                 <span>+2.1% higher</span>
              </div>
           </div>

           {/* Net Profit Card */}
           <div className="claude-card p-8 flex flex-col justify-between h-48 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                 <DollarSign size={80} color="#B06000" />
              </div>
              <div>
                 <p className="text-gray-500 font-medium mb-1 uppercase tracking-wide text-sm">Net Profit</p>
                 <h2 className="text-3xl font-bold claude-header text-[#2D2D2C]">{formatCurrency(stats.net)}</h2>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                 <div className="bg-[#D97757] h-full rounded-full" style={{ width: '70%' }}></div>
              </div>
           </div>
        </div>

        {/* Transactions Section */}
        <div className="flex flex-col gap-6">
           <div className="flex justify-between items-center">
              <h2 className="text-2xl claude-header">Recent Transactions</h2>
              <button className="text-[#D97757] font-medium hover:text-[#C06040] transition-colors">View All</button>
           </div>
           
           <div className="bg-white/50 border border-[#E5E5E0] rounded-2xl overflow-hidden shadow-sm backdrop-blur-sm">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b border-[#E5E5E0] bg-[#F4F4F0]/50 text-gray-500 text-sm font-medium">
                       <th className="p-4 pl-6 font-normal">Transaction</th>
                       <th className="p-4 font-normal">Date</th>
                       <th className="p-4 font-normal">Amount</th>
                       <th className="p-4 font-normal">Type</th>
                       <th className="p-4 pr-6 font-normal">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[#E5E5E0]">
                    {loading ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading data...</td></tr>
                    ) : transactions.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-400">No transactions recorded.</td></tr>
                    ) : (
                        transactions.map((tx) => (
                           <tr key={tx.id} className="hover:bg-white/80 transition-colors group">
                              <td className="p-4 pl-6">
                                 <div className="font-semibold text-[#2D2D2C]">{tx.note || tx.code}</div>
                                 <div className="text-xs text-gray-400 font-mono mt-0.5">{tx.code}</div>
                              </td>
                              <td className="p-4 text-gray-600 text-sm">
                                 {dayjs(tx.date).format('MMM D, YYYY')}
                              </td>
                              <td className={`p-4 font-medium font-mono ${
                                 tx.type === 'EXPENSE' || tx.type === 'OTHER' ? 'text-[#C5221F]' : 'text-[#137333]'
                              }`}>
                                 {tx.type === 'EXPENSE' || tx.type === 'OTHER' ? '-' : '+'}{formatCurrency(tx.amount)}
                              </td>
                              <td className="p-4">
                                 <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {tx.type.replace('_', ' ')}
                                 </span>
                              </td>
                              <td className="p-4 pr-6">
                                 <span className="flex items-center gap-1.5 text-xs font-semibold text-[#137333]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#137333]"></div>
                                    Completed
                                 </span>
                              </td>
                           </tr>
                        ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
}
