'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import GumroadFilter, { FilterItem } from '@/components/GumroadFilter';
import { Building2, Home, Hotel, Warehouse, LayoutGrid, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen bg-[var(--bg-page)] text-black p-8 font-sans">
      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-12 flex justify-between items-end border-b-4 border-black pb-6">
        <div>
          <h1 className="text-6xl font-bold tracking-tight mb-2">Buildings</h1>
          <p className="text-xl font-medium text-gray-600">Quản lý danh sách tòa nhà & khu trọ.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#FFC900] border-2 border-black px-6 py-3 font-bold text-xl shadow-[4px_4px_0px_0px_black] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all"
        >
          <span className="text-2xl leading-none">+</span> Thêm tòa nhà
        </button>
      </div>

      {/* FILTERS */}
      <div className="max-w-6xl mx-auto mb-8">
        <GumroadFilter items={buildingFilters} />
      </div>

      {/* TABLE */}
      <div className="max-w-6xl mx-auto">
        <div className="gumroad-card p-0 overflow-hidden">
          {loading ? (
             <div className="p-12 flex justify-center items-center">
                <Loader2 className="animate-spin w-10 h-10" />
             </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black text-white border-b-2 border-black">
                  <th className="p-6 text-xl font-bold uppercase tracking-wider border-r-2 border-white/20">Tên tòa nhà</th>
                  <th className="p-6 text-xl font-bold uppercase tracking-wider border-r-2 border-white/20">Địa chỉ</th>
                  <th className="p-6 text-xl font-bold uppercase tracking-wider border-r-2 border-white/20">Số phòng</th>
                  <th className="p-6 text-xl font-bold uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(buildings) && buildings.map((item) => (
                  <tr 
                    key={item.id} 
                    className="border-b-2 border-black hover:bg-[#FFC900] transition-colors group"
                  >
                    <td className="p-6 text-lg font-bold border-r-2 border-black group-hover:border-black">
                      <Link href={`/buildings/${item.id}/rooms`} className="hover:underline block w-full h-full">
                        {item.name}
                      </Link>
                    </td>
                    <td className="p-6 text-lg font-medium border-r-2 border-black group-hover:border-black">{item.address}</td>
                    <td className="p-6 text-lg font-bold border-r-2 border-black group-hover:border-black">
                      <div className="flex flex-col gap-2">
                        <span className="font-bold text-lg">{item.totalRooms} Phòng</span>
                        <div className="flex gap-2 text-xs font-bold">
                          {item.availableRooms > 0 && (
                            <span className="bg-green-100 text-green-800 border border-black px-2 py-0.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                              {item.availableRooms} Trống
                            </span>
                          )}
                          {item.rentedRooms > 0 && (
                            <span className="bg-pink-100 text-pink-800 border border-black px-2 py-0.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                              {item.rentedRooms} Đang ở
                            </span>
                          )}
                          {item.maintenanceRooms > 0 && (
                            <span className="bg-yellow-100 text-yellow-800 border border-black px-2 py-0.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                              {item.maintenanceRooms} Sửa
                            </span>
                          )}
                          {item.totalRooms === 0 && (
                            <span className="text-gray-400 italic font-normal">Chưa có phòng</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-6 flex gap-3">
                      <button className="bg-[#00FFFF] text-black border-2 border-black px-4 py-2 font-bold shadow-[4px_4px_0px_0px_black] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all">
                        SỬA
                      </button>
                      <button 
                        onClick={() => setDeleteId(item.id)}
                        className="bg-[#FF4D4D] text-white border-2 border-black px-4 py-2 font-bold shadow-[4px_4px_0px_0px_black] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all"
                      >
                        XÓA
                      </button>
                    </td>
                  </tr>
                ))}
                {buildings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-xl font-bold text-gray-500">
                      Chưa có tòa nhà nào. Hãy thêm mới!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          
          <div className="p-4 bg-[#F4F4F0] border-t-2 border-black text-center font-bold text-gray-500">
            Hiển thị {buildings.length} tòa nhà
          </div>
        </div>
      </div>

      {/* ADD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white border-2 border-black shadow-[8px_8px_0px_#000] p-8 animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border-2 border-black hover:bg-black hover:text-white transition-colors font-bold">✕</button>
            <h2 className="text-3xl font-bold mb-6 uppercase">Thêm tòa nhà mới</h2>
            
            <Form form={form} onFinish={handleCreateBuilding} layout="vertical" className="font-mono">
              <Form.Item label={<span className="font-bold text-lg">Tên tòa nhà</span>} name="name" rules={[{ required: true, message: 'Nhập tên tòa nhà!' }]}>
                <Input className="gumroad-input" placeholder="VD: Nhà trọ Xanh" autoFocus />
              </Form.Item>
              
              <Form.Item label={<span className="font-bold text-lg">Địa chỉ</span>} name="address" rules={[{ required: true, message: 'Nhập địa chỉ!' }]}>
                <Input className="gumroad-input" placeholder="VD: 123 Đường Láng" />
              </Form.Item>

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