'use client';

import { useState, useEffect, use } from 'react';
import { Modal, Form, Input, InputNumber, message, Spin, Empty, Select } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, UserOutlined, DeleteOutlined, LoadingOutlined, EditOutlined } from '@ant-design/icons';
import Link from 'next/link';
import axios from '@/lib/axios-client';

// Hàm format tiền tệ (3000000 -> 3,000,000)
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('vi-VN').format(value);

// Bộ lọc
const filters = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'AVAILABLE', label: 'Phòng trống' },
  { id: 'RENTED', label: 'Đang thuê' },
  { id: 'MAINTENANCE', label: 'Đang sửa' },
];

export default function RoomMatrixPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // Unwrap params
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // 1. GỌI API LẤY DANH SÁCH
  const fetchRooms = async () => {
    setLoading(true);
    try {
      // Endpoint: /rooms/by-building/{id}
      const res = await axios.get(`/rooms/by-building/${id}`);
      setRooms(res.data);
    } catch (error) {
      console.error(error);
      message.error('Không thể tải danh sách phòng!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [id]);

  // 2. GỌI API TẠO PHÒNG
  const handleCreateRoom = async (values: any) => {
    try {
      const payload = {
        ...values,
        price: Number(values.price),
        area: values.area ? Number(values.area) : undefined,
        maxTenants: values.maxTenants ? Number(values.maxTenants) : 2,
        buildingId: Number(id),
      };

      await axios.post('/rooms', payload);
      message.success('Thêm phòng thành công! 🎉');
      setIsModalOpen(false);
      form.resetFields();
      fetchRooms(); // Load lại dữ liệu thật
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi thêm phòng (Kiểm tra lại tên hoặc giá)');
    }
  };

  // 3. GỌI API XÓA PHÒNG
  const handleDeleteRoom = (roomId: number, roomName: string) => {
    Modal.confirm({
      title: `XÓA PHÒNG ${roomName}?`,
      content: 'Dữ liệu không thể khôi phục.',
      okText: 'XÓA',
      okType: 'danger',
      cancelText: 'HỦY',
      className: 'neobrutalism-modal',
      okButtonProps: { className: 'bg-red-500 text-black border-2 border-black font-bold shadow-[2px_2px_0px_0px_black] rounded-none hover:bg-red-400' },
      cancelButtonProps: { className: 'border-2 border-black font-bold text-black rounded-none' },
      onOk: async () => {
        try {
          await axios.delete(`/rooms/${roomId}`);
          message.success('Đã xóa phòng!');
          fetchRooms();
        } catch (error) {
          message.error('Không thể xóa phòng này');
        }
      },
    });
  };

  // Logic lọc hiển thị
  const filteredRooms = rooms.filter(room => 
    activeFilter === 'ALL' ? true : room.status === activeFilter
  );

  // Helper: Màu sắc trạng thái
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'RENTED': return 'bg-[#ffcdfa]'; // Hồng
      case 'AVAILABLE': return 'bg-white';  // Trắng
      case 'MAINTENANCE': return 'bg-[#fff59d]'; // Vàng
      default: return 'bg-white';
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0] p-8 font-sans">
      {/* HEADER */}
      <div className="mb-8">
        <Link href="/buildings">
          <button className="flex items-center gap-2 font-bold hover:underline mb-4">
            <ArrowLeftOutlined /> Quay lại danh sách nhà
          </button>
        </Link>
        
        <div className="flex justify-between items-end border-b-2 border-black pb-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">QUẢN LÝ PHÒNG</h1>
            <p className="text-gray-600 font-mono mt-1">Danh sách phòng & Trạng thái</p>
          </div>
          
          <div className="flex gap-4 items-center">
             {/* Bộ lọc Pills */}
             <div className="flex gap-2">
                {filters.map(f => (
                  <button 
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={`
                      px-4 py-2 border-2 border-black text-xs font-bold rounded-full transition-all
                      ${activeFilter === f.id 
                        ? 'bg-black text-white shadow-[2px_2px_0px_0px_#FF90E8] -translate-y-0.5 -translate-x-0.5' 
                        : 'bg-white hover:bg-[#FFC900] hover:shadow-[2px_2px_0px_0px_black] hover:-translate-y-0.5 hover:-translate-x-0.5'
                      }
                    `}
                  >
                    {f.label}
                  </button>
                ))}
             </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#FFC900] text-black border-2 border-black px-6 py-3 font-bold uppercase shadow-[4px_4px_0px_0px_black] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_black] transition-all flex items-center justify-center gap-2"
            >
              <PlusOutlined /> Thêm phòng
            </button>
          </div>
        </div>
      </div>

      {/* LOADING STATE */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: 'black' }} spin />} />
        </div>
      ) : (
        /* ROOM MATRIX GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredRooms.length === 0 && (
             <div className="col-span-full py-10 flex justify-center">
                <Empty description={<span className="font-mono font-bold text-lg text-gray-500">Chưa có phòng nào. Hãy tạo phòng đầu tiên ngay!</span>} />
             </div>
          )}

          {filteredRooms.map((room) => (
            <div 
              key={room.id}
              className={`
                relative p-4 border-2 border-black h-48 flex flex-col justify-between group bg-white
                shadow-[6px_6px_0px_0px_black] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_black] transition-all
              `}
            >
              {/* STATUS TAG (Top-Left, Relative) */}
              <div className="mb-2">
                 {room.status === 'RENTED' ? (
                    <span className="bg-[#ffcdfa] border-2 border-black px-2 py-0.5 text-[10px] font-bold rounded-full shadow-[2px_2px_0px_0px_black]">
                      Đang thuê
                    </span>
                 ) : room.status === 'MAINTENANCE' ? (
                    <span className="bg-[#fff59d] border-2 border-black px-2 py-0.5 text-[10px] font-bold rounded-full shadow-[2px_2px_0px_0px_black]">
                      Đang sửa
                    </span>
                 ) : (
                    <span className="bg-green-100 text-green-800 border-2 border-black px-2 py-0.5 text-[10px] font-bold rounded-full shadow-[2px_2px_0px_0px_black]">
                      Trống
                    </span>
                 )}
              </div>

              {/* ACTION BUTTONS (Top-Right, Visible on Hover) */}
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <button 
                  className="bg-white border-2 border-black p-1 hover:bg-[#00FFFF] transition-colors shadow-[2px_2px_0px_0px_black]"
                  title="Sửa"
                >
                  <EditOutlined className="text-black" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id, room.name); }}
                  className="bg-white border-2 border-black p-1 hover:bg-[#FF4D4D] hover:text-white transition-colors shadow-[2px_2px_0px_0px_black]"
                  title="Xóa"
                >
                  <DeleteOutlined />
                </button>
              </div>

              <div className="flex justify-between items-start">
                <span className="font-black text-2xl">{room.name}</span>
              </div>

              <div className="font-mono text-sm mt-auto">
                 <div className="font-bold border-b-2 border-black w-max mb-2 text-lg">
                    {formatCurrency(room.price)} ₫
                 </div>

                 {/* Assets Pills */}
                 {room.assets && Array.isArray(room.assets) && room.assets.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {room.assets.map((asset: string, index: number) => (
                        <span key={index} className="border border-black rounded-md px-1.5 py-[2px] text-[10px] font-bold bg-gray-50 text-gray-600">
                          {asset}
                        </span>
                      ))}
                    </div>
                 ) : (
                    <div className="mt-2 text-[10px] text-gray-400 italic">Không có tiện ích</div>
                 )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CUSTOM MODAL - Gumroad Style */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-white border-2 border-black shadow-[8px_8px_0px_#000] p-8 animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border-2 border-black hover:bg-black hover:text-white transition-colors font-bold"
            >
              ✕
            </button>
            <h2 className="text-3xl font-bold mb-6 uppercase">Thêm phòng mới</h2>
            
            <Form form={form} onFinish={handleCreateRoom} layout="vertical" className="font-mono">
              <div className="grid grid-cols-2 gap-6">
                <Form.Item label={<span className="font-bold text-lg">Tên phòng</span>} name="name" rules={[{ required: true, message: 'Nhập tên phòng!' }]}>
                  <Input className="gumroad-input" placeholder="VD: P.101" />
                </Form.Item>
                
                <Form.Item label={<span className="font-bold text-lg">Giá thuê</span>} name="price" rules={[{ required: true, message: 'Nhập giá tiền!' }]}>
                  <InputNumber 
                    className="w-full border-2 border-black shadow-[4px_4px_0px_#000] text-lg"
                    size="large"
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
                    placeholder="3,500,000"
                    style={{ borderRadius: 0 }}
                    addonAfter="₫"
                  />
                </Form.Item>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Form.Item label={<span className="font-bold text-lg">Diện tích</span>} name="area">
                   <InputNumber 
                      className="w-full border-2 border-black shadow-[4px_4px_0px_#000] text-lg" 
                      size="large"
                      placeholder="25" 
                      style={{ borderRadius: 0 }}
                      addonAfter="m²"
                   />
                </Form.Item>
                <Form.Item label={<span className="font-bold text-lg">Số người tối đa</span>} name="maxTenants" initialValue={2}>
                   <InputNumber 
                      className="w-full border-2 border-black shadow-[4px_4px_0px_#000] text-lg" 
                      size="large"
                      style={{ borderRadius: 0 }}
                   />
                </Form.Item>
              </div>

              <Form.Item label={<span className="font-bold text-lg">Tiện ích / Tài sản</span>} name="assets">
                <Select
                  mode="tags"
                  style={{ width: '100%', height: '50px' }}
                  placeholder="Nhập tài sản..."
                  options={[
                    { value: 'Điều hòa', label: 'Điều hòa' },
                    { value: 'Nóng lạnh', label: 'Nóng lạnh' },
                    { value: 'Tủ lạnh', label: 'Tủ lạnh' },
                    { value: 'Máy giặt', label: 'Máy giặt' },
                    { value: 'Giường', label: 'Giường' },
                    { value: 'Tủ quần áo', label: 'Tủ quần áo' },
                  ]}
                  className="gumroad-select-override"
                  variant="borderless"
                />
              </Form.Item>

              <div className="flex justify-end gap-4 mt-8 pt-4 border-t-2 border-black border-dashed">
                <button type="button" onClick={() => setIsModalOpen(false)} className="gumroad-btn-secondary py-2 px-4 text-base">
                  Hủy
                </button>
                <button type="submit" className="gumroad-btn-primary py-2 px-4 text-base bg-[#FF90E8] hover:bg-[#FFC900] text-black">
                  Lưu phòng
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
