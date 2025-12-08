'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { Form, message, Spin, Empty, Checkbox, Dropdown, MenuProps, Modal } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, LoadingOutlined, FileTextOutlined, SendOutlined, DollarOutlined, ToolOutlined, AppstoreOutlined, UnorderedListOutlined, EditOutlined, DeleteOutlined, MoreOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import Link from 'next/link';
import axios from '@/lib/axios-client';
import CreateRoomModal from '@/components/rooms/CreateRoomModal';
import EditRoomModal from '@/components/rooms/EditRoomModal';
import RoomListView from '@/components/rooms/RoomListView';

// Hàm format tiền tệ
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('vi-VN').format(value);

export default function RoomMatrixPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  console.log('DEBUG: RoomMatrixPage id:', id);
  
  // Data State
  const [rooms, setRooms] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  
  // Form
  const [form] = Form.useForm();

  // 1. FETCH DATA
  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('DEBUG: Fetching data for building', id);
      const [roomsRes, buildingsRes] = await Promise.all([
        axios.get(`/rooms/by-building/${id}`),
        axios.get('/buildings')
      ]);
      setRooms(roomsRes.data);
      setBuildings(buildingsRes.data);
    } catch (error) {
      console.error(error);
      message.error('Không thể tải dữ liệu!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
      setSelectedRooms([]); // Reset selection on building change
    }
  }, [id]);

  // 2. ACTIONS
  const handleCreateRoom = async (values: any) => {
    try {
      console.log('DEBUG: handleCreateRoom values:', values);
      const payload = {
        ...values,
        price: Number(values.price),
        depositPrice: values.depositPrice ? Number(values.depositPrice) : undefined,
        area: values.area ? Number(values.area) : undefined,
        floor: values.floor ? Number(values.floor) : 1,
        gender: values.gender || 'ALL',
        maxTenants: values.maxTenants ? Number(values.maxTenants) : 2,
        buildingId: Number(id),
      };
      console.log('DEBUG: handleCreateRoom payload:', payload);

      await axios.post('/rooms', payload);
      message.success('Thêm phòng thành công! 🎉');
      setIsModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (error: any) {
      console.error('Create room error:', error);
      const errorMsg = error.response?.data?.message || 'Lỗi khi thêm phòng';
      message.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
    }
  };

  const handleUpdateRoom = async (roomId: number, values: any) => {
      try {
          const payload = {
              ...values,
              price: Number(values.price),
              depositPrice: values.depositPrice ? Number(values.depositPrice) : undefined,
              area: values.area ? Number(values.area) : undefined,
              floor: values.floor ? Number(values.floor) : 1,
              maxTenants: values.maxTenants ? Number(values.maxTenants) : 2,
          };
          
          await axios.patch(`/rooms/${roomId}`, payload);
          message.success('Cập nhật phòng thành công! ✅');
          setIsEditModalOpen(false);
          setEditingRoom(null);
          fetchData();
      } catch (error: any) {
          console.error('Update room error:', error);
          const errorMsg = error.response?.data?.message || 'Lỗi khi cập nhật phòng';
          message.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
      }
  };

  const handleDeleteRoom = (room: any) => {
      Modal.confirm({
          title: 'Xóa phòng?',
          content: `Bạn có chắc chắn muốn xóa phòng ${room.name}? Hành động này không thể hoàn tác.`,
          okText: 'Xóa ngay',
          okType: 'danger',
          cancelText: 'Hủy',
          onOk: async () => {
              try {
                  await axios.delete(`/rooms/${room.id}`);
                  message.success('Đã xóa phòng thành công! 🗑️');
                  fetchData();
              } catch (error: any) {
                  console.error('Delete room error:', error);
                  const errorMsg = error.response?.data?.message || 'Lỗi khi xóa phòng';
                  message.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
              }
          }
      });
  };

  const handleUpdateStatus = async (roomId: number, status: string) => {
      try {
          await axios.patch(`/rooms/${roomId}/status`, null, { params: { status } });
          message.success('Cập nhật trạng thái thành công!');
          fetchData();
      } catch (error: any) {
          message.error('Lỗi khi cập nhật trạng thái');
      }
  };

  // 3. BULK ACTIONS
  const toggleSelection = (roomId: number) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };

  const handleBulkAction = (action: string) => {
    message.info(`Đang xử lý ${action} cho ${selectedRooms.length} phòng... (Tính năng đang phát triển)`);
    // Implement actual logic here
  };

  // 4. FILTER LOGIC
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => activeFilter === 'ALL' ? true : room.status === activeFilter);
  }, [rooms, activeFilter]);

  const stats = useMemo(() => {
    return {
      available: rooms.filter(r => r.status === 'AVAILABLE').length,
      rented: rooms.filter(r => r.status === 'RENTED').length,
      maintenance: rooms.filter(r => r.status === 'MAINTENANCE').length,
    };
  }, [rooms]);

  return (
    <div className="min-h-screen bg-[#F4F4F0] p-4 md:p-8 font-sans pb-24">
      {/* HEADER & BUILDING TABS */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
            <Link href="/buildings">
            <button className="flex items-center gap-2 font-bold hover:underline">
                <ArrowLeftOutlined /> Quay lại danh sách nhà
            </button>
            </Link>
            <div className="flex items-center gap-4">
                {/* VIEW MODE TOGGLE */}
                <div className="flex bg-white border-2 border-black p-1 gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <button 
                        onClick={() => setViewMode('GRID')}
                        className={`p-2 transition-all ${viewMode === 'GRID' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
                        title="Xem lưới"
                    >
                        <AppstoreOutlined className="text-lg" />
                    </button>
                    <button 
                        onClick={() => setViewMode('LIST')}
                        className={`p-2 transition-all ${viewMode === 'LIST' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
                        title="Xem danh sách"
                    >
                        <UnorderedListOutlined className="text-lg" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-gray-500">Chế độ chọn:</span>
                    <button 
                        onClick={() => {
                            setIsSelectionMode(!isSelectionMode);
                            setSelectedRooms([]);
                        }}
                        className={`px-3 py-1 border-2 border-black font-bold text-xs uppercase transition-all ${isSelectionMode ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
                    >
                        {isSelectionMode ? 'Đang Bật' : 'Đang Tắt'}
                    </button>
                </div>
            </div>
        </div>

        {/* BUILDING TABS (SCROLLABLE - FOLDER STYLE) */}
        <div className="flex overflow-x-auto gap-0 no-scrollbar mb-0 border-b-2 border-black items-end px-4">
            {buildings.map(b => {
                const isActive = Number(id) === b.id;
                return (
                <Link key={b.id} href={`/buildings/${b.id}/rooms`} scroll={false}>
                    <div className={`
                        whitespace-nowrap px-8 py-3 font-bold uppercase cursor-pointer transition-all border-2 border-black border-b-0 rounded-t-lg mr-[-2px]
                        ${isActive 
                            ? 'bg-[#FF90E8] text-black z-10 relative top-[2px] h-14 flex items-center shadow-[0px_-4px_0px_0px_rgba(0,0,0,0)]' 
                            : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-black h-12 flex items-center'
                        }
                    `}>
                        {b.name}
                    </div>
                </Link>
            )})}
        </div>
        
        {/* ACTION BAR & STATUS FILTER */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b-2 border-black pb-6 pt-8 bg-white px-4 border-x-2 border-t-0 shadow-[4px_4px_0px_0px_black] mb-8">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">QUẢN LÝ PHÒNG</h1>
            {/* LIVE STATUS BAR (PILLS) */}
            <div className="flex flex-wrap gap-3">
                <button 
                    onClick={() => setActiveFilter('ALL')} 
                    className={`px-4 py-2 rounded-full border-2 border-black font-bold text-sm transition-all ${activeFilter === 'ALL' ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(100,100,100,0.5)]' : 'bg-white hover:bg-gray-100'}`}
                >
                    TẤT CẢ: {rooms.length}
                </button>
                <button 
                    onClick={() => setActiveFilter('AVAILABLE')} 
                    className={`px-4 py-2 rounded-full border-2 border-black font-bold text-sm transition-all ${activeFilter === 'AVAILABLE' ? 'bg-[#00E054] text-black shadow-[2px_2px_0px_0px_black]' : 'bg-white hover:bg-green-50'}`}
                >
                    TRỐNG: {stats.available}
                </button>
                <button 
                    onClick={() => setActiveFilter('RENTED')} 
                    className={`px-4 py-2 rounded-full border-2 border-black font-bold text-sm transition-all ${activeFilter === 'RENTED' ? 'bg-[#ffcdfa] text-black shadow-[2px_2px_0px_0px_black]' : 'bg-white hover:bg-pink-50'}`}
                >
                    ĐANG Ở: {stats.rented}
                </button>
                <button 
                    onClick={() => setActiveFilter('MAINTENANCE')} 
                    className={`px-4 py-2 rounded-full border-2 border-black font-bold text-sm transition-all ${activeFilter === 'MAINTENANCE' ? 'bg-[#fff59d] text-black shadow-[2px_2px_0px_0px_black]' : 'bg-white hover:bg-yellow-50'}`}
                >
                    BẢO TRÌ: {stats.maintenance}
                </button>
            </div>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#FFC900] text-black border-2 border-black px-6 py-3 font-bold uppercase shadow-[4px_4px_0px_0px_black] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_black] transition-all flex items-center justify-center gap-2"
          >
            <PlusOutlined /> Thêm phòng
          </button>
        </div>
      </div>

      {/* LOADING STATE */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: 'black' }} spin />} />
        </div>
      ) : (
        <>
            {viewMode === 'LIST' ? (
                /* ROOM LIST VIEW */
                <RoomListView 
                    rooms={filteredRooms} 
                    loading={loading} 
                    onSelectRoom={(roomId) => {
                        if (isSelectionMode) toggleSelection(roomId);
                        else console.log('View room details', roomId);
                    }} 
                />
            ) : (
                /* ROOM MATRIX GRID */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredRooms.length === 0 && (
                    <div className="col-span-full py-10 flex justify-center">
                        <Empty description={<span className="font-mono font-bold text-lg text-gray-500">Không tìm thấy phòng nào.</span>} />
                    </div>
                )}

                {filteredRooms.map((room) => {
                    const isSelected = selectedRooms.includes(room.id);
                    return (
                    <div 
                    key={room.id}
                    onClick={() => isSelectionMode && toggleSelection(room.id)}
                    className={`
                        relative flex flex-col justify-between group bg-white transition-all cursor-pointer overflow-hidden
                        ${isSelected ? 'border-2 border-[#FF4D4D] bg-red-50 shadow-[8px_8px_0px_0px_#FF4D4D]' : 'border-2 border-black shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_black]'}
                    `}
                    style={{ height: '320px' }}
                    >
                    {/* SELECTION CHECKBOX (Visible in mode or hovered) */}
                    {(isSelectionMode || isSelected) && (
                        <div className="absolute top-2 left-2 z-20">
                            <Checkbox checked={isSelected} className="scale-125" />
                        </div>
                    )}

                    {/* HEADER: STATUS & ACTIONS */}
                    <div className="flex justify-between items-start p-3 border-b-2 border-black bg-gray-50">
                        <div className="flex gap-2">
                             {/* EDIT & DELETE ACTIONS */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); setEditingRoom(room); setIsEditModalOpen(true); }}
                                className="bg-white border-2 border-black w-8 h-8 flex items-center justify-center hover:bg-gray-100 shadow-[2px_2px_0px_0px_black] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none transition-all"
                                title="Chỉnh sửa"
                            >
                                <EditOutlined />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room); }}
                                className="bg-white border-2 border-black w-8 h-8 flex items-center justify-center hover:bg-red-50 text-red-500 shadow-[2px_2px_0px_0px_black] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none transition-all"
                                title="Xóa phòng"
                            >
                                <DeleteOutlined />
                            </button>
                        </div>

                        <Dropdown 
                            menu={{ 
                                items: [
                                    { key: 'AVAILABLE', label: 'Trống', icon: <CheckCircleOutlined className="text-green-500"/>, onClick: () => handleUpdateStatus(room.id, 'AVAILABLE') },
                                    { key: 'MAINTENANCE', label: 'Bảo trì', icon: <WarningOutlined className="text-yellow-500"/>, onClick: () => handleUpdateStatus(room.id, 'MAINTENANCE') },
                                ] 
                            }} 
                            trigger={['click']}
                        >
                            <div className={`px-3 py-1 text-xs font-bold border-2 border-black cursor-pointer hover:opacity-80 flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] ${
                                room.status === 'RENTED' ? 'bg-[#ffcdfa]' : 
                                room.status === 'MAINTENANCE' ? 'bg-[#fff59d]' : 'bg-[#00E054] text-white'
                            }`}>
                                {room.status === 'RENTED' ? 'ĐANG THUÊ' : room.status === 'MAINTENANCE' ? 'BẢO TRÌ' : 'TRỐNG'}
                                {room.status !== 'RENTED' && <MoreOutlined />}
                            </div>
                        </Dropdown>
                    </div>

                    {/* BODY: INFO */}
                    <div className="p-4 flex-grow flex flex-col">
                        <div className="flex justify-between items-baseline mb-2">
                             <h3 className="font-black text-4xl m-0 tracking-tighter">{room.name}</h3>
                             <span className="font-mono font-bold text-gray-500 text-sm">{room.area} m²</span>
                        </div>
                        
                        <div className="font-mono font-bold text-xl border-b-2 border-black inline-block mb-3 self-start">
                            {formatCurrency(room.price)} ₫
                        </div>
                        
                        {/* ASSETS DISPLAY */}
                        <div className="mt-auto">
                            <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">Tiện ích:</div>
                            {room.assets && Array.isArray(room.assets) && room.assets.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                    {room.assets.slice(0, 3).map((asset: string, idx: number) => (
                                        <span key={idx} className="text-[10px] font-bold border border-black px-1.5 py-0.5 bg-gray-50 text-gray-600">
                                            {asset}
                                        </span>
                                    ))}
                                    {room.assets.length > 3 && (
                                        <span className="text-[10px] font-bold border border-black px-1.5 py-0.5 bg-gray-50 text-gray-600">
                                            +{room.assets.length - 3}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <div className="text-[10px] italic text-gray-400">Chưa có tài sản</div>
                            )}
                        </div>
                    </div>

                    {/* FOOTER: SMART ACTIONS */}
                    <div className="p-3 bg-gray-50 border-t-2 border-black">
                        {room.status === 'AVAILABLE' ? (
                            <button className="w-full bg-[#00E054] text-black border-2 border-black font-bold py-2 shadow-[2px_2px_0px_0px_black] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none transition-all flex items-center justify-center gap-2 text-sm uppercase">
                                <FileTextOutlined /> Hợp đồng mới
                            </button>
                        ) : room.status === 'RENTED' ? (
                            <div className="grid grid-cols-5 gap-2">
                                <button className="col-span-4 bg-[#ffcdfa] text-black border-2 border-black font-bold py-2 shadow-[2px_2px_0px_0px_black] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none transition-all flex items-center justify-center gap-2 text-xs uppercase">
                                    <DollarOutlined /> Lập hóa đơn
                                </button>
                                <button className="col-span-1 bg-white border-2 border-black flex items-center justify-center hover:bg-gray-100 shadow-[2px_2px_0px_0px_black] hover:shadow-none hover:translate-y-[1px] hover:translate-x-[1px] transition-all">
                                    <ToolOutlined />
                                </button>
                            </div>
                        ) : (
                            <button className="w-full bg-gray-200 text-gray-500 border-2 border-black font-bold py-2 cursor-not-allowed text-sm uppercase">
                                <ToolOutlined /> Đang bảo trì
                            </button>
                        )}
                    </div>
                    </div>
                )})}
                </div>
            )}
        </>
      )}

      {/* BULK ACTIONS TOOLBAR */}
      {selectedRooms.length > 0 && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white p-4 border-2 border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 duration-300">
              <div className="font-bold text-lg border-r border-gray-600 pr-6">
                  Đã chọn <span className="text-[#FF90E8] text-2xl">{selectedRooms.length}</span> phòng
              </div>
              <div className="flex gap-4">
                  <button onClick={() => handleBulkAction('Tăng giá')} className="flex items-center gap-2 hover:text-[#FF90E8] font-bold transition-colors">
                      <DollarOutlined /> Tăng giá đồng loạt
                  </button>
                  <button onClick={() => handleBulkAction('Gửi thông báo')} className="flex items-center gap-2 hover:text-[#FF90E8] font-bold transition-colors">
                      <SendOutlined /> Gửi thông báo (Zalo)
                  </button>
                  <button onClick={() => handleBulkAction('Bảo trì')} className="flex items-center gap-2 hover:text-[#FF90E8] font-bold transition-colors">
                      <ToolOutlined /> Báo bảo trì
                  </button>
              </div>
              <button onClick={() => setSelectedRooms([])} className="ml-4 text-gray-400 hover:text-white">
                  Hủy chọn
              </button>
          </div>
      )}

      {/* CREATE ROOM MODAL */}
      <CreateRoomModal 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        onConfirm={handleCreateRoom}
        loading={loading}
      />

      {/* EDIT ROOM MODAL */}
      <EditRoomModal
        open={isEditModalOpen}
        onCancel={() => {
            setIsEditModalOpen(false);
            setEditingRoom(null);
        }}
        onConfirm={handleUpdateRoom}
        loading={loading}
        room={editingRoom}
      />
    </div>
  );
}
