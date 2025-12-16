"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Select,
  DatePicker,
  InputNumber,
  message,
  Spin,
  Steps,
  Skeleton,
  ConfigProvider,
} from "antd";
import {
  SwapOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import axios from "@/lib/axios-client";
import dayjs from "dayjs";

interface MoveRoomModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  contractId?: number;
  availableRooms: any[];
  services: any[]; // List of metered services (Điện, Nước, etc.)
}

interface MeterReading {
  serviceId: number;
  serviceName: string;
  lastIndex: number;
  closingIndex: number;
  openingIndex: number;
  unitPrice: number;
  usage: number;
  cost: number;
}

export default function MoveRoomModal({
  open,
  onCancel,
  onSuccess,
  contractId,
  availableRooms,
  services,
}: MoveRoomModalProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingContract, setFetchingContract] = useState(false);

  // Contract Data (Fetched)
  const [contractData, setContractData] = useState<any>(null);

  // Step 1: Room Selection
  const [targetRoomId, setTargetRoomId] = useState<number | null>(null);
  const [moveDate, setMoveDate] = useState<dayjs.Dayjs>(dayjs());
  const [newRentPrice, setNewRentPrice] = useState<number>(0);
  const [oldRoomStatus, setOldRoomStatus] = useState<
    "AVAILABLE" | "MAINTENANCE"
  >("MAINTENANCE");

  // Step 2: Meter Readings
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>([]);

  // Step 3: Settlement
  const [settlementOption, setSettlementOption] = useState<
    "IMMEDIATE" | "DEFER"
  >("DEFER");

  // Calculated values
  const currentRoomPrice = contractData?.price || 0;
  const currentDeposit = contractData?.deposit || 0;
  const currentRoomName = contractData?.room?.name || "Loading...";

  const selectedRoom = availableRooms.find((r) => r.id === targetRoomId);
  const depositDifference = selectedRoom
    ? (selectedRoom.depositPrice || 0) - currentDeposit
    : 0;
  // const priceDifference = newRentPrice - currentRoomPrice; // Not used currently

  // Pro-rata calculation
  const daysInMonth = moveDate.daysInMonth();
  const daysAtOldRoom = moveDate.date() - 1;
  const proRataRent = Math.round(
    (daysAtOldRoom / daysInMonth) * currentRoomPrice
  );
  const totalUtilityCost = meterReadings.reduce((sum, r) => sum + r.cost, 0);

  // Fetch contract details when modal opens
  useEffect(() => {
    if (open && contractId) {
      const fetchContract = async () => {
        setFetchingContract(true);
        try {
          const res = await axios.get(`/contracts/${contractId}`);
          setContractData(res.data);
          // Auto-fill fallback if currentRoomPrice is missing
        } catch (error) {
          message.error("Không thể tải thông tin hợp đồng");
        } finally {
          setFetchingContract(false);
        }
      };
      fetchContract();

      // Reset form state
      setStep(0);
      setTargetRoomId(null);
      setMoveDate(dayjs());
      setNewRentPrice(0);
      setOldRoomStatus("MAINTENANCE");
      setMeterReadings([]);
      setSettlementOption("DEFER");
    }
  }, [open, contractId]);

  // Initialize meter readings when services are available
  useEffect(() => {
    if (services && services.length > 0 && meterReadings.length === 0) {
      const initialReadings = services
        .filter((s) => s.type === "METERED")
        .map((s) => ({
          serviceId: s.id,
          serviceName: s.name,
          lastIndex: 0, // In real app, fetch last index from API
          closingIndex: 0,
          openingIndex: 0,
          unitPrice: s.price,
          usage: 0,
          cost: 0,
        }));
      setMeterReadings(initialReadings);
    }
  }, [services, meterReadings.length]);

  // Auto-fill price when room is selected
  useEffect(() => {
    if (selectedRoom) {
      setNewRentPrice(selectedRoom.price);
    }
  }, [selectedRoom]);

  // Update usage and cost when closing index changes
  const updateMeterReading = (
    serviceId: number,
    field: "closingIndex" | "openingIndex",
    value: number
  ) => {
    setMeterReadings((prev) =>
      prev.map((r) => {
        if (r.serviceId === serviceId) {
          const updated = { ...r, [field]: value };
          if (field === "closingIndex") {
            updated.usage = Math.max(0, value - r.lastIndex);
            updated.cost = updated.usage * r.unitPrice;
          }
          return updated;
        }
        return r;
      })
    );
  };

  const handleConfirm = async () => {
    if (!contractId || !targetRoomId) {
      message.error("Vui lòng chọn phòng mới");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        contractId,
        newRoomId: targetRoomId,
        moveDate: moveDate.format("YYYY-MM-DD"),
        oldRoomStatus,
        newRentPrice,
        newDepositAmount: currentDeposit + depositDifference,
        oldRoomReadings: meterReadings
          .filter((r) => r.closingIndex > 0)
          .map((r) => ({ serviceId: r.serviceId, indexValue: r.closingIndex })),
        newRoomReadings: meterReadings
          .filter((r) => r.openingIndex > 0)
          .map((r) => ({ serviceId: r.serviceId, indexValue: r.openingIndex })),
        settlementOption,
        note: `Chuyển từ phòng ${currentRoomName} sang ${selectedRoom?.name}`,
      };

      await axios.post("/contracts/move", payload);
      message.success("Chuyển phòng thành công!");
      onSuccess();
    } catch (error: any) {
      console.error(error);
      message.error(
        error.response?.data?.message || "Có lỗi xảy ra khi chuyển phòng"
      );
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep1 = targetRoomId !== null && newRentPrice > 0;

  // Custom theme for Ant Design components to match Claude style
  const customTheme = {
    token: {
      fontFamily: "'Inter', sans-serif",
      colorPrimary: "#000000",
      borderRadius: 8,
    },
    components: {
      Select: {
        controlHeight: 48,
        borderRadius: 8,
        activeBorderColor: "#000000",
        hoverBorderColor: "#000000",
      },
      InputNumber: {
        controlHeight: 48,
        borderRadius: 8,
        activeBorderColor: "#000000",
        hoverBorderColor: "#000000",
      },
      DatePicker: {
        controlHeight: 48,
        borderRadius: 8,
        activeBorderColor: "#000000",
        hoverBorderColor: "#000000",
      },
      Button: {
        controlHeight: 48,
      },
    },
  };

  return (
    <ConfigProvider theme={customTheme}>
      <Modal
        open={open}
        onCancel={onCancel}
        footer={null}
        title={null}
        width={720}
        centered
        className="claude-modal"
        closeIcon={
          <div className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 hover:text-black">
            <span className="text-xl leading-none">×</span>
          </div>
        }
        styles={{
          body: {
            padding: 0,
            borderRadius: "16px",
            // Warm beige background characteristic of Claude's feel
            backgroundColor: "#FCFAF7",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            overflow: "hidden",
            fontFamily: "'Inter', sans-serif",
          },
          content: {
            borderRadius: "16px",
            boxShadow: "none",
            padding: 0,
          },
        }}
      >
        {/* HEADER */}
        <div className="bg-[#F5F2EE] px-8 py-5 border-b border-[#E5E0D8] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-lg text-lg shadow-sm">
              <SwapOutlined />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-serif text-[#333] m-0 leading-tight">
                Chuyển Phòng
              </h2>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-0.5">
                Move Room Wizard
              </div>
            </div>
          </div>

          {contractId && (
            <div className="bg-white px-3 py-1.5 rounded-md border border-[#E5E0D8] shadow-sm">
              <span className="text-[10px] uppercase font-bold text-gray-400 mr-2">
                Hợp đồng
              </span>
              <span className="font-mono font-bold text-lg text-black">
                #{contractId}
              </span>
            </div>
          )}
        </div>

        {/* STEPS */}
        <div className="bg-white px-8 pt-6 pb-2 border-b border-[#E5E0D8]">
          <Steps
            current={step}
            size="small"
            className="site-navigation-steps"
            items={[
              {
                title: (
                  <span className="font-semibold text-xs uppercase tracking-wider">
                    Chọn phòng
                  </span>
                ),
              },
              {
                title: (
                  <span className="font-semibold text-xs uppercase tracking-wider">
                    Chốt sổ
                  </span>
                ),
              },
              {
                title: (
                  <span className="font-semibold text-xs uppercase tracking-wider">
                    Xác nhận
                  </span>
                ),
              },
            ]}
          />
        </div>

        <div className="p-8 min-h-[480px]">
          {fetchingContract ? (
            <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
              <Spin size="large" />
              <div className="text-gray-400 font-serif italic text-lg animate-pulse">
                Đang tải thông tin...
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: Room Selection */}
              {step === 0 && (
                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* 1. Comparison Visual */}
                  <div className="relative p-6 bg-white rounded-xl border-2 border-dashed border-[#E5E0D8] hover:border-[#D1CCC0] transition-colors group">
                    {/* "Ticket" cutout effect decoration could go here */}
                    <div className="flex items-center justify-between">
                      {/* FROM */}
                      <div className="flex-1">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 pl-1">
                          Phòng Hiện Tại
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-serif font-bold text-[#1f1f1f]">
                            {currentRoomName}
                          </span>
                        </div>
                        <div className="mt-1 pl-1">
                          <span className="bg-[#F5F2EE] text-[#5c554a] text-xs font-medium px-2 py-1 rounded-md border border-[#E5E0D8]">
                            {new Intl.NumberFormat("vi-VN").format(
                              currentRoomPrice
                            )}{" "}
                            đ/tháng
                          </span>
                        </div>
                      </div>

                      {/* ARROW */}
                      <div className="px-6 flex flex-col items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity">
                        <ArrowRightOutlined className="text-2xl" />
                      </div>

                      {/* TO */}
                      <div className="flex-1 text-right">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 pr-1">
                          Chuyển Đến
                        </div>
                        <div
                          className={`text-3xl font-serif font-bold transition-colors ${
                            selectedRoom ? "text-[#D97757]" : "text-gray-300"
                          }`}
                        >
                          {selectedRoom?.name || "..."}
                        </div>
                        <div className="mt-1 flex justify-end pr-1">
                          {selectedRoom ? (
                            <span className="bg-[#FFF4F0] text-[#D97757] text-xs font-medium px-2 py-1 rounded-md border border-[#F5E6E0]">
                              {new Intl.NumberFormat("vi-VN").format(
                                selectedRoom.price
                              )}{" "}
                              đ/tháng
                            </span>
                          ) : (
                            <span className="bg-gray-50 text-gray-300 text-xs font-medium px-2 py-1 rounded-md border border-gray-100">
                              ---
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                    {/* Select Room */}
                    <div className="col-span-2">
                      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                        <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px]">
                          1
                        </span>
                        Chọn phòng mới
                      </label>
                      <Select
                        placeholder="Tìm kiếm phòng trống..."
                        className="w-full font-medium"
                        size="large"
                        value={targetRoomId}
                        onChange={setTargetRoomId}
                        showSearch
                        optionFilterProp="label"
                        style={{ height: 50 }}
                        options={availableRooms.map((r) => ({
                          value: r.id,
                          label: `${r.name} - ${new Intl.NumberFormat(
                            "vi-VN"
                          ).format(r.price)}`,
                        }))}
                      />
                    </div>

                    {/* Date */}
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                        <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px]">
                          2
                        </span>
                        Ngày chuyển
                      </label>
                      <DatePicker
                        value={moveDate}
                        onChange={(date) => date && setMoveDate(date)}
                        className="w-full font-medium"
                        format="DD/MM/YYYY"
                        style={{ height: 50 }}
                      />
                    </div>

                    {/* New Price */}
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                        <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px]">
                          3
                        </span>
                        Giá thuê mới
                      </label>
                      <InputNumber
                        value={newRentPrice}
                        onChange={(v) => setNewRentPrice(v || 0)}
                        className="w-full font-medium"
                        formatter={(v) =>
                          `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        }
                        parser={(v) =>
                          v?.replace(/\$\s?|(,*)/g, "") as unknown as number
                        }
                        style={{ height: 50 }}
                        prefix={<span className="text-gray-400 mr-2">₫</span>}
                      />
                    </div>
                  </div>

                  {/* Old Room Status */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                      <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px]">
                        4
                      </span>
                      Xử lý phòng cũ
                    </label>
                    <div className="bg-[#F5F2EE] p-1.5 rounded-xl flex gap-2 border border-[#E5E0D8]">
                      {["MAINTENANCE", "AVAILABLE"].map((status) => (
                        <button
                          key={status}
                          onClick={() =>
                            setOldRoomStatus(
                              status as "MAINTENANCE" | "AVAILABLE"
                            )
                          }
                          className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            oldRoomStatus === status
                              ? "bg-white text-black shadow-sm ring-1 ring-black/5"
                              : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                          }`}
                        >
                          {status === "MAINTENANCE"
                            ? "🔧 Chuyển Bảo Trì"
                            : "✅ Chuyển Sang Trống"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Meter Settlement */}
              {step === 1 && (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xl">
                      <ThunderboltOutlined />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-900 m-0">
                        Chốt chỉ số điện/nước
                      </h4>
                      <p className="text-xs text-amber-700 m-0 mt-0.5">
                        Nhập chỉ số cuối của phòng cũ và chỉ số đầu của phòng
                        mới
                      </p>
                    </div>
                  </div>

                  {meterReadings.length === 0 ? (
                    <div className="text-center py-16 px-8 rounded-xl border border-dashed border-gray-300 bg-gray-50">
                      <div className="text-3xl mb-3 opacity-30">🔌</div>
                      <div className="text-gray-500 font-medium">
                        Không có dịch vụ điện/nước cần chốt
                      </div>
                    </div>
                  ) : (
                    meterReadings.map((reading) => (
                      <div
                        key={reading.serviceId}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                          <span className="font-bold text-sm text-gray-700 uppercase tracking-wide">
                            {reading.serviceName}
                          </span>
                          <span className="text-xs font-mono bg-white border border-gray-200 px-2 py-1 rounded text-gray-500">
                            {new Intl.NumberFormat("vi-VN").format(
                              reading.unitPrice
                            )}{" "}
                            đ/số
                          </span>
                        </div>

                        <div className="p-5 grid grid-cols-2 gap-8 divide-x divide-gray-100">
                          {/* OLD ROOM */}
                          <div className="space-y-3">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              Phòng cũ ({currentRoomName})
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                                Chỉ số cuối
                              </label>
                              <InputNumber
                                value={reading.closingIndex}
                                onChange={(v) =>
                                  updateMeterReading(
                                    reading.serviceId,
                                    "closingIndex",
                                    v || 0
                                  )
                                }
                                className="w-full"
                                size="large"
                                min={0}
                              />
                            </div>
                            <div className="flex justify-between items-center pt-1 text-sm">
                              <span className="text-gray-500">
                                Tiêu thụ:{" "}
                                <strong className="text-black">
                                  {reading.usage}
                                </strong>
                              </span>
                              <span className="font-mono font-bold text-[#D97757]">
                                {new Intl.NumberFormat("vi-VN").format(
                                  reading.cost
                                )}{" "}
                                đ
                              </span>
                            </div>
                          </div>

                          {/* NEW ROOM */}
                          <div className="pl-8 space-y-3">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              Phòng mới ({selectedRoom?.name})
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                                Chỉ số đầu
                              </label>
                              <InputNumber
                                value={reading.openingIndex}
                                onChange={(v) =>
                                  updateMeterReading(
                                    reading.serviceId,
                                    "openingIndex",
                                    v || 0
                                  )
                                }
                                className="w-full"
                                size="large"
                                min={0}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* STEP 3: Confirmation */}
              {step === 2 && (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-serif font-bold m-0 text-gray-800">
                      Tổng kết chuyển phòng
                    </h3>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      Review final details
                    </div>
                  </div>

                  {/* Summary Bill */}
                  <div className="bg-white border rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                    <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">
                          Thanh toán
                        </div>
                        <div className="font-serif font-bold text-2xl text-gray-900">
                          Chi tiết khoản thu
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-3xl text-[#D97757]">
                          {new Intl.NumberFormat("vi-VN").format(
                            proRataRent +
                              totalUtilityCost +
                              Math.max(0, depositDifference)
                          )}{" "}
                          đ
                        </div>
                        <div className="text-xs font-semibold text-gray-400 mt-1">
                          Tổng cộng cần thu
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-dashed border-gray-100">
                        <div>
                          <div className="font-bold text-gray-700">
                            Tiền phòng cũ
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {daysAtOldRoom} ngày ở tại {currentRoomName}
                          </div>
                        </div>
                        <span className="font-mono font-bold">
                          {new Intl.NumberFormat("vi-VN").format(proRataRent)} đ
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-dashed border-gray-100">
                        <div>
                          <div className="font-bold text-gray-700">
                            Dịch vụ (Điện/Nước)
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            Tính theo chỉ số chốt
                          </div>
                        </div>
                        <span className="font-mono font-bold">
                          {new Intl.NumberFormat("vi-VN").format(
                            totalUtilityCost
                          )}{" "}
                          đ
                        </span>
                      </div>

                      {depositDifference !== 0 && (
                        <div className="flex justify-between items-center pb-3 border-b border-dashed border-gray-100">
                          <div>
                            <div className="font-bold text-gray-700">
                              Chênh lệch cọc
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {depositDifference > 0 ? "Thu thêm" : "Hoàn lại"}
                            </div>
                          </div>
                          <span
                            className={`font-mono font-bold ${
                              depositDifference > 0
                                ? "text-[#D97757]"
                                : "text-green-600"
                            }`}
                          >
                            {depositDifference > 0 ? "+" : ""}
                            {new Intl.NumberFormat("vi-VN").format(
                              depositDifference
                            )}{" "}
                            đ
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-[#F5F2EE] p-5 border-t border-gray-100">
                      <label className="text-xs font-bold uppercase text-gray-500 block mb-3">
                        Phương thức thanh toán
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setSettlementOption("IMMEDIATE")}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            settlementOption === "IMMEDIATE"
                              ? "bg-white border-black shadow-sm ring-1 ring-black"
                              : "bg-white border-gray-200 hover:border-gray-400 text-gray-600"
                          }`}
                        >
                          <div className="font-bold text-sm text-black">
                            🧾 Tạo hóa đơn ngay
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Thanh toán ngay lập tức
                          </div>
                        </button>

                        <button
                          onClick={() => setSettlementOption("DEFER")}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            settlementOption === "DEFER"
                              ? "bg-white border-black shadow-sm ring-1 ring-black"
                              : "bg-white border-gray-200 hover:border-gray-400 text-gray-600"
                          }`}
                        >
                          <div className="font-bold text-sm text-black">
                            📅 Cộng dồn tháng sau
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Gộp vào kỳ thanh toán tới
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="bg-white px-8 py-5 border-t border-gray-200 flex justify-between items-center rounded-b-[16px]">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 h-12 rounded-lg font-bold text-gray-500 hover:text-black hover:bg-gray-100 transition-colors uppercase text-xs tracking-widest"
            >
              Quay lại
            </button>
          ) : (
            <button
              onClick={onCancel}
              className="px-6 h-12 rounded-lg font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors uppercase text-xs tracking-widest"
            >
              Hủy bỏ
            </button>
          )}

          {step < 2 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 0 && !canProceedStep1}
              className="px-8 h-12 bg-[#1f1f1f] text-white rounded-lg font-bold text-sm shadow-lg hover:bg-black hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 uppercase tracking-wide flex items-center gap-2"
            >
              Tiếp tục <ArrowRightOutlined className="text-xs" />
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-8 h-12 bg-[#D97757] text-white rounded-lg font-bold text-sm shadow-lg hover:bg-[#c56a4b] hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 uppercase tracking-wide flex items-center gap-2"
            >
              {loading ? (
                <Spin size="small" className="text-white" />
              ) : (
                <CheckCircleOutlined />
              )}
              Xác nhận chuyển
            </button>
          )}
        </div>
      </Modal>
    </ConfigProvider>
  );
}
