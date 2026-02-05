"use client";
import { useState, useEffect } from "react";
import {
  Table,
  Modal,
  Form,
  InputNumber,
  Select,
  message,
  DatePicker,
  Popconfirm,
  Input,
} from "antd";
import {
  Plus,
  Trash2,
  Zap,
  Droplets,
  Filter,
  Check,
  Loader2,
} from "lucide-react";
import { readingsApi } from "@/lib/api/readings";
import { servicesApi } from "@/lib/api/services";
import {
  ServiceReading,
  BulkRoomItem,
  BulkServiceItem,
  BulkCreateResult,
  CreateReadingDto,
} from "@/types/reading";
import { Service, ServiceType } from "@/types/service";
import dayjs from "dayjs";
import axios from "@/lib/axios-client";

export default function ReadingsPage() {
  const [readings, setReadings] = useState<ServiceReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [buildings, setBuildings] = useState<{ id: number; name: string }[]>(
    [],
  );

  // Filters
  const [month, setMonth] = useState(dayjs().format("MM-YYYY"));
  const [selectedService, setSelectedService] = useState<number | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [serviceData, buildingRes, readingData] = await Promise.all([
        servicesApi.getByType(ServiceType.INDEX),
        axios.get("/buildings"),
        readingsApi.findAll(month, selectedService || undefined),
      ]);

      setServices(serviceData);
      setBuildings(buildingRes.data);
      setReadings(readingData);
    } catch (error) {
      console.error(error);
      message.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, selectedService]);

  const handleSave = async (values: {
    buildingId: number;
    bulkReadings: BulkRoomItem[];
  }) => {
    try {
      setModalLoading(true);
      // Flatten the bulkReadings structure
      const readings: Omit<CreateReadingDto, "month">[] = [];

      values.bulkReadings.forEach((room: BulkRoomItem) => {
        room.services.forEach((service: BulkServiceItem) => {
          // Only include if newIndex is entered
          if (service.newIndex !== undefined && service.newIndex !== null) {
            readings.push({
              contractId: room.contractId,
              serviceId: service.serviceId,
              newIndex: service.newIndex,
              oldIndex: service.oldIndex,
              isMeterReset: service.isMeterReset,
            });
          }
        });
      });

      if (readings.length === 0) {
        message.warning("Chưa nhập chỉ số nào!");
        setModalLoading(false);
        return;
      }

      const response = await readingsApi.bulkCreate(month, readings);

      const successes = response.filter(
        (r: BulkCreateResult) => r.success,
      ).length;
      const failures = response.filter((r: BulkCreateResult) => !r.success);

      if (successes > 0) {
        message.success(`Đã lưu thành công ${successes} chỉ số!`);
      }

      if (failures.length > 0) {
        console.error("Bulk create failures:", failures);
        const errorMsg = failures
          .map((f: BulkCreateResult) => `Dịch vụ ${f.serviceId}: ${f.error}`)
          .join("\n");
        message.warning({
          content: `Có ${failures.length} chỉ số lỗi: ${errorMsg}`,
          style: { whiteSpace: "pre-wrap" }, // Allow multiline
          duration: 5,
        });
      }

      if (successes > 0) {
        form.resetFields();
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error(error);
      message.error("Lỗi hệ thống khi lưu chỉ số");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await readingsApi.delete(id);
      message.success("Đã xóa bản ghi!");
      fetchData();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi xóa");
    }
  };

  // --- RENDER HELPERS ---
  const getServiceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("điện"))
      return <Zap size={16} className="text-yellow-600" />;
    if (n.includes("nước"))
      return <Droplets size={16} className="text-blue-600" />;
    return <Zap size={16} className="text-gray-600" />;
  };

  const ServiceBadge = ({ name }: { name: string }) => {
    const n = name.toLowerCase();
    let colorClass = "bg-gray-100 text-gray-700 border-gray-200";
    if (n.includes("điện"))
      colorClass = "bg-yellow-50 text-yellow-700 border-yellow-200";
    if (n.includes("nước"))
      colorClass = "bg-blue-50 text-blue-700 border-blue-200";

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${colorClass}`}
      >
        {getServiceIcon(name)}
        {name}
      </span>
    );
  };

  const columns = [
    {
      title: "Phòng / Tòa nhà",
      key: "room",
      className:
        "bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3",
      render: (_: unknown, record: ServiceReading) => (
        <div>
          <div className="font-bold text-gray-900">
            {record.contract?.room.name}
          </div>
          <div className="text-xs text-gray-400 font-medium">
            {record.contract?.room.building.name}
          </div>
        </div>
      ),
    },
    {
      title: "Dịch vụ",
      dataIndex: ["service", "name"],
      key: "service",
      className:
        "bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3",
      render: (text: string) => {
        let Icon = Zap;
        let colorClass = "text-yellow-600 bg-yellow-50 border-yellow-100";
        if (text.toLowerCase().includes("nước")) {
          Icon = Droplets;
          colorClass = "text-blue-600 bg-blue-50 border-blue-100";
        }
        return (
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center border ${colorClass}`}
            >
              <Icon size={14} />
            </div>
            <span className="font-semibold text-gray-700 text-sm">{text}</span>
          </div>
        );
      },
    },
    {
      title: "Chỉ số cũ",
      dataIndex: "oldIndex",
      key: "oldIndex",
      align: "right" as const,
      className:
        "bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3",
      render: (val: number) => (
        <span className="font-mono text-gray-600">{val.toLocaleString()}</span>
      ),
    },
    {
      title: "Chỉ số mới",
      dataIndex: "newIndex",
      key: "newIndex",
      align: "right" as const,
      className:
        "bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3",
      render: (val: number) => (
        <span className="font-bold text-blue-600 font-mono">
          {val.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Sử dụng",
      dataIndex: "usage",
      key: "usage",
      align: "center" as const,
      className:
        "bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3",
      render: (val: number, record: ServiceReading) => (
        <span className="font-bold text-gray-700 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
          {val} {record.service.unit}
        </span>
      ),
    },
    {
      title: "Thành tiền",
      dataIndex: "totalCost",
      key: "totalCost",
      align: "right" as const,
      className:
        "bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3",
      render: (val: number) => (
        <span className="font-bold text-emerald-600 font-mono">
          {val.toLocaleString()} đ
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isBilled",
      key: "isBilled",
      className:
        "bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3",
      render: (isBilled: boolean) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            isBilled
              ? "bg-green-100 text-green-800"
              : "bg-orange-100 text-orange-800"
          }`}
        >
          {isBilled ? "Đã lên HĐ" : "Chưa lên HĐ"}
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      className:
        "bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3",
      render: (_: unknown, record: ServiceReading) =>
        !record.isBilled && (
          <Popconfirm
            title="Xác nhận xóa?"
            description="Hành động này không thể hoàn tác."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, type: "primary" }}
          >
            <button className="text-gray-400 hover:text-red-500 transition-colors p-1">
              <Trash2 size={16} />
            </button>
          </Popconfirm>
        ),
    },
  ];

  return (
    <div className="claude-page p-3 md:p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 md:gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl claude-header mb-1 md:mb-2">
              Chốt số điện nước
            </h1>
            <p className="text-gray-500 font-sans text-sm md:text-base lg:text-lg">
              Ghi nhận và quản lý chỉ số dịch vụ hàng tháng.
            </p>
          </div>

          <button
            onClick={() => {
              form.resetFields();
              setIsModalOpen(true);
            }}
            className="claude-btn-primary flex items-center gap-2 w-full md:w-auto justify-center"
          >
            <Plus size={20} />
            <span>Chốt số mới</span>
          </button>
        </div>

        {/* FILTERS */}
        <div className="bg-white p-3 md:p-4 rounded-2xl border border-gray-200 shadow-sm mb-6 md:mb-8 flex flex-wrap items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2 text-gray-500 px-1 md:px-2">
            <Filter size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="font-bold text-xs md:text-sm uppercase tracking-wide">
              Bộ lọc
            </span>
          </div>

          <DatePicker
            picker="month"
            format="MM-YYYY"
            allowClear={false}
            value={dayjs(month, "MM-YYYY")}
            onChange={(date) =>
              setMonth(
                date ? date.format("MM-YYYY") : dayjs().format("MM-YYYY"),
              )
            }
            className="h-9 md:h-10 w-32 md:w-40 border-gray-200 hover:border-[#D97757] focus:border-[#D97757] rounded-xl font-medium text-sm"
          />

          <Select
            placeholder="Tất cả dịch vụ"
            allowClear
            className="flex-1 min-w-[140px] md:flex-none md:w-48 h-9 md:h-10"
            value={selectedService}
            onChange={(val) => setSelectedService(val ?? null)}
            options={services.map((s) => ({ label: s.name, value: s.id }))}
          />
        </div>

        {/* CONTENT */}
        {/* DESKTOP TABLE */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <Table
            columns={columns}
            dataSource={readings}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            rowClassName="hover:bg-gray-50 transition-colors"
            className="claude-table"
          />
        </div>

        {/* MOBILE CARD VIEW */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <Loader2
                className="animate-spin mx-auto mb-2 text-gray-400"
                size={24}
              />
              <p className="text-gray-500 text-sm">Đang tải...</p>
            </div>
          ) : readings.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <p className="text-gray-500 text-sm">Không có dữ liệu</p>
            </div>
          ) : (
            readings.map((record) => (
              <div
                key={record.id}
                className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-gray-900 text-sm">
                      {record.contract?.room.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {record.contract?.room.building.name}
                    </div>
                  </div>
                  {!record.isBilled && (
                    <Popconfirm
                      title="Xác nhận xóa?"
                      description="Hành động này không thể hoàn tác."
                      onConfirm={() => handleDelete(record.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true, type: "primary" }}
                    >
                      <button className="text-gray-400 hover:text-red-500 transition-colors p-1">
                        <Trash2 size={16} />
                      </button>
                    </Popconfirm>
                  )}
                </div>
                <ServiceBadge name={record.service.name} />
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div>
                    <div className="text-gray-400 uppercase mb-1">
                      Chỉ số cũ
                    </div>
                    <div className="font-mono text-gray-600">
                      {record.oldIndex.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 uppercase mb-1">
                      Chỉ số mới
                    </div>
                    <div className="font-bold text-blue-600 font-mono">
                      {record.newIndex.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 uppercase mb-1">Sử dụng</div>
                    <div className="font-bold text-gray-700 font-mono">
                      {record.usage} {record.service.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 uppercase mb-1">
                      Thành tiền
                    </div>
                    <div className="font-bold text-emerald-600 font-mono text-xs">
                      {record.totalCost.toLocaleString()} đ
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      record.isBilled
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {record.isBilled ? "Đã lên HĐ" : "Chưa lên HĐ"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width="95vw"
        style={{ maxWidth: 900 }}
        className="claude-modal"
        centered
        destroyOnHidden
        closeIcon={
          <div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
            <span className="text-base md:text-lg">✕</span>
          </div>
        }
      >
        <div className="p-0 flex flex-col h-[90vh] md:h-[85vh] max-h-[800px]">
          {/* MODAL HEADER */}
          <div className="p-4 md:p-6 border-b border-gray-100 flex-shrink-0 bg-white rounded-t-2xl z-10">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
              <span>Chốt số tháng {month}</span>
              <span className="text-xs md:text-sm font-normal text-gray-400 bg-gray-50 px-2 md:px-3 py-1 rounded-full border border-gray-100 w-fit">
                {modalLoading ? "Đang tải dữ liệu..." : "Chế độ nhập liệu"}
              </span>
            </h2>
            <p className="text-gray-500 text-xs md:text-sm mt-1">
              Nhập chỉ số điện, nước cho từng phòng. Hệ thống tự động tính toán
              mức sử dụng.
            </p>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto bg-[#F9F9F7] p-3 md:p-6 custom-scrollbar">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              className="claude-form"
            >
              {/* BUILDING SELECTOR */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-6 sticky top-0 z-20">
                <Form.Item
                  name="buildingId"
                  label={
                    <span className="text-gray-500 font-semibold uppercase text-xs tracking-wider">
                      Chọn Tòa Nhà
                    </span>
                  }
                  rules={[{ required: true, message: "Vui lòng chọn tòa nhà" }]}
                  className="mb-0"
                >
                  <Select
                    className="h-12 text-lg font-bold"
                    placeholder="-- Chọn tòa nhà để bắt đầu --"
                    bordered={false}
                    suffixIcon={<Filter size={18} className="text-gray-400" />}
                    onChange={async (val) => {
                      setModalLoading(true);
                      try {
                        const data = await readingsApi.prepareBulk({
                          buildingId: val,
                          month,
                        });
                        const formReadings = data.map((room: BulkRoomItem) => ({
                          roomId: room.roomId,
                          roomName: room.roomName,
                          contractId: room.contractId,
                          services: room.services.map((s: BulkServiceItem) => ({
                            serviceId: s.serviceId,
                            serviceName: s.serviceName,
                            price: s.price,
                            oldIndex: s.oldIndex,
                            newIndex: s.newIndex,
                            isMeterReset: false,
                          })),
                        }));
                        form.setFieldValue("bulkReadings", formReadings);
                      } catch (error) {
                        console.error(error);
                        message.error("Lỗi tải dữ liệu tòa nhà");
                      } finally {
                        setModalLoading(false);
                      }
                    }}
                  >
                    {buildings.map((b) => (
                      <Select.Option key={b.id} value={b.id}>
                        {b.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              {/* ROOM CARDS */}
              <Form.List name="bulkReadings">
                {(fields) => (
                  <div className="grid gap-6">
                    {fields.map((field, index) => {
                      const room = form.getFieldValue(["bulkReadings", index]);
                      return (
                        <div
                          key={field.key}
                          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
                        >
                          {/* Room Header */}
                          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">
                                {room.roomName}
                              </h3>
                              <p className="text-xs text-gray-400 font-mono mt-0.5">
                                Hợp đồng #{room.contractId}
                              </p>
                            </div>
                            <div className="bg-white px-3 py-1 rounded-full border border-gray-200 text-xs font-bold text-gray-500 shadow-sm">
                              {room.services.length} dịch vụ
                            </div>
                            {/* Hidden Contract ID */}
                            <Form.Item
                              name={[field.name, "contractId"]}
                              hidden
                              initialValue={room.contractId}
                            >
                              <Input />
                            </Form.Item>
                          </div>

                          {/* Services List */}
                          <div className="divide-y divide-gray-100 px-6">
                            {room.services.map(
                              (service: BulkServiceItem, sIndex: number) => (
                                <div
                                  key={service.serviceId}
                                  className="py-4 flex flex-col md:flex-row md:items-center gap-4 group/service"
                                >
                                  {/* Service Icon & Name */}
                                  <div className="w-full md:w-1/4 flex items-center gap-3">
                                    <ServiceBadge name={service.serviceName} />
                                    {/* Hidden Fields for Service */}
                                    <Form.Item
                                      name={[
                                        field.name,
                                        "services",
                                        sIndex,
                                        "serviceId",
                                      ]}
                                      hidden
                                      initialValue={service.serviceId}
                                    >
                                      <Input />
                                    </Form.Item>
                                    <Form.Item
                                      name={[
                                        field.name,
                                        "services",
                                        sIndex,
                                        "oldIndex",
                                      ]}
                                      hidden
                                      initialValue={service.oldIndex}
                                    >
                                      <Input />
                                    </Form.Item>
                                  </div>

                                  {/* Indexes */}
                                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                                    <div className="text-right">
                                      <div className="text-[10px] uppercase text-gray-400 font-bold mb-1">
                                        Chỉ số cũ
                                      </div>
                                      <div className="font-mono text-gray-600 bg-gray-50 px-2 py-1.5 rounded-lg border border-transparent group-hover/service:border-gray-200 text-center">
                                        {service.oldIndex?.toLocaleString() ||
                                          0}
                                      </div>
                                    </div>

                                    <div className="col-span-1 md:col-span-2">
                                      <div className="text-[10px] uppercase text-blue-600 font-bold mb-1 ml-1">
                                        Chỉ số mới
                                      </div>
                                      <Form.Item
                                        name={[
                                          field.name,
                                          "services",
                                          sIndex,
                                          "newIndex",
                                        ]}
                                        className="mb-0"
                                        rules={[
                                          ({ getFieldValue }) => ({
                                            validator(_, value) {
                                              if (
                                                value === undefined ||
                                                value === null ||
                                                value === ""
                                              )
                                                return Promise.resolve();
                                              const old =
                                                getFieldValue([
                                                  "bulkReadings",
                                                  index,
                                                  "services",
                                                  sIndex,
                                                  "oldIndex",
                                                ]) || 0;
                                              const isReset = getFieldValue([
                                                "bulkReadings",
                                                index,
                                                "services",
                                                sIndex,
                                                "isMeterReset",
                                              ]);
                                              if (!isReset && value < old)
                                                return Promise.reject(
                                                  new Error("Phải >= cũ"),
                                                );
                                              return Promise.resolve();
                                            },
                                          }),
                                        ]}
                                      >
                                        <InputNumber
                                          className="w-full h-10 rounded-lg font-bold font-mono border-gray-200 focus:border-blue-500 focus:shadow-blue-100"
                                          placeholder="Nhập..."
                                          formatter={(value) =>
                                            `${value}`.replace(
                                              /\B(?=(\d{3})+(?!\d))/g,
                                              ",",
                                            )
                                          }
                                          parser={(value) =>
                                            value
                                              ? value.replace(/\$\s?|(,*)/g, "")
                                              : ""
                                          }
                                        />
                                      </Form.Item>
                                    </div>

                                    <div className="text-right">
                                      <div className="text-[10px] uppercase text-gray-400 font-bold mb-1 text-center">
                                        Tiêu thụ
                                      </div>
                                      <Form.Item shouldUpdate className="mb-0">
                                        {({ getFieldValue }) => {
                                          const s = getFieldValue([
                                            "bulkReadings",
                                            index,
                                            "services",
                                            sIndex,
                                          ]);
                                          if (
                                            !s ||
                                            s.newIndex === undefined ||
                                            s.newIndex === null ||
                                            s.newIndex === ""
                                          )
                                            return (
                                              <span className="text-gray-300">
                                                -
                                              </span>
                                            );
                                          const usage = s.isMeterReset
                                            ? s.newIndex
                                            : Math.max(
                                                0,
                                                s.newIndex - s.oldIndex,
                                              );
                                          return (
                                            <span className="font-bold text-blue-600 font-mono text-lg block text-center bg-blue-50 px-2 py-1 rounded-lg">
                                              {usage.toLocaleString()}
                                            </span>
                                          );
                                        }}
                                      </Form.Item>
                                    </div>
                                  </div>

                                  {/* Action / Reset */}
                                  <div className="w-full md:w-auto flex justify-end md:justify-center pl-4 border-l border-gray-100">
                                    <Form.Item
                                      name={[
                                        field.name,
                                        "services",
                                        sIndex,
                                        "isMeterReset",
                                      ]}
                                      valuePropName="checked"
                                      className="mb-0"
                                    >
                                      <div
                                        className="cursor-pointer group/reset flex items-center gap-2"
                                        onClick={() => {
                                          const readings =
                                            form.getFieldValue("bulkReadings");
                                          const currentVal =
                                            readings[index].services[sIndex]
                                              .isMeterReset;
                                          readings[index].services[
                                            sIndex
                                          ].isMeterReset = !currentVal;
                                          form.setFieldValue("bulkReadings", [
                                            ...readings,
                                          ]);
                                        }}
                                      >
                                        <div className="text-[10px] font-bold text-gray-400 group-hover/reset:text-orange-500 uppercase">
                                          Reset
                                        </div>
                                        <Form.Item
                                          shouldUpdate
                                          className="mb-0"
                                        >
                                          {({ getFieldValue }) => {
                                            const isReset = getFieldValue([
                                              "bulkReadings",
                                              index,
                                              "services",
                                              sIndex,
                                              "isMeterReset",
                                            ]);
                                            return (
                                              <div
                                                className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${
                                                  isReset
                                                    ? "bg-orange-500 border-orange-500"
                                                    : "bg-white border-gray-300"
                                                }`}
                                              >
                                                {isReset && (
                                                  <Check
                                                    size={12}
                                                    className="text-white"
                                                  />
                                                )}
                                              </div>
                                            );
                                          }}
                                        </Form.Item>
                                      </div>
                                    </Form.Item>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {fields.length === 0 && (
                      <div className="py-20 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                          <Filter size={24} />
                        </div>
                        <p className="text-gray-500 font-medium">
                          Chọn tòa nhà để bắt đầu nhập liệu
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Form.List>
            </Form>
          </div>

          {/* MODAL FOOTER */}
          <div className="p-5 border-t border-gray-100 bg-white rounded-b-2xl flex-shrink-0 z-10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs text-gray-500 hidden md:block">
              <span className="font-bold text-gray-900">*Lưu ý:</span> Bạn có
              thể lưu từng phần. Chỉ những ô có dữ liệu mới được cập nhật.
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 md:flex-none px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors text-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => form.submit()}
                disabled={modalLoading}
                className={`flex-1 md:flex-none px-8 py-3 font-bold bg-[#D97757] text-white rounded-xl shadow-lg shadow-orange-200 hover:bg-[#c06040] hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2 ${
                  modalLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {modalLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={18} />
                )}
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
