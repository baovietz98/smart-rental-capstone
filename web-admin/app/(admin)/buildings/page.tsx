'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import GumroadFilter, { FilterItem } from '@/components/GumroadFilter';
import { Building2, Home, Hotel, Warehouse, LayoutGrid, Loader2, Edit, Trash2, Plus } from 'lucide-react';
import axios from '@/lib/axios-client';
import { message, Form, Input } from 'antd';

// Filter definitions
const buildingFilters: FilterItem[] = [
  { id: 'all', label: 'Tất cả', icon: <LayoutGrid size={18} /> },
  { id: 'apartment', label: 'Chung cư Mini', icon: <Building2 size={18} /> },
  { id: 'house', label: 'Nhà trọ', icon: <Home size={18} /> },
  { id: 'homestay', label: 'Homestay', icon: <Hotel size={18} /> },
  { id: 'dorm', label: 'Ký túc xá', icon: <Warehouse size={18} /> },
];

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form] = Form.useForm();

  // 1. Fetch Buildings
  const fetchBuildings = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/buildings');
      setBuildings(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      message.error('Không thể tải danh sách nhà!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  // 2. Create Building
  const handleCreateBuilding = async (values: any) => {
    try {
      await axios.post('/buildings', values);
      message.success('Thêm nhà thành công! 🏡');
      setIsModalOpen(false);
      form.resetFields();
      fetchBuildings();
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi thêm nhà');
    }
  };

  // 3. Delete Building
  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await axios.delete(`/buildings/${deleteId}`);
        message.success('Đã xóa nhà thành công! 🗑️');
        fetchBuildings();
      } catch (error: any) {
        if (error.response?.status === 404) {
             message.error('Không thể xóa: Nhà này đang có phòng!');
        } else {
             message.error('Lỗi khi xóa nhà');
        }
      } finally {
        setDeleteId(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-black font-sans p-8">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1">Buildings</h1>
          <p className="text-gray-500 font-medium">Quản lý danh sách tòa nhà & khu trọ.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-black text-white border-2 border-black px-4 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none transition-all"
        >
          <Plus size={20} /> Thêm tòa nhà
        </button>
      </div>

      {/* FILTERS */}
      <div className="mb-6">
        <GumroadFilter items={buildingFilters} />
      </div>

      {/* GRID VIEW (KANBAN STYLE) */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin w-10 h-10 text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(buildings) && buildings.map((item, index) => {
            // Assign random accent color based on index
            const colors = ['border-t-[#FF4D4D]', 'border-t-[#FFC900]', 'border-t-[#4DA2FF]', 'border-t-black'];
            const accentColor = colors[index % colors.length];
            const badgeColor = index % colors.length === 0 ? 'bg-[#FF4D4D] text-white' : 
                               index % colors.length === 1 ? 'bg-[#FFC900] text-black' : 
                               index % colors.length === 2 ? 'bg-[#4DA2FF] text-white' : 'bg-black text-white';

            return (
              <div 
                key={item.id} 
                className={`bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all flex flex-col ${accentColor} border-t-[8px]`}
              >
                {/* Card Header */}
                <div className="p-5 border-b-2 border-black/5 flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight leading-none mb-2">
                      <Link href={`/rooms?buildingId=${item.id}`} className="hover:underline decoration-2 underline-offset-2">
                        {item.name}
                      </Link>
                    </h3>
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <LayoutGrid size={14} /> {item.address}
                    </p>
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 uppercase tracking-wider ${badgeColor}`}>
                    {index % 2 === 0 ? 'Active' : 'Full'}
                  </div>
                </div>

                {/* Card Body (Stats) */}
                <div className="p-5 flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-2 border border-black/10 text-center">
                      <span className="block text-xs font-bold text-gray-400 uppercase">Phòng</span>
                      <span className="text-xl font-black">{item.totalRooms}</span>
                    </div>
                    <div className="bg-green-50 p-2 border border-green-100 text-center">
                      <span className="block text-xs font-bold text-green-600 uppercase">Trống</span>
                      <span className="text-xl font-black text-green-600">{item.availableRooms}</span>
                    </div>
                    <div className="bg-blue-50 p-2 border border-blue-100 text-center">
                      <span className="block text-xs font-bold text-blue-600 uppercase">Đang ở</span>
                      <span className="text-xl font-black text-blue-600">{item.rentedRooms}</span>
                    </div>
                    <div className="bg-orange-50 p-2 border border-orange-100 text-center">
                      <span className="block text-xs font-bold text-orange-600 uppercase">Bảo trì</span>
                      <span className="text-xl font-black text-orange-600">{item.maintenanceRooms}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer (Actions) */}
                <div className="p-4 border-t-2 border-black/5 bg-gray-50 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase">ID: #{item.id}</span>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-white border border-transparent hover:border-black transition-all rounded-none">
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => setDeleteId(item.id)}
                      className="p-2 hover:bg-[#FF4D4D] hover:text-white border border-transparent hover:border-black transition-all rounded-none"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Add New Card Placeholder */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="border-2 border-dashed border-black/20 hover:border-black hover:bg-gray-50 min-h-[250px] flex flex-col items-center justify-center gap-4 transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-[#FFC900] group-hover:text-black flex items-center justify-center transition-colors">
              <Plus size={32} className="text-gray-400 group-hover:text-black" />
            </div>
            <span className="font-bold text-gray-400 group-hover:text-black uppercase tracking-wider">Thêm tòa nhà mới</span>
          </button>
        </div>
      )}

      {/* ADD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white border-2 border-black shadow-[8px_8px_0px_#000] p-8 animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border-2 border-black hover:bg-black hover:text-white transition-colors font-bold">✕</button>
            <h2 className="text-3xl font-bold mb-6 uppercase">Thêm tòa nhà mới</h2>
            
            <Form form={form} onFinish={handleCreateBuilding} layout="vertical" className="font-mono">
              <div className="mb-6">
                  <h3 className="text-lg font-bold uppercase mb-4 bg-[#FFD700] inline-block px-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
                      1. Thông tin tòa nhà
                  </h3>
                  <div className="grid gap-4">
                      <Form.Item label={<span className="font-bold text-lg">Tên tòa nhà</span>} name="name" rules={[{ required: true, message: 'Nhập tên tòa nhà!' }]}>
                        <Input className="gumroad-input" placeholder="VD: Nhà trọ Xanh" autoFocus />
                      </Form.Item>
                      
                      <Form.Item label={<span className="font-bold text-lg">Địa chỉ</span>} name="address" rules={[{ required: true, message: 'Nhập địa chỉ!' }]}>
                        <Input className="gumroad-input" placeholder="VD: 123 Đường Láng" />
                      </Form.Item>
                  </div>
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-4 border-t-2 border-black border-dashed">
                <button type="button" onClick={() => setIsModalOpen(false)} className="gumroad-btn-secondary py-2 px-4 text-base">Hủy</button>
                <button type="submit" className="gumroad-btn-primary py-2 px-4 text-base bg-[#FF90E8] hover:bg-[#FFC900]">Lưu tòa nhà</button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)}></div>
          <div className="relative w-full max-w-md bg-white border-2 border-black shadow-[8px_8px_0px_#000] p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-[#FF4D4D] border-2 border-black flex items-center justify-center text-2xl font-bold text-white shadow-[4px_4px_0px_0px_black]">!</div>
              <h2 className="text-3xl font-bold uppercase">Xóa tòa nhà này?</h2>
            </div>
            
            <p className="text-lg font-medium mb-8 border-l-4 border-[#FF4D4D] pl-4">
              Hành động này không thể hoàn tác. Bạn chỉ có thể xóa khi tòa nhà KHÔNG CÒN PHÒNG nào.
            </p>

            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setDeleteId(null)}
                className="gumroad-btn-secondary py-2 px-4 text-base"
              >
                HỦY
              </button>
              <button 
                onClick={confirmDelete}
                className="bg-[#FF4D4D] text-white border-2 border-black px-6 py-2 font-bold shadow-[4px_4px_0px_0px_black] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all uppercase"
              >
                XÓA NGAY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}