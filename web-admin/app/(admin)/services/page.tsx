'use client';
import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Switch, message, Popconfirm } from 'antd';
import { Plus, Edit, Trash2, Zap, Droplets, Wifi, Box } from 'lucide-react';
import { servicesApi } from '@/lib/api/services';
import { Service, ServiceType, CalculationType } from '@/types/service';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await servicesApi.getAll(true); // Include inactive
      setServices(data);
    } catch (error) {
      console.error(error);
      message.error('Lỗi tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSave = async (values: any) => {
    try {
      setSubmitting(true);
      if (editingId) {
        await servicesApi.update(editingId, values);
        message.success('Cập nhật dịch vụ thành công!');
      } else {
        await servicesApi.create(values);
        message.success('Thêm dịch vụ thành công!');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
      fetchServices();
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi lưu dịch vụ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (record: Service) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await servicesApi.delete(id);
      message.success('Đã xóa dịch vụ!');
      fetchServices();
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi xóa dịch vụ');
    }
  };

  const handleSeed = async () => {
    try {
      await servicesApi.seed();
      message.success('Đã khởi tạo dữ liệu mẫu!');
      fetchServices();
    } catch (error) {
      message.error('Lỗi khởi tạo');
    }
  };

  const columns = [
    {
      title: 'DỊCH VỤ',
      dataIndex: 'name',
      key: 'name',
      className: 'bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3',
      render: (text: string, record: Service) => {
        let Icon = Box;
        let colorClass = "text-gray-600 bg-gray-100 border-gray-200";
        
        if (text.toLowerCase().includes('điện')) {
            Icon = Zap;
            colorClass = "text-yellow-600 bg-yellow-50 border-yellow-100";
        }
        if (text.toLowerCase().includes('nước')) {
            Icon = Droplets;
            colorClass = "text-blue-600 bg-blue-50 border-blue-100";
        }
        if (text.toLowerCase().includes('wifi') || text.toLowerCase().includes('internet')) {
            Icon = Wifi;
            colorClass = "text-purple-600 bg-purple-50 border-purple-100";
        }
        
        return (
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${colorClass}`}>
                <Icon size={16} />
            </div>
            <span className="font-semibold text-gray-700">{text}</span>
          </div>
        );
      },
    },
    {
      title: 'ĐƠN GIÁ',
      dataIndex: 'price',
      key: 'price',
      className: 'bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3',
      render: (val: number) => <span className="font-mono font-bold text-gray-700">{val.toLocaleString()} đ</span>,
    },
    {
      title: 'ĐƠN VỊ',
      dataIndex: 'unit',
      key: 'unit',
      className: 'bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3',
      render: (text: string) => <span className="text-gray-600 font-medium text-xs bg-gray-100 px-2 py-1 rounded">{text}</span>,
    },
    {
      title: 'LOẠI',
      dataIndex: 'type',
      key: 'type',
      className: 'bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3',
      render: (type: ServiceType) => (
        <span className={`text-xs font-medium px-2 py-1 rounded ${type === ServiceType.INDEX ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
          {type === ServiceType.INDEX ? 'Theo chỉ số' : 'Cố định'}
        </span>
      ),
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'isActive',
      key: 'isActive',
      className: 'bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3',
      render: (isActive: boolean) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {isActive ? 'Đang dùng' : 'Ngưng dùng'}
        </span>
      ),
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      className: 'bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3',
      render: (_: any, record: Service) => (
        <div className="flex gap-2">
          <button 
            onClick={() => handleEdit(record)}
            className="text-gray-400 hover:text-blue-500 transition-colors p-1"
          >
            <Edit size={16} />
          </button>
          <Popconfirm 
            title="Xác nhận xóa?" 
            description="Hành động này không thể hoàn tác."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, type: 'primary' }}
          >
            <button className="text-gray-400 hover:text-red-500 transition-colors p-1">
                <Trash2 size={16} />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-gray-800 font-sans p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quản lý Dịch vụ</h1>
          <p className="text-gray-500 text-sm mt-1">Thiết lập giá điện, nước và các chi phí khác.</p>
        </div>
        
        <div className="flex gap-3">
            {services.length === 0 && (
                <Button onClick={handleSeed}>Khởi tạo mẫu</Button>
            )}
            <button 
            onClick={() => {
                setEditingId(null);
                form.resetFields();
                setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-gray-800 transition-all text-sm"
            >
            <Plus size={16} /> Thêm dịch vụ
            </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
        <Table
          columns={columns}
          dataSource={services}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </div>

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        title={null}
        className="gumroad-modal"
        width={500}
        closeIcon={<span className="text-xl font-bold">✕</span>}
      >
        <div className="bg-white" style={{ backgroundImage: 'linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(to right, #E5E7EB 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            {/* HEADER */}
            <div className="bg-[#FFD700] border-b-3 border-black p-6 flex items-center justify-between border-b-[3px]">
                <div className="bg-white border-2 border-black px-4 py-1 transform -rotate-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-2xl font-black uppercase m-0 tracking-tighter">
                        {editingId ? 'SỬA DỊCH VỤ' : 'THÊM DỊCH VỤ'}
                    </h2>
                </div>
            </div>

            <div className="p-8">
                <Form form={form} layout="vertical" onFinish={handleSave} className="font-mono">
                    
                    {/* NAME */}
                    <div className="mb-6">
                        <div className="inline-block bg-[#FF69B4] border-2 border-black px-3 py-1 mb-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
                            <span className="font-black text-sm uppercase text-white tracking-wide">TÊN DỊCH VỤ</span>
                        </div>
                        <Form.Item name="name" rules={[{ required: true }]} className="mb-0">
                            <Input 
                                className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-lg py-2 px-3 focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all rounded-none" 
                                placeholder="VD: Điện sinh hoạt" 
                            />
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                        {/* PRICE */}
                        <div>
                            <div className="inline-block bg-[#4DA2FF] border-2 border-black px-3 py-1 mb-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
                                <span className="font-black text-sm uppercase text-white tracking-wide">ĐƠN GIÁ</span>
                            </div>
                            <Form.Item name="price" rules={[{ required: true }]} className="mb-0">
                                <InputNumber 
                                    className="w-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-lg py-1 px-1 focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all rounded-none" 
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                                />
                            </Form.Item>
                        </div>

                        {/* UNIT */}
                        <div>
                            <div className="inline-block bg-[#00E054] border-2 border-black px-3 py-1 mb-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
                                <span className="font-black text-sm uppercase text-white tracking-wide">ĐƠN VỊ</span>
                            </div>
                            <Form.Item name="unit" rules={[{ required: true }]} className="mb-0">
                                <Input 
                                    className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-lg py-2 px-3 focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all rounded-none" 
                                    placeholder="VD: kWh" 
                                />
                            </Form.Item>
                        </div>
                    </div>

                    {/* TYPE */}
                    <div className="mb-6">
                        <div className="inline-block bg-[#FFD700] border-2 border-black px-3 py-1 mb-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
                            <span className="font-black text-sm uppercase text-black tracking-wide">LOẠI DỊCH VỤ</span>
                        </div>
                        <Form.Item name="type" rules={[{ required: true }]} className="mb-0">
                            <Select 
                                className="h-12 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none [&_.ant-select-selector]:!border-0 [&_.ant-select-selector]:!bg-transparent [&_.ant-select-selector]:!h-full [&_.ant-select-selector]:!flex [&_.ant-select-selector]:!items-center"
                                dropdownStyle={{ border: '2px solid black', borderRadius: 0, boxShadow: '4px 4px 0px 0px #000' }}
                            >
                                <Select.Option value={ServiceType.INDEX}>Theo chỉ số (Điện/Nước)</Select.Option>
                                <Select.Option value={ServiceType.FIXED}>Cố định (Wifi/Rác)</Select.Option>
                            </Select>
                        </Form.Item>
                    </div>
                    
                    <Form.Item 
                        noStyle
                        shouldUpdate={(prev, current) => prev.type !== current.type}
                    >
                        {({ getFieldValue }) => 
                            getFieldValue('type') === ServiceType.FIXED ? (
                                <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                                    <div className="inline-block bg-[#FF90E8] border-2 border-black px-3 py-1 mb-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
                                        <span className="font-black text-sm uppercase text-black tracking-wide">CÁCH TÍNH</span>
                                    </div>
                                    <Form.Item name="calculationType" className="mb-0">
                                        <Select 
                                            className="h-12 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none [&_.ant-select-selector]:!border-0 [&_.ant-select-selector]:!bg-transparent [&_.ant-select-selector]:!h-full [&_.ant-select-selector]:!flex [&_.ant-select-selector]:!items-center"
                                            dropdownStyle={{ border: '2px solid black', borderRadius: 0, boxShadow: '4px 4px 0px 0px #000' }}
                                        >
                                            <Select.Option value={CalculationType.PER_ROOM}>Theo phòng</Select.Option>
                                            <Select.Option value={CalculationType.PER_PERSON}>Theo người</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </div>
                            ) : null
                        }
                    </Form.Item>

                    <div className="mb-8 border-2 border-black p-4 bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-lg uppercase">TRẠNG THÁI</span>
                            <Form.Item name="isActive" valuePropName="checked" initialValue={true} className="mb-0">
                                <Switch checkedChildren="ON" unCheckedChildren="OFF" className="bg-gray-300 [&.ant-switch-checked]:bg-[#00E054]" />
                            </Form.Item>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t-2 border-black border-dashed">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)} 
                            className="px-6 py-3 font-black uppercase border-2 border-black bg-white hover:bg-gray-100 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                        >
                            Hủy bỏ
                        </button>
                        <button 
                            type="submit" 
                            disabled={submitting} 
                            className="px-6 py-3 font-black uppercase border-2 border-black bg-[#FFD700] text-black hover:bg-[#FFC000] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                        >
                            {submitting ? 'ĐANG LƯU...' : 'LƯU DỊCH VỤ'}
                        </button>
                    </div>
                </Form>
            </div>
        </div>
      </Modal>
    </div>
  );
}
