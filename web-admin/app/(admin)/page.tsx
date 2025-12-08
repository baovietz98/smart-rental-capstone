'use client';

import { 
  TrendingUp, 
  Users, 
  Home, 
  AlertCircle, 
  MoreHorizontal,
  FileText,
  Building2,
  Loader2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from '@/lib/axios-client';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBuildings: 0,
    emptyRooms: 0,
    issues: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/buildings');
        const data = Array.isArray(res.data) ? res.data : [];
        
        const totalRevenue = data.reduce((sum: number, item: any) => sum + (item.totalRevenue || 0), 0);
        const totalBuildings = data.length;
        const emptyRooms = data.reduce((sum: number, item: any) => sum + (item.availableRooms || 0), 0);
        const issues = data.reduce((sum: number, item: any) => sum + (item.maintenanceRooms || 0), 0);

        setStats({ totalRevenue, totalBuildings, emptyRooms, issues });
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-end border-b-2 border-black pb-6">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Dashboard Tổng Quan</h1>
          <p className="text-gray-600 font-medium">Chào mừng trở lại, Admin! 👋</p>
        </div>
        <div className="text-sm font-bold bg-white border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_black]">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Doanh thu */}
        <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_#FF90E8] hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#FF90E8] border-2 border-black rounded-none">
              <TrendingUp size={24} className="text-black" />
            </div>
            <span className="text-xs font-black bg-black text-white px-2 py-0.5">+12.5%</span>
          </div>
          <p className="text-gray-600 text-sm font-bold uppercase mb-1">Tổng Doanh Thu</p>
          <h3 className="text-2xl font-black truncate" title={formatCurrency(stats.totalRevenue)}>
            {stats.totalRevenue > 1000000 
              ? `${(stats.totalRevenue / 1000000).toFixed(1)}M` 
              : formatCurrency(stats.totalRevenue).replace('₫', '')} 
            <span className="text-base font-bold text-gray-500 ml-1">VNĐ</span>
          </h3>
        </div>

        {/* Card 2: Tòa nhà */}
        <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_#4DA2FF] hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#4DA2FF] border-2 border-black rounded-none">
              <Building2 size={24} className="text-white" />
            </div>
            <span className="text-xs font-black bg-black text-white px-2 py-0.5">Quản lý</span>
          </div>
          <p className="text-gray-600 text-sm font-bold uppercase mb-1">Tòa nhà</p>
          <h3 className="text-3xl font-black">{stats.totalBuildings} <span className="text-base font-bold text-gray-500">Tòa</span></h3>
        </div>

        {/* Card 3: Phòng trống */}
        <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_#00FF94] hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#00FF94] border-2 border-black rounded-none">
              <Home size={24} className="text-black" />
            </div>
            <span className="text-xs font-black bg-black text-white px-2 py-0.5">Mới</span>
          </div>
          <p className="text-gray-600 text-sm font-bold uppercase mb-1">Phòng trống</p>
          <h3 className="text-3xl font-black">{stats.emptyRooms} <span className="text-base font-bold text-gray-500">Phòng</span></h3>
        </div>

        {/* Card 4: Sự cố */}
        <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_#FF4D4D] hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#FF4D4D] border-2 border-black rounded-none">
              <AlertCircle size={24} className="text-white" />
            </div>
            <span className="text-xs font-black bg-red-100 text-red-600 border border-red-600 px-2 py-0.5">Cần xử lý</span>
          </div>
          <p className="text-gray-600 text-sm font-bold uppercase mb-1">Sự cố / Báo hỏng</p>
          <h3 className="text-3xl font-black">{stats.issues}</h3>
        </div>
      </div>

      {/* ROW 2: CHARTS & LISTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CHART SECTION (2/3) */}
        <div className="lg:col-span-2 bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_black]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black uppercase">Doanh thu 6 tháng</h3>
            <button className="p-1 hover:bg-gray-100 border border-transparent hover:border-black transition-all">
              <MoreHorizontal size={20} />
            </button>
          </div>
          
          {/* Custom CSS Chart Placeholder */}
          <div className="flex gap-4 h-64 items-end">
            {/* Y-Axis */}
            <div className="flex flex-col justify-between h-full pb-8 text-xs font-bold text-gray-400 text-right w-8">
              <span>25M</span>
              <span>20M</span>
              <span>15M</span>
              <span>10M</span>
              <span>5M</span>
              <span>0</span>
            </div>
            
            {/* Chart Area */}
            <div className="flex-1 h-full flex items-end justify-between gap-2 px-4 pb-4 border-l-2 border-b-2 border-black bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]">
              {/* Bar 1 */}
              <div className="w-full bg-[#FF90E8] border-2 border-black relative group hover:bg-[#ff70e0] transition-all" style={{ height: '40%' }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">15M</div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold">T6</div>
              </div>
              {/* Bar 2 */}
              <div className="w-full bg-[#FF90E8] border-2 border-black relative group hover:bg-[#ff70e0] transition-all" style={{ height: '55%' }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">18M</div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold">T7</div>
              </div>
              {/* Bar 3 */}
              <div className="w-full bg-[#FF90E8] border-2 border-black relative group hover:bg-[#ff70e0] transition-all" style={{ height: '45%' }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">16M</div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold">T8</div>
              </div>
              {/* Bar 4 */}
              <div className="w-full bg-[#FF90E8] border-2 border-black relative group hover:bg-[#ff70e0] transition-all" style={{ height: '70%' }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">22M</div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold">T9</div>
              </div>
              {/* Bar 5 */}
              <div className="w-full bg-[#FF90E8] border-2 border-black relative group hover:bg-[#ff70e0] transition-all" style={{ height: '65%' }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">20M</div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold">T10</div>
              </div>
              {/* Bar 6 */}
              <div className="w-full bg-[#FFC900] border-2 border-black relative group hover:bg-[#ffb000] transition-all" style={{ height: '85%' }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">24.5M</div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold">T11</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: QUICK ACTIONS & RECENT ACTIVITY */}
        <div className="space-y-8">
          {/* QUICK ACTIONS */}
          <div className="bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_black]">
            <h3 className="text-xl font-black uppercase mb-6">Hành động nhanh</h3>
            <div className="space-y-3">
              <button className="w-full bg-[#4DA2FF] text-white border-2 border-black py-3 font-bold shadow-[4px_4px_0px_0px_black] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all flex items-center justify-center gap-3">
                <Building2 size={20} /> Thêm tòa nhà
              </button>
              <button className="w-full bg-white text-black border-2 border-black py-3 font-bold shadow-[4px_4px_0px_0px_black] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all flex items-center justify-center gap-3">
                <FileText size={20} /> Tạo hóa đơn
              </button>
              <button className="w-full bg-white text-black border-2 border-black py-3 font-bold shadow-[4px_4px_0px_0px_black] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all flex items-center justify-center gap-3">
                <Users size={20} /> Thêm khách thuê
              </button>
              <button className="w-full bg-white text-black border-2 border-black py-3 font-bold shadow-[4px_4px_0px_0px_black] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all flex items-center justify-center gap-3">
                <AlertCircle size={20} /> Xem sự cố
              </button>
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div className="bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_black]">
            <h3 className="text-xl font-black uppercase mb-6">Hoạt động gần đây</h3>
          
          <div className="space-y-4">
            {/* Item 1 */}
            <div className="flex gap-3 items-start pb-4 border-b border-gray-200">
              <div className="w-2 h-2 mt-2 bg-green-500 rounded-full shrink-0"></div>
              <div>
                <p className="text-sm font-bold">Nguyễn Văn A <span className="font-normal text-gray-600">vừa thanh toán tiền phòng</span> P.101</p>
                <span className="text-xs text-gray-400 font-mono">2 phút trước</span>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex gap-3 items-start pb-4 border-b border-gray-200">
              <div className="w-2 h-2 mt-2 bg-red-500 rounded-full shrink-0"></div>
              <div>
                <p className="text-sm font-bold">P.202 <span className="font-normal text-gray-600">báo hỏng điều hòa</span></p>
                <span className="text-xs text-gray-400 font-mono">1 giờ trước</span>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex gap-3 items-start pb-4 border-b border-gray-200">
              <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full shrink-0"></div>
              <div>
                <p className="text-sm font-bold">Hợp đồng mới <span className="font-normal text-gray-600">được tạo cho</span> Trần Thị B</p>
                <span className="text-xs text-gray-400 font-mono">3 giờ trước</span>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex gap-3 items-start">
              <div className="w-2 h-2 mt-2 bg-yellow-500 rounded-full shrink-0"></div>
              <div>
                <p className="text-sm font-bold">Hệ thống <span className="font-normal text-gray-600">đã sao lưu dữ liệu</span></p>
                <span className="text-xs text-gray-400 font-mono">1 ngày trước</span>
              </div>
            </div>
          </div>
          
          <button className="w-full mt-6 py-2 text-sm font-bold border-2 border-black hover:bg-black hover:text-white transition-colors">
            Xem tất cả
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
