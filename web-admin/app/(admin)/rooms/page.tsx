"use client";

import { useState, useEffect, useMemo } from 'react';
import { message, Spin, Empty, Checkbox, Dropdown, Modal } from 'antd';
import { 
  PlusOutlined, LoadingOutlined, FileTextOutlined, 
  DollarOutlined, ToolOutlined, AppstoreOutlined, 
  UnorderedListOutlined, EditOutlined, DeleteOutlined, 
  MoreOutlined, CheckCircleOutlined, WarningOutlined,
  FilterOutlined, HomeOutlined, SearchOutlined, SendOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import axios from '@/lib/axios-client';
import CreateRoomModal from '@/components/rooms/CreateRoomModal';
import EditRoomModal from '@/components/rooms/EditRoomModal';
import RoomListView from '@/components/rooms/RoomListView';

// Helper: Format Currency
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('vi-VN').format(value);

export default function AllRoomsPage() {
  // Data State
  const [rooms, setRooms] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeStatusFilter, setActiveStatusFilter] = useState('ALL');
  const [activeBuildingFilter, setActiveBuildingFilter] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  
  // 1. FETCH DATA
  const fetchData = async () => {
    setLoading(true);
    try {
      // Parallel fetch: All Rooms & All Buildings
      const [roomsRes, buildingsRes] = await Promise.all([
        axios.get('/rooms'),
        axios.get('/buildings')
      ]);
      setRooms(roomsRes.data);
      setBuildings(buildingsRes.data);
    } catch (error) {
      console.error(error);
      message.error('Không thể tải dữ liệu phòng!');
    } finally {
      setLoading(false);
    }
  };


  const searchParams = useSearchParams();

  useEffect(() => {
    fetchData();
  }, []);

  // Handle URL params for filtering
  useEffect(() => {
    const buildingIdParam = searchParams.get('buildingId');
    if (buildingIdParam) {
       setActiveBuildingFilter(Number(buildingIdParam));
    }
  }, [searchParams]);

  // 2. FILTER & SEARCH LOGIC
  const filteredRooms = useMemo(() => {
    const roomsInBuilding = activeBuildingFilter === 'ALL' 
      ? rooms 
      : rooms.filter(r => r.buildingId === activeBuildingFilter);
    
    return rooms.filter(room => {
      // 1. Filter by Status
      const statusMatch = activeStatusFilter === 'ALL' || room.status === activeStatusFilter;
      
      // 2. Filter by Building
      const buildingMatch = activeBuildingFilter === 'ALL' || room.buildingId === activeBuildingFilter;
      
      // 3. Search by Name (Room Code)
      const searchMatch = room.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      return statusMatch && buildingMatch && searchMatch;
    });
  }, [rooms, activeStatusFilter, activeBuildingFilter, searchQuery]);

  // Statistics for badges (depend on Building Filter but NOT Status Filter)
  const stats = useMemo(() => {
    const roomsInBuilding = activeBuildingFilter === 'ALL' 
      ? rooms 
      : rooms.filter(r => r.buildingId === activeBuildingFilter);

    return {
      all: roomsInBuilding.length,
      available: roomsInBuilding.filter(r => r.status === 'AVAILABLE').length,
      rented: roomsInBuilding.filter(r => r.status === 'RENTED').length,
      maintenance: roomsInBuilding.filter(r => r.status === 'MAINTENANCE').length,
    };
  }, [rooms, activeBuildingFilter]);

  // 3. ACTIONS
  // NOTE: Create Room from here needs BuildingID selection logic or strict to inside building page.
  // Ideally, redirect user to specific building or show Modal with Building Select.
  // simpler for now: Disable "Add Room" here OR redirect to Buildings list?
  // Let's allow simple Add but maybe default building needs to be handled in Modal?
  // Checking CreateRoomModal... It likely takes BuildingId as prop. 
  // We should create a modified Modal or handle it. 
  // For safety, let's keep "Add Room" but maybe it requires a Building to be filtered first?
  // OR -> Just hide Add Room button here if no building selected, enforce flow?
  // Actually, Users prefer flexibility. Let's see...

  const handleCreateRoom = async (values: any) => {
      // TODO: Logic to add room requires buildingId
      // If we are in "All Rooms", we don't know buildingId unless we add a specific field in the form.
      // For now, let's notify user to go to Building page for creation if not filtered.
      message.info("Vui lòng vào chi tiết Tòa nhà để thêm phòng mới.");
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
          message.error('Lỗi khi cập nhật phòng');
      }
  };

  const handleDeleteRoom = (room: any) => {
      Modal.confirm({
          title: 'Xóa phòng?',
          content: `Bạn có chắc chắn muốn xóa phòng ${room.name}?`,
          okText: 'Xóa ngay',
          okType: 'danger',
          onOk: async () => {
              try {
                  await axios.delete(`/rooms/${room.id}`);
                  message.success('Đã xóa phòng thành công! 🗑️');
                  fetchData();
              } catch (error: any) {
                  message.error('Lỗi khi xóa phòng. Có thể phòng đang có hợp đồng.');
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

  const toggleSelection = (roomId: number) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };

  const handleBulkAction = (action: string) => {
    message.info(`Đang xử lý ${action} cho ${selectedRooms.length} phòng... (Tính năng đang phát triển)`);
  };

  return (
    <div className="claude-page min-h-screen bg-[var(--bg-page)] text-gray-900 font-sans p-6 md:p-12 transition-all">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-3xl md:text-4xl claude-header mb-3">
            Tất cả phòng
          </h1>
          <p className="text-gray-500 font-sans text-lg">Quản lý toàn bộ danh sách phòng của hệ thống</p>
        </div>
        
        {/* VIEW TOOLS */}
        <div className="flex items-center gap-4">
             {/* VIEW MODE TOGGLE */}
             <div className="flex bg-white border-2 border-black p-1 gap-1 shadow-[4px_4px_0px_0px_black]">
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
                <span className="text-xs font-bold uppercase text-gray-500 hidden md:inline">Chế độ chọn:</span>
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

      {/* FILTER BAR (NEOBRUTALISM STYLE) */}
      <div className="bg-white border-2 border-[var(--border-strong)] p-4 mb-8 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center rounded-lg">
         {/* LEFT: STATUS FILTERS */}
         <div className="flex flex-wrap gap-2 w-full md:w-auto">
             <button 
                onClick={() => setActiveStatusFilter('ALL')} 
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${activeStatusFilter === 'ALL' ? 'bg-[var(--text-primary)] text-white shadow-md' : 'bg-white text-[var(--text-secondary)] hover:bg-gray-100 border border-gray-200'}`}
             >
                TẤT CẢ ({stats.all})
             </button>
             <button 
                onClick={() => setActiveStatusFilter('AVAILABLE')} 
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${activeStatusFilter === 'AVAILABLE' ? 'bg-[#00E054] text-black shadow-md border border-[#00E054]' : 'bg-white text-[var(--text-secondary)] hover:bg-green-50 border border-gray-200'}`}
             >
                TRỐNG ({stats.available})
             </button>
             <button 
                onClick={() => setActiveStatusFilter('RENTED')} 
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${activeStatusFilter === 'RENTED' ? 'bg-[#ffcdfa] text-black shadow-md border border-[#ffcdfa]' : 'bg-white text-[var(--text-secondary)] hover:bg-pink-50 border border-gray-200'}`}
             >
                ĐANG Ở ({stats.rented})
             </button>
         </div>

         {/* RIGHT: BUILDING FILTER & SEARCH */}
         <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
             <div className="relative group">
                 <select 
                    value={activeBuildingFilter}
                    onChange={(e) => setActiveBuildingFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                    className="appearance-none w-full md:w-48 px-4 py-2.5 bg-white border border-gray-300 rounded-lg font-medium cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                 >
                     <option value="ALL">Tất cả tòa nhà</option>
                     {buildings.map(b => (
                         <option key={b.id} value={b.id}>{b.name}</option>
                     ))}
                 </select>
                 <HomeOutlined className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
             </div>

             <div className="relative">
                 <input 
                    type="text" 
                    placeholder="Tìm theo tên phòng..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-64 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder:text-gray-400"
                 />
                 <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
             </div>
         </div>
      </div>

      {/* CONTENT AREA */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: 'black' }} spin />} />
        </div>
      ) : (
        <>
            {viewMode === 'LIST' ? (
                 <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_black] overflow-hidden">
                     {/* Reuse RoomListView or implement simplified table for All Rooms */}
                     {/* NOTE: RoomListView expects basic room prop structure. The data structure from /rooms might differ slightly (include building relation?) */}
                     {/* Checking API: findAll returns room list. Assuming relation 'building' is included. */}
                     <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black text-white uppercase text-xs font-bold tracking-wider">
                                <th className="p-4">Phòng</th>
                                <th className="p-4">Tòa nhà</th>
                                <th className="p-4">Giá</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black font-medium">
                            {filteredRooms.map(room => {
                                const isSelected = selectedRooms.includes(room.id);
                                return (
                                <tr 
                                    key={room.id} 
                                    className={`transition-colors ${isSelected ? 'bg-red-50' : 'hover:bg-yellow-50'} cursor-pointer`}
                                    onClick={() => isSelectionMode && toggleSelection(room.id)}
                                >
                                    <td className="p-4 font-black">
                                        <div className="flex items-center gap-2 font-mono text-lg">
                                            {(isSelectionMode || isSelected) && (
                                                <Checkbox checked={isSelected} />
                                            )}
                                            {room.name}
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        {/* Ideally room object has building.name. If not, lookup from buildings list */}
                                        {room.building?.name || buildings.find(b => b.id === room.buildingId)?.name || 'N/A'}
                                    </td>
                                    <td className="p-4 font-mono">{formatCurrency(room.price)}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-bold border border-black ${
                                            room.status === 'RENTED' ? 'bg-[#ffcdfa]' : 
                                            room.status === 'MAINTENANCE' ? 'bg-[#fff59d]' : 'bg-[#00E054]'
                                        }`}>
                                            {room.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => { setEditingRoom(room); setIsEditModalOpen(true); }}
                                                className="w-8 h-8 flex items-center justify-center border-2 border-black hover:bg-black hover:text-white transition-all"
                                            >
                                                <EditOutlined />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteRoom(room)}
                                                className="w-8 h-8 flex items-center justify-center border-2 border-black hover:bg-red-500 hover:text-white transition-all text-red-500"
                                            >
                                                <DeleteOutlined />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                          })}
                            {filteredRooms.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500 italic">Không tìm thấy phòng nào phù hợp.</td>
                                </tr>
                            )}
                        </tbody>
                     </table>
                 </div>
            ) : (
                /* GRID VIEW REIMPLEMENTATION */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                 {filteredRooms.length === 0 && (
                     <div className="col-span-full py-10 flex justify-center">
                        <Empty description={<span className="font-mono font-bold text-lg text-gray-500">Không tìm thấy phòng nào.</span>} />
                     </div>
                 )}
                 {filteredRooms.map((room) => {
                     // Lookup building name
                     const buildingName = room.building?.name || buildings.find(b => b.id === room.buildingId)?.name;

                     return (
                        <div 
                         key={room.id}
                         onClick={() => isSelectionMode && toggleSelection(room.id)}
                         className={`
                             relative flex flex-col justify-between group bg-white transition-all cursor-pointer overflow-hidden rounded-xl
                             ${selectedRooms.includes(room.id) ? 'ring-2 ring-[var(--primary)] bg-orange-50' : 'border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1'}
                         `}
                         style={{ height: '360px' }}
                        >
                            {/* SELECTION CHECKBOX */}
                            {(isSelectionMode || selectedRooms.includes(room.id)) && (
                                <div className="absolute top-2 left-2 z-20">
                                    <Checkbox checked={selectedRooms.includes(room.id)} className="scale-125" />
                                </div>
                            )}

                            {/* HEADER */}
                            <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <span className="text-xs font-bold uppercase truncate max-w-[120px] text-gray-500 tracking-wide" title={buildingName}>
                                    <HomeOutlined className="mr-1"/> {buildingName}
                                </span>
                                <Dropdown 
                                    menu={{ 
                                        items: [
                                            { key: 'AVAILABLE', label: 'Trống', icon: <CheckCircleOutlined className="text-green-500"/>, onClick: () => handleUpdateStatus(room.id, 'AVAILABLE') },
                                            { key: 'MAINTENANCE', label: 'Bảo trì', icon: <WarningOutlined className="text-yellow-500"/>, onClick: () => handleUpdateStatus(room.id, 'MAINTENANCE') },
                                        ] 
                                    }} 
                                    trigger={['click']}
                                >
                                    <div className={`px-2 py-0.5 text-[10px] font-bold rounded-md cursor-pointer hover:opacity-80 flex items-center gap-1 ${
                                        room.status === 'RENTED' ? 'bg-pink-100 text-pink-700' : 
                                        room.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                        {room.status === 'RENTED' ? 'ĐANG Ở' : room.status === 'MAINTENANCE' ? 'BẢO TRÌ' : 'TRỐNG'} <MoreOutlined />
                                    </div>
                                </Dropdown>
                            </div>

                            {/* BODY */}
                            <div className="p-5 flex-grow flex flex-col">
                                <h3 className="font-bold font-mono text-3xl m-0 tracking-tight mb-1 text-[var(--text-primary)]">{room.name}</h3>
                                <div className="text-gray-500 font-medium text-xs mb-4 flex items-center gap-2">
                                   <span className="bg-gray-100 px-2 py-0.5 rounded">Tầng {room.floor}</span>
                                   <span>•</span>
                                   <span>{room.area} m²</span>
                                </div>
                                
                                <div className="font-mono font-bold text-xl text-[var(--primary)] mb-4">
                                    {formatCurrency(room.price)}
                                    <span className="text-xs text-gray-400 font-sans ml-1">/tháng</span>
                                </div>
                                
                                {/* UTILITIES / ASSETS */}
                                <div className="mt-auto">
                                   <div className="text-[10px] font-bold uppercase text-gray-400 mb-2">Tiện ích:</div>
                                   <div className="flex flex-wrap gap-1.5">
                                       {room.assets && room.assets.length > 0 ? room.assets.slice(0, 4).map((asset: string, idx: number) => (
                                           <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200">
                                               {asset}
                                           </span>
                                       )) : (
                                           <span className="text-[10px] text-gray-300 italic">Trống</span>
                                       )}
                                       {room.assets && room.assets.length > 4 && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200">+{room.assets.length - 4}</span>
                                       )}
                                   </div>
                                </div>
                            </div>

                            {/* FOOTER ACTIONS */}
                            <div className="p-3 bg-gray-50/50 border-t border-gray-100 grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => { setEditingRoom(room); setIsEditModalOpen(true); }}
                                    className="claude-btn-secondary text-xs py-1.5 flex justify-center items-center gap-1"
                                >
                                    <EditOutlined /> Sửa
                                </button>
                                <button 
                                    onClick={() => handleDeleteRoom(room)}
                                    className="bg-white border text-red-500 border-red-100 hover:bg-red-50 text-xs font-bold py-1.5 rounded-lg transition-all flex justify-center items-center gap-1"
                                >
                                    <DeleteOutlined /> Xóa
                                </button>
                            </div>
                        </div>
                     );
                 })}
                </div>
            )}
        </>
      )}

      {/* EDIT MODAL ONLY - CREATE DISABLED FOR GLOBAL VIEW TO AVOID COMPLEXITY */}
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
    </div>
  );
}
