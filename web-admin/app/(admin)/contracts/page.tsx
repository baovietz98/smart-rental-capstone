'use client';
import { useState, useEffect, useMemo } from 'react';
import { FileText, Plus, Calendar, User, Home, CheckCircle, Loader2, X, Search, MoreHorizontal, ArrowRight, Trash2, Clock, Zap, Droplets } from 'lucide-react';
import axios from '@/lib/axios-client';
import { servicesApi } from '@/lib/api/services';
import { Service } from '@/types/service';
import { message, Steps, Form, Input, DatePicker, Select, InputNumber, Modal, Table, Tag, Dropdown, Button } from 'antd';
import dayjs from 'dayjs';
import LiquidationModal from '@/components/contracts/LiquidationModal';
import ExtensionModal from '@/components/contracts/ExtensionModal';
import ContractDetailModal from '@/components/contracts/ContractDetailModal';

// --- Helper Components ---
const UploadCCCD = ({ side, onUpload }: { side: 'front' | 'back', onUpload: (url: string) => void }) => {
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post('/upload/image/tenants', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const url = res.data.data.url;
            setImageUrl(url);
            onUpload(url);
            message.success('Upload ảnh thành công!');
        } catch (error) {
            console.error(error);
            message.error('Lỗi upload ảnh');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border-2 border-black border-dashed p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors relative h-32 flex items-center justify-center">
            <input 
                type="file" 
                accept="image/*" 
                onChange={handleUpload} 
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            {loading ? (
                <Loader2 className="animate-spin text-gray-400" />
            ) : imageUrl ? (
                <img src={imageUrl} alt="CCCD" className="h-full object-contain" />
            ) : (
                <div className="text-gray-400">
                    <Plus className="mx-auto mb-1" />
                    <span className="text-xs font-bold uppercase">{side === 'front' ? 'Mặt trước' : 'Mặt sau'}</span>
                </div>
            )}
        </div>
    );
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modals State
  const [liquidationModalOpen, setLiquidationModalOpen] = useState(false);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters State
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE');
  const [filterBuilding, setFilterBuilding] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');

  // Wizard State
  const [currentStep, setCurrentStep] = useState(0);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  
  // Forms
  const [contractForm] = Form.useForm();
  const [tenantForm] = Form.useForm();

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/contracts');
      setContracts(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      message.error('Không thể tải danh sách hợp đồng!');
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildings = async () => {
      try {
          const res = await axios.get('/buildings');
          setBuildings(res.data);
      } catch (error) {
          console.error(error);
      }
  };

  const fetchServices = async () => {
      try {
          const res = await servicesApi.getAll();
          setServices(res);
      } catch (error) {
          console.error(error);
      }
  };

  useEffect(() => {
    fetchContracts();
    fetchBuildings();
    fetchServices();
  }, []);

  // --- FILTER LOGIC ---
  const filteredContracts = useMemo(() => {
      return contracts.filter(contract => {
          // 1. Status Filter
          if (filterStatus === 'ACTIVE' && !contract.isActive) return false;
          if (filterStatus === 'ENDED' && contract.isActive) return false;
          if (filterStatus === 'EXPIRING') {
              if (!contract.isActive || !contract.endDate) return false;
              const daysLeft = dayjs(contract.endDate).diff(dayjs(), 'day');
              if (daysLeft < 0 || daysLeft > 30) return false;
          }

          // 2. Building Filter
          if (filterBuilding && contract.room?.building?.id !== filterBuilding) return false;

          // 3. Search Filter
          if (searchText) {
              const lowerSearch = searchText.toLowerCase();
              const tenantName = contract.tenant?.fullName?.toLowerCase() || '';
              const roomName = contract.room?.name?.toLowerCase() || '';
              const contractCode = `CTR-${contract.id.toString().padStart(3, '0')}`;
              
              if (!tenantName.includes(lowerSearch) && !roomName.includes(lowerSearch) && !contractCode.toLowerCase().includes(lowerSearch)) {
                  return false;
              }
          }

          return true;
      });
  }, [contracts, filterStatus, filterBuilding, searchText]);

  // --- WIZARD LOGIC ---
  useEffect(() => {
    if (isModalOpen && currentStep === 0) {
      // Refresh buildings if needed
    }
  }, [isModalOpen, currentStep]);

  const handleBuildingChange = async (buildingId: number) => {
    setSelectedBuilding(buildingId);
    setSelectedRoom(null);
    try {
      const res = await axios.get(`/rooms/by-building/${buildingId}`);
      const availableRooms = res.data.filter((r: any) => r.status === 'AVAILABLE');
      setRooms(availableRooms);
    } catch (error) {
      message.error('Lỗi tải danh sách phòng');
    }
  };

  const handleSearchTenant = async (value: string) => {
    if (!value) return;
    try {
      const res = await axios.get(`/tenants/search?q=${value}`);
      setTenants(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateTenantInline = async (values: any) => {
    try {
      const res = await axios.post('/tenants', values);
      setSelectedTenant(res.data);
      message.success('Đã tạo khách mới!');
    } catch (error) {
      message.error('Lỗi tạo khách hàng');
    }
  };

  useEffect(() => {
    if (currentStep === 2 && selectedRoom) {
      contractForm.setFieldsValue({
        price: selectedRoom.price,
        deposit: selectedRoom.price,
        startDate: dayjs(),
      });
    }
  }, [currentStep, selectedRoom]);

  const handleCreateContract = async () => {
    try {
      const values = await contractForm.validateFields();
      const payload = {
        ...values,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined,
        roomId: selectedRoom.id,
        tenantId: selectedTenant.id,
      };

      await axios.post('/contracts', payload);
      message.success('Tạo hợp đồng thành công! 🎉');
      setIsModalOpen(false);
      resetWizard();
      fetchContracts();
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi tạo hợp đồng');
    }
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setSelectedBuilding(null);
    setSelectedRoom(null);
    setSelectedTenant(null);
    contractForm.resetFields();
    tenantForm.resetFields();
  };

  // --- ACTIONS ---
  const handleLiquidation = async (values: any) => {
      setActionLoading(true);
      try {
          // Note: In a real app, we might want to save the liquidation record/invoice here.
          // For now, we just terminate the contract as per requirement.
          await axios.patch(`/contracts/${selectedContract.id}/terminate`);
          message.success(`Đã thanh lý hợp đồng. Hoàn lại khách: ${((selectedContract.deposit || 0) - (values.deductions || 0)).toLocaleString()}đ`);
          setLiquidationModalOpen(false);
          fetchContracts();
      } catch (error) {
          message.error('Lỗi khi thanh lý hợp đồng');
      } finally {
          setActionLoading(false);
      }
  };

  const handleExtension = async (values: any) => {
      setActionLoading(true);
      try {
          await axios.patch(`/contracts/${selectedContract.id}`, {
              endDate: values.endDate.format('YYYY-MM-DD'),
              price: values.price,
          });
          message.success('Gia hạn hợp đồng thành công!');
          setExtensionModalOpen(false);
          fetchContracts();
      } catch (error) {
          message.error('Lỗi khi gia hạn hợp đồng');
      } finally {
          setActionLoading(false);
      }
  };

  // --- TABLE COLUMNS ---
  const columns = [
      {
          title: 'SỐ HĐ',
          key: 'id',
          width: 100,
          render: (text: any, record: any) => (
              <span className="font-mono font-bold text-gray-500">
                  #{record.id}
              </span>
          ),
      },
      {
          title: 'PHÒNG',
          key: 'room',
          render: (text: any, record: any) => (
              <div>
                  <div className="font-bold text-lg">{record.room?.name}</div>
                  <div className="text-xs text-gray-500 uppercase">{record.room?.building?.name}</div>
              </div>
          ),
      },
      {
          title: 'KHÁCH THUÊ',
          key: 'tenant',
          render: (text: any, record: any) => (
              <div>
                  <div className="font-bold flex items-center gap-1"><User size={14}/> {record.tenant?.fullName}</div>
                  <div className="text-xs text-gray-500">{record.tenant?.phone}</div>
              </div>
          ),
      },
      {
          title: 'THỜI HẠN',
          key: 'duration',
          render: (text: any, record: any) => {
              const start = dayjs(record.startDate);
              const end = record.endDate ? dayjs(record.endDate) : null;
              const isExpiring = end && end.diff(dayjs(), 'day') <= 30 && end.diff(dayjs(), 'day') >= 0;
              
              return (
                  <div>
                      <div className="flex items-center gap-1 text-sm"><Calendar size={14}/> {start.format('DD/MM/YYYY')} <ArrowRight size={12}/> {end ? end.format('DD/MM/YYYY') : '∞'}</div>
                      {isExpiring && record.isActive && (
                          <div className="text-xs text-red-500 font-bold flex items-center gap-1 mt-1">
                              <Clock size={12}/> Sắp hết hạn ({end?.diff(dayjs(), 'day')} ngày)
                          </div>
                      )}
                  </div>
              );
          },
      },
      {
          title: 'GIÁ TRỊ',
          key: 'value',
          render: (text: any, record: any) => (
              <div className="font-mono text-right">
                  <div className="font-bold">{record.price?.toLocaleString()} ₫</div>
                  <div className="text-xs text-gray-500">
                      Cọc: {record.deposit?.toLocaleString()} ₫
                      {record.paidDeposit > 0 && (
                          <span className={record.paidDeposit < record.deposit ? "text-red-500 font-bold ml-1" : "text-green-600 font-bold ml-1"}>
                              (Đã đóng: {record.paidDeposit?.toLocaleString()})
                          </span>
                      )}
                  </div>
              </div>
          ),
      },
      {
          title: 'BÀN GIAO',
          key: 'initialIndexes',
          render: (text: any, record: any) => {
              if (!record.initialIndexes) return <span className="text-gray-400 text-xs">-</span>;
              return (
                  <div className="text-xs">
                      {Object.entries(record.initialIndexes).map(([serviceId, value]: [string, any]) => {
                          const serviceName = services.find(s => s.id === Number(serviceId))?.name || `Svc #${serviceId}`;
                          return (
                              <div key={serviceId} className="whitespace-nowrap">
                                  <span className="font-bold text-gray-500">{serviceName}:</span> {value}
                              </div>
                          );
                      })}
                  </div>
              );
          }
      },
      {
          title: 'TRẠNG THÁI',
          key: 'status',
          render: (text: any, record: any) => {
              if (!record.isActive) return <Tag color="red" className="font-bold border-2 border-red-200">ĐÃ THANH LÝ</Tag>;
              
              const end = record.endDate ? dayjs(record.endDate) : null;
              const isExpiring = end && end.diff(dayjs(), 'day') <= 30 && end.diff(dayjs(), 'day') >= 0;
              
              if (isExpiring) return <Tag color="orange" className="font-bold border-2 border-orange-200">SẮP HẾT HẠN</Tag>;
              return <Tag color="green" className="font-bold border-2 border-green-200">ĐANG HIỆU LỰC</Tag>;
          },
      },
      {
          title: 'THAO TÁC',
          key: 'action',
          render: (text: any, record: any) => (
              <Dropdown
                  menu={{
                      items: [
                          {
                              key: 'view',
                              label: 'Xem chi tiết',
                              icon: <FileText size={16} />,
                              onClick: () => {
                                  setSelectedContract(record);
                                  setDetailModalOpen(true);
                              }
                          },
                          {
                              key: 'extend',
                              label: 'Gia hạn hợp đồng',
                              icon: <Calendar size={16} />,
                              disabled: !record.isActive,
                              onClick: () => {
                                  setSelectedContract(record);
                                  setExtensionModalOpen(true);
                              }
                          },
                          {
                              type: 'divider'
                          },
                          {
                              key: 'terminate',
                              label: <span className="text-red-600 font-bold">Thanh lý / Kết thúc</span>,
                              icon: <Trash2 size={16} className="text-red-600" />,
                              disabled: !record.isActive,
                              onClick: () => {
                                  setSelectedContract(record);
                                  setLiquidationModalOpen(true);
                              }
                          },
                      ]
                  }}
                  trigger={['click']}
              >
                  <Button className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                      <MoreHorizontal size={16} />
                  </Button>
              </Dropdown>
          ),
      },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-black font-sans p-8">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1">Contracts</h1>
          <p className="text-gray-500 font-medium">Quản lý hợp đồng thuê nhà.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-black text-white border-2 border-black px-4 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none transition-all"
        >
          <Plus size={20} /> Tạo hợp đồng mới
        </button>
      </div>

      {/* FILTERS */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select 
              className="w-full h-10 border-2 border-black"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                  { label: 'Tất cả trạng thái', value: 'ALL' },
                  { label: 'Đang hiệu lực', value: 'ACTIVE' },
                  { label: 'Sắp hết hạn (30 ngày)', value: 'EXPIRING' },
                  { label: 'Đã thanh lý', value: 'ENDED' },
              ]}
          />
          <Select 
              className="w-full h-10 border-2 border-black"
              placeholder="Lọc theo tòa nhà"
              allowClear
              onChange={setFilterBuilding}
              options={buildings.map(b => ({ label: b.name, value: b.id }))}
          />
          <Input 
              className="w-full h-10 border-2 border-black"
              placeholder="Tìm tên khách, phòng, mã HĐ..."
              prefix={<Search size={16} className="text-gray-400"/>}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
          />
      </div>

      {/* CONTRACTS TABLE */}
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
          <Table 
              dataSource={filteredContracts}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              className="gumroad-table"
          />
      </div>

      {/* MODALS */}
      <ContractDetailModal 
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          contract={selectedContract}
          services={services}
      />

      <LiquidationModal 
          open={liquidationModalOpen}
          onCancel={() => setLiquidationModalOpen(false)}
          onConfirm={handleLiquidation}
          contract={selectedContract}
          loading={actionLoading}
      />

      <ExtensionModal
          open={extensionModalOpen}
          onCancel={() => setExtensionModalOpen(false)}
          onConfirm={handleExtension}
          contract={selectedContract}
          loading={actionLoading}
      />

      {/* CREATE CONTRACT WIZARD MODAL */}
      <Modal
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); resetWizard(); }}
        footer={null}
        width={800}
        className="gumroad-modal"
        closeIcon={<X size={20} className="text-black border-2 border-black rounded-full p-0.5 hover:bg-black hover:text-white transition-colors" />}
      >
        <div className="p-4">
          <h2 className="text-2xl font-black uppercase mb-6 text-center">Tạo hợp đồng mới</h2>
          
          <Steps 
            current={currentStep} 
            className="mb-8 font-bold"
            items={[
              { title: 'Chọn Phòng', icon: <Home size={18} /> },
              { title: 'Khách Thuê', icon: <User size={18} /> },
              { title: 'Chi tiết', icon: <FileText size={18} /> },
            ]}
          />

          <div className="min-h-[300px]">
            {/* STEP 1: SELECT ROOM */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold uppercase mb-4 bg-[#FFD700] inline-block px-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
                    1. Chọn phòng trống
                </h3>
                <div>
                  <label className="block font-bold mb-2">Chọn Tòa Nhà</label>
                  <Select 
                    className="w-full h-12 border-2 border-black"
                    placeholder="Chọn tòa nhà..."
                    onChange={handleBuildingChange}
                    options={buildings.map(b => ({ label: b.name, value: b.id }))}
                  />
                </div>
                
                {selectedBuilding && (
                  <div>
                    <label className="block font-bold mb-2">Chọn Phòng Trống ({rooms.length})</label>
                    <div className="grid grid-cols-3 gap-4">
                      {rooms.map(room => (
                        <div 
                          key={room.id}
                          onClick={() => setSelectedRoom(room)}
                          className={`
                            cursor-pointer p-4 border-2 text-center transition-all relative
                            ${selectedRoom?.id === room.id 
                              ? 'border-black bg-[#FFC900] shadow-[4px_4px_0px_0px_black]' 
                              : 'border-gray-200 hover:border-black hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="font-bold text-lg">{room.name}</div>
                          <div className="text-sm text-gray-500">{room.price.toLocaleString()} đ</div>
                          
                          {/* Display Assets if available */}
                          {room.assets && Array.isArray(room.assets) && room.assets.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1 justify-center">
                              {room.assets.map((asset: string, idx: number) => (
                                <span key={idx} className="text-[10px] bg-white border border-black px-1 rounded-sm">
                                  {asset}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {rooms.length === 0 && <p className="text-gray-400 col-span-3 text-center">Không có phòng trống.</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: SELECT TENANT */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <h3 className="text-lg font-bold uppercase mb-4 bg-[#FF69B4] inline-block px-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
                    2. Khách thuê
                </h3>
                {/* Option A: Search */}
                <div className="bg-gray-50 p-6 border-2 border-black">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><Search size={18}/> Tìm khách đã có</h3>
                  <Select
                    showSearch
                    className="w-full"
                    placeholder="Nhập tên hoặc SĐT..."
                    defaultActiveFirstOption={false}
                    showArrow={false}
                    filterOption={false}
                    onSearch={handleSearchTenant}
                    onChange={(val, option: any) => setSelectedTenant(option.data)}
                    notFoundContent={null}
                    options={tenants.map(t => ({ label: `${t.fullName} - ${t.phone}`, value: t.id, data: t }))}
                  />
                </div>

                <div className="text-center font-bold text-gray-400">- HOẶC -</div>

                {/* Option B: Create New */}
                <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><Plus size={18}/> Tạo khách mới nhanh</h3>
                  <Form form={tenantForm} onFinish={handleCreateTenantInline} layout="vertical" className="grid grid-cols-2 gap-4">
                    <Form.Item name="fullName" label="Họ tên" rules={[{ required: true }]}>
                      <Input className="gumroad-input" />
                    </Form.Item>
                    <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true }]}>
                      <Input className="gumroad-input" />
                    </Form.Item>
                    
                    {/* CCCD Upload */}
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                        <Form.Item label="CCCD Mặt Trước">
                            <UploadCCCD side="front" onUpload={(url) => tenantForm.setFieldValue(['info', 'cccdFront'], url)} />
                        </Form.Item>
                        <Form.Item label="CCCD Mặt Sau">
                            <UploadCCCD side="back" onUpload={(url) => tenantForm.setFieldValue(['info', 'cccdBack'], url)} />
                        </Form.Item>
                        {/* Hidden fields to store URLs */}
                        <Form.Item name={['info', 'cccdFront']} hidden><Input /></Form.Item>
                        <Form.Item name={['info', 'cccdBack']} hidden><Input /></Form.Item>
                    </div>

                    <div className="col-span-2 text-right">
                      <button className="gumroad-btn-secondary py-1 px-3 text-sm">Lưu khách hàng</button>
                    </div>
                  </Form>
                </div>

                {selectedTenant && (
                  <div className="mt-4 p-4 bg-green-50 border-2 border-green-500 text-green-700 font-bold flex items-center gap-2">
                    <CheckCircle size={20} />
                    <div>
                        <div>Đã chọn: {selectedTenant.fullName} ({selectedTenant.phone})</div>
                        {selectedTenant.info?.cccdFront && <div className="text-xs mt-1 text-green-600">Đã có ảnh CCCD</div>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: CONTRACT DETAILS */}
            {currentStep === 2 && (
              <div className="font-mono">
                <h3 className="text-lg font-bold uppercase mb-6 bg-[#4DA2FF] inline-block px-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
                    3. Chi tiết hợp đồng
                </h3>
                <Form form={contractForm} layout="vertical">
                  <div className="grid grid-cols-2 gap-6">
                  <Form.Item name="startDate" label="Ngày bắt đầu" rules={[{ required: true }]}>
                    <DatePicker className="w-full h-10 border-2 border-black" format="DD/MM/YYYY" />
                  </Form.Item>
                  <Form.Item name="endDate" label="Ngày kết thúc (Tùy chọn)">
                    <DatePicker className="w-full h-10 border-2 border-black" format="DD/MM/YYYY" />
                  </Form.Item>
                  <Form.Item name="price" label="Giá thuê (VNĐ)" rules={[{ required: true }]}>
                    <InputNumber className="w-full h-10 border-2 border-black pt-1" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value!.replace(/\$\s?|(,*)/g, '')} />
                  </Form.Item>
                  <Form.Item name="deposit" label="Tiền cọc (VNĐ)" rules={[{ required: true }]}>
                    <InputNumber className="w-full h-10 border-2 border-black pt-1" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value!.replace(/\$\s?|(,*)/g, '')} />
                  </Form.Item>
                  <Form.Item name="paidDeposit" label="Tiền cọc thực đóng (VNĐ)" tooltip="Số tiền khách đã đưa. Nếu ít hơn tiền cọc, hệ thống sẽ tự động truy thu vào hóa đơn tháng đầu.">
                    <InputNumber className="w-full h-10 border-2 border-black pt-1 bg-green-50" placeholder="VD: 500,000" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value!.replace(/\$\s?|(,*)/g, '')} />
                  </Form.Item>
                </div>

                {/* INITIAL INDEXES */}
                <div className="mt-6 border-2 border-black p-4 bg-[#fff59d] shadow-[4px_4px_0px_0px_black]">
                    <h3 className="font-black uppercase text-sm mb-3 flex items-center gap-2">
                        <Zap size={16} /> Chỉ số bàn giao (Ghi theo đồng hồ)
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {services.filter(s => s.type === 'INDEX').map(service => (
                            <Form.Item 
                                key={service.id}
                                label={`Số ${service.name} hiện tại`} 
                                name={['initialIndexes', service.id.toString()]} 
                                rules={[{ required: true, message: `Bắt buộc nhập số ${service.name}!` }]}
                            >
                                <InputNumber 
                                    className="w-full border-2 border-black rounded-none" 
                                    placeholder={`VD: ${service.name === 'Điện' ? '1200' : '50'}`} 
                                />
                            </Form.Item>
                        ))}
                    </div>
                    
                    <p className="text-[10px] text-gray-500 italic mt-2">
                        * Chỉ số này sẽ được dùng làm "Số cũ" cho hóa đơn tháng đầu tiên.
                    </p>
                </div>
                
                <div className="mt-6 p-4 bg-gray-100 border-2 border-black border-dashed">
                  <h4 className="font-bold uppercase mb-2">Tóm tắt hợp đồng</h4>
                  <p>Phòng: <strong>{selectedRoom?.name}</strong></p>
                  <p>Khách: <strong>{selectedTenant?.fullName}</strong></p>
                  {selectedTenant?.info?.cccdFront && <p className="text-xs text-gray-500 mt-1">(Đã có hồ sơ CCCD)</p>}
                </div>
              </Form>
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex justify-between mt-8 pt-4 border-t-2 border-black">
            <button 
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-6 py-2 font-bold border-2 border-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Quay lại
            </button>
            
            {currentStep < 2 ? (
              <button 
                disabled={(currentStep === 0 && !selectedRoom) || (currentStep === 1 && !selectedTenant)}
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2 font-bold bg-black text-white border-2 border-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tiếp tục
              </button>
            ) : (
              <button 
                onClick={handleCreateContract}
                className="px-6 py-2 font-bold bg-[#00E054] text-black border-2 border-black shadow-[4px_4px_0px_0px_black] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all"
              >
                Xác nhận tạo HĐ
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
