import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState, useEffect, useMemo } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";

// ── Types ──
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

// ── Helpers ──
// Unused
// const formatCurrency = (value: number) =>
//   new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
//     value,
//   );

const formatShortCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);

const formatDate = (d: Date) =>
  `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;

// ────────────────────────────────────────────────────────
export default function MoveRoomScreen() {
  const { contractId, roomName, roomPrice, deposit } = useLocalSearchParams<{
    contractId: string;
    roomName: string;
    roomPrice: string;
    deposit: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  // ── Wizard state ──
  const [step, setStep] = useState(0);
  const [moveDate, setMoveDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [targetRoomId, setTargetRoomId] = useState<number | null>(null);
  const [newRentPrice, setNewRentPrice] = useState("");
  const [oldRoomStatus, setOldRoomStatus] = useState<
    "MAINTENANCE" | "AVAILABLE"
  >("MAINTENANCE");
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>([]);
  const [settlementOption, setSettlementOption] = useState<
    "IMMEDIATE" | "DEFER"
  >("DEFER");

  const currentRoomPrice = Number(roomPrice) || 0;
  const currentDeposit = Number(deposit) || 0;
  const currentRoomName = roomName || "...";

  // ── Fetch available rooms ──
  const { data: availableRooms = [] } = useQuery({
    queryKey: ["rooms-available"],
    queryFn: async () => {
      const res = await api.get("/rooms", { params: { status: "AVAILABLE" } });
      return res.data;
    },
  });

  // ── Fetch services (METERED) ──
  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await api.get("/services");
      return res.data;
    },
  });

  // ── Init meter readings from services ──
  useEffect(() => {
    if (services.length > 0 && meterReadings.length === 0) {
      const initial = services
        .filter((s: any) => s.type === "METERED")
        .map((s: any) => ({
          serviceId: s.id,
          serviceName: s.name,
          lastIndex: 0,
          closingIndex: 0,
          openingIndex: 0,
          unitPrice: s.price,
          usage: 0,
          cost: 0,
        }));
      setMeterReadings(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services]);

  // ── Selected room ──
  const selectedRoom = useMemo(
    () => availableRooms.find((r: any) => r.id === targetRoomId),
    [availableRooms, targetRoomId],
  );

  // ── Auto-fill price when room selected ──
  useEffect(() => {
    if (selectedRoom) {
      setNewRentPrice(selectedRoom.price?.toString() || "");
    }
  }, [selectedRoom]);

  // ── Calculations ──
  const depositDifference = selectedRoom
    ? (selectedRoom.depositPrice || 0) - currentDeposit
    : 0;
  const daysInMonth = new Date(
    moveDate.getFullYear(),
    moveDate.getMonth() + 1,
    0,
  ).getDate();
  const daysAtOldRoom = moveDate.getDate() - 1;
  const proRataRent = Math.round(
    (daysAtOldRoom / daysInMonth) * currentRoomPrice,
  );
  const totalUtilityCost = meterReadings.reduce((sum, r) => sum + r.cost, 0);
  const totalCharge =
    proRataRent + totalUtilityCost + Math.max(0, depositDifference);

  // ── Update meter reading ──
  const updateMeterReading = (
    serviceId: number,
    field: "closingIndex" | "openingIndex",
    value: number,
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
      }),
    );
  };

  // ── Submit ──
  const moveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        contractId: Number(contractId),
        newRoomId: targetRoomId,
        moveDate: moveDate.toISOString().split("T")[0],
        oldRoomStatus,
        newRentPrice: Number(newRentPrice),
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
      return api.post("/contracts/move", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      Alert.alert("Thành công", "Chuyển phòng thành công!", [
        { text: "OK", onPress: () => router.dismissAll() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Có lỗi xảy ra khi chuyển phòng",
      );
    },
  });

  const canProceedStep1 = targetRoomId !== null && Number(newRentPrice) > 0;

  // ── Step indicators ──
  const steps = ["Chọn phòng", "Chốt số", "Xác nhận"];

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      {/* HEADER */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
            onPress={() => router.back()}
          >
            <FontAwesome5 name="arrow-left" size={16} color="#374151" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-xl font-bold text-gray-900 font-serif">
              Chuyển Phòng
            </Text>
            <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Move Room Wizard
            </Text>
          </View>
          <View className="w-10" />
        </View>

        {/* Step Indicators */}
        <View className="flex-row items-center justify-center mt-4 gap-2">
          {steps.map((label, i) => (
            <View key={label} className="flex-row items-center">
              <View
                className={`w-7 h-7 rounded-full items-center justify-center ${
                  i <= step ? "bg-[#DA7756]" : "bg-gray-200"
                }`}
              >
                {i < step ? (
                  <Ionicons name="checkmark" size={14} color="white" />
                ) : (
                  <Text
                    className={`text-xs font-bold ${i <= step ? "text-white" : "text-gray-500"}`}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                className={`text-[10px] font-bold ml-1 uppercase ${
                  i <= step ? "text-[#DA7756]" : "text-gray-400"
                }`}
              >
                {label}
              </Text>
              {i < steps.length - 1 && (
                <View
                  className={`w-6 h-[2px] mx-1 ${i < step ? "bg-[#DA7756]" : "bg-gray-200"}`}
                />
              )}
            </View>
          ))}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          {/* ═══════════ STEP 1: Chọn phòng ═══════════ */}
          {step === 0 && (
            <View className="space-y-5">
              {/* Current → New comparison */}
              <View className="bg-white rounded-2xl p-5 border border-dashed border-gray-200">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Phòng hiện tại
                    </Text>
                    <Text className="text-2xl font-bold text-gray-900 font-serif">
                      {currentRoomName}
                    </Text>
                    <View className="bg-gray-100 px-2 py-1 rounded-md mt-1 self-start">
                      <Text className="text-xs font-medium text-gray-600">
                        {formatShortCurrency(currentRoomPrice)} đ/tháng
                      </Text>
                    </View>
                  </View>

                  <View className="px-3">
                    <FontAwesome5
                      name="arrow-right"
                      size={16}
                      color="#D1D5DB"
                    />
                  </View>

                  <View className="flex-1 items-end">
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Chuyển đến
                    </Text>
                    <Text
                      className={`text-2xl font-bold font-serif ${
                        selectedRoom ? "text-[#DA7756]" : "text-gray-300"
                      }`}
                    >
                      {selectedRoom?.name || "..."}
                    </Text>
                    <View
                      className={`px-2 py-1 rounded-md mt-1 ${
                        selectedRoom ? "bg-[#FFF4F0]" : "bg-gray-50"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          selectedRoom ? "text-[#DA7756]" : "text-gray-300"
                        }`}
                      >
                        {selectedRoom
                          ? `${formatShortCurrency(selectedRoom.price)} đ/tháng`
                          : "---"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Room Selection */}
              <View>
                <Text className="text-xs font-bold text-gray-500 uppercase mb-2 flex-row items-center">
                  <Text className="text-[#DA7756]">① </Text>Chọn phòng mới
                </Text>
                <ScrollView
                  horizontal={false}
                  className="bg-white rounded-2xl border border-gray-100"
                  style={{ maxHeight: 200 }}
                >
                  {availableRooms.length === 0 ? (
                    <View className="p-6 items-center">
                      <Text className="text-gray-400 font-medium">
                        Không có phòng trống
                      </Text>
                    </View>
                  ) : (
                    availableRooms.map((room: any) => (
                      <TouchableOpacity
                        key={room.id}
                        onPress={() => setTargetRoomId(room.id)}
                        className={`p-4 flex-row items-center justify-between border-b border-gray-50 ${
                          targetRoomId === room.id ? "bg-[#FFF4F0]" : ""
                        }`}
                      >
                        <View className="flex-row items-center gap-3">
                          <View
                            className={`w-9 h-9 rounded-xl items-center justify-center ${
                              targetRoomId === room.id
                                ? "bg-[#DA7756]"
                                : "bg-gray-100"
                            }`}
                          >
                            <FontAwesome5
                              name="door-open"
                              size={14}
                              color={
                                targetRoomId === room.id ? "white" : "#9CA3AF"
                              }
                            />
                          </View>
                          <View>
                            <Text className="font-bold text-gray-900">
                              {room.name}
                            </Text>
                            <Text className="text-xs text-gray-500">
                              {room.building?.name} • Tầng {room.floor}
                            </Text>
                          </View>
                        </View>
                        <View className="items-end">
                          <Text className="font-bold text-[#DA7756]">
                            {formatShortCurrency(room.price)} đ
                          </Text>
                          <Text className="text-[10px] text-gray-400">
                            {room.area} m²
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>

              {/* Move Date */}
              <View>
                <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
                  <Text className="text-[#DA7756]">② </Text>Ngày chuyển
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="bg-white rounded-xl p-4 border border-gray-100 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-9 h-9 bg-blue-50 rounded-xl items-center justify-center">
                      <Ionicons name="calendar" size={18} color="#3B82F6" />
                    </View>
                    <Text className="font-bold text-gray-900">
                      {formatDate(moveDate)}
                    </Text>
                  </View>
                  <FontAwesome5
                    name="chevron-right"
                    size={12}
                    color="#D1D5DB"
                  />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={moveDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={(_, date) => {
                      setShowDatePicker(Platform.OS === "ios");
                      if (date) setMoveDate(date);
                    }}
                  />
                )}
              </View>

              {/* New Rent Price */}
              <View>
                <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
                  <Text className="text-[#DA7756]">③ </Text>Giá thuê mới
                </Text>
                <View className="bg-white rounded-xl border border-gray-100 flex-row items-center px-4">
                  <Text className="text-gray-400 mr-2">₫</Text>
                  <TextInput
                    className="flex-1 py-4 font-bold text-lg text-[#DA7756]"
                    keyboardType="numeric"
                    value={newRentPrice}
                    onChangeText={setNewRentPrice}
                    placeholder="0"
                  />
                </View>
              </View>

              {/* Old Room Status */}
              <View>
                <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
                  <Text className="text-[#DA7756]">④ </Text>Xử lý phòng cũ
                </Text>
                <View className="bg-gray-100 p-1.5 rounded-2xl flex-row gap-2">
                  {(["MAINTENANCE", "AVAILABLE"] as const).map((status) => (
                    <TouchableOpacity
                      key={status}
                      onPress={() => setOldRoomStatus(status)}
                      className={`flex-1 py-3 px-3 rounded-xl items-center ${
                        oldRoomStatus === status ? "bg-white" : ""
                      }`}
                      style={
                        oldRoomStatus === status
                          ? {
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.05,
                              shadowRadius: 2,
                              elevation: 1,
                            }
                          : undefined
                      }
                    >
                      <Text
                        className={`text-sm font-bold ${
                          oldRoomStatus === status
                            ? "text-[#DA7756]"
                            : "text-gray-500"
                        }`}
                      >
                        {status === "MAINTENANCE" ? "🔧 Bảo Trì" : "✅ Trống"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* ═══════════ STEP 2: Chốt số ═══════════ */}
          {step === 1 && (
            <View className="space-y-5">
              {/* Info Banner */}
              <View className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex-row items-center gap-3">
                <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center">
                  <Ionicons name="flash" size={20} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-amber-900">
                    Chốt chỉ số điện/nước
                  </Text>
                  <Text className="text-xs text-amber-700 mt-0.5">
                    Nhập chỉ số cuối phòng cũ và chỉ số đầu phòng mới
                  </Text>
                </View>
              </View>

              {meterReadings.length === 0 ? (
                <View className="bg-white rounded-2xl p-8 border border-dashed border-gray-200 items-center">
                  <Text className="text-3xl mb-2 opacity-30">🔌</Text>
                  <Text className="text-gray-500 font-medium">
                    Không có dịch vụ điện/nước cần chốt
                  </Text>
                </View>
              ) : (
                meterReadings.map((reading) => (
                  <View
                    key={reading.serviceId}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                  >
                    {/* Service Header */}
                    <View className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex-row justify-between items-center">
                      <View className="flex-row items-center gap-2">
                        <Ionicons
                          name={
                            reading.serviceName.toLowerCase().includes("điện")
                              ? "flash"
                              : "water"
                          }
                          size={16}
                          color={
                            reading.serviceName.toLowerCase().includes("điện")
                              ? "#F59E0B"
                              : "#3B82F6"
                          }
                        />
                        <Text className="font-bold text-sm text-gray-700 uppercase tracking-wide">
                          {reading.serviceName}
                        </Text>
                      </View>
                      <View className="bg-white border border-gray-200 px-2 py-1 rounded-md">
                        <Text className="text-xs text-gray-500 font-mono">
                          {formatShortCurrency(reading.unitPrice)} đ/số
                        </Text>
                      </View>
                    </View>

                    <View className="p-5">
                      {/* OLD ROOM */}
                      <View className="mb-4">
                        <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                          Phòng cũ ({currentRoomName})
                        </Text>
                        <Text className="text-xs font-semibold text-gray-600 mb-1">
                          Chỉ số cuối
                        </Text>
                        <TextInput
                          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900"
                          keyboardType="numeric"
                          value={
                            reading.closingIndex
                              ? reading.closingIndex.toString()
                              : ""
                          }
                          onChangeText={(v) =>
                            updateMeterReading(
                              reading.serviceId,
                              "closingIndex",
                              Number(v) || 0,
                            )
                          }
                          placeholder="0"
                        />
                        <View className="flex-row justify-between items-center mt-2">
                          <Text className="text-sm text-gray-500">
                            Tiêu thụ:{" "}
                            <Text className="font-bold text-gray-900">
                              {reading.usage}
                            </Text>
                          </Text>
                          <Text className="font-bold text-[#DA7756]">
                            {formatShortCurrency(reading.cost)} đ
                          </Text>
                        </View>
                      </View>

                      {/* Divider */}
                      <View className="h-px bg-gray-100 my-2" />

                      {/* NEW ROOM */}
                      <View className="mt-2">
                        <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                          Phòng mới ({selectedRoom?.name || "..."})
                        </Text>
                        <Text className="text-xs font-semibold text-gray-600 mb-1">
                          Chỉ số đầu
                        </Text>
                        <TextInput
                          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900"
                          keyboardType="numeric"
                          value={
                            reading.openingIndex
                              ? reading.openingIndex.toString()
                              : ""
                          }
                          onChangeText={(v) =>
                            updateMeterReading(
                              reading.serviceId,
                              "openingIndex",
                              Number(v) || 0,
                            )
                          }
                          placeholder="0"
                        />
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* ═══════════ STEP 3: Xác nhận ═══════════ */}
          {step === 2 && (
            <View className="space-y-5">
              <View className="flex-row justify-between items-center">
                <Text className="text-xl font-bold text-gray-900 font-serif">
                  Tổng kết chuyển phòng
                </Text>
              </View>

              {/* Summary Card */}
              <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Total Header */}
                <View className="p-5 bg-gray-50 border-b border-gray-100 flex-row justify-between items-center">
                  <View>
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Tổng cộng
                    </Text>
                    <Text className="text-lg font-bold text-gray-900 font-serif mt-1">
                      Chi tiết khoản thu
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-2xl font-bold text-[#DA7756]">
                      {formatShortCurrency(totalCharge)} đ
                    </Text>
                    <Text className="text-[10px] text-gray-400 font-bold">
                      Tổng cần thu
                    </Text>
                  </View>
                </View>

                {/* Line Items */}
                <View className="p-5 space-y-4">
                  {/* Pro-rata Rent */}
                  <View className="flex-row justify-between items-center pb-3 border-b border-dashed border-gray-100">
                    <View>
                      <Text className="font-bold text-gray-700">
                        Tiền phòng cũ
                      </Text>
                      <Text className="text-xs text-gray-400 mt-0.5">
                        {daysAtOldRoom} ngày ở tại {currentRoomName}
                      </Text>
                    </View>
                    <Text className="font-bold">
                      {formatShortCurrency(proRataRent)} đ
                    </Text>
                  </View>

                  {/* Utility Cost */}
                  <View className="flex-row justify-between items-center pb-3 border-b border-dashed border-gray-100">
                    <View>
                      <Text className="font-bold text-gray-700">
                        Dịch vụ (Điện/Nước)
                      </Text>
                      <Text className="text-xs text-gray-400 mt-0.5">
                        Tính theo chỉ số chốt
                      </Text>
                    </View>
                    <Text className="font-bold">
                      {formatShortCurrency(totalUtilityCost)} đ
                    </Text>
                  </View>

                  {/* Deposit Difference */}
                  {depositDifference !== 0 && (
                    <View className="flex-row justify-between items-center pb-3 border-b border-dashed border-gray-100">
                      <View>
                        <Text className="font-bold text-gray-700">
                          Chênh lệch cọc
                        </Text>
                        <Text className="text-xs text-gray-400 mt-0.5">
                          {depositDifference > 0 ? "Thu thêm" : "Hoàn lại"}
                        </Text>
                      </View>
                      <Text
                        className={`font-bold ${
                          depositDifference > 0
                            ? "text-[#DA7756]"
                            : "text-green-600"
                        }`}
                      >
                        {depositDifference > 0 ? "+" : ""}
                        {formatShortCurrency(depositDifference)} đ
                      </Text>
                    </View>
                  )}
                </View>

                {/* Settlement Option */}
                <View className="bg-[#F5F2EE] p-5 border-t border-gray-100">
                  <Text className="text-xs font-bold uppercase text-gray-500 mb-3">
                    Phương thức thanh toán
                  </Text>
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => setSettlementOption("IMMEDIATE")}
                      className={`flex-1 p-3 rounded-xl border ${
                        settlementOption === "IMMEDIATE"
                          ? "bg-white border-gray-900"
                          : "bg-white border-gray-200"
                      }`}
                      style={
                        settlementOption === "IMMEDIATE"
                          ? {
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.05,
                              shadowRadius: 2,
                              elevation: 1,
                            }
                          : undefined
                      }
                    >
                      <Text className="font-bold text-sm text-gray-900">
                        🧾 Tạo HĐ ngay
                      </Text>
                      <Text className="text-[10px] text-gray-500 mt-0.5">
                        Thanh toán ngay
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setSettlementOption("DEFER")}
                      className={`flex-1 p-3 rounded-xl border ${
                        settlementOption === "DEFER"
                          ? "bg-white border-gray-900"
                          : "bg-white border-gray-200"
                      }`}
                      style={
                        settlementOption === "DEFER"
                          ? {
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.05,
                              shadowRadius: 2,
                              elevation: 1,
                            }
                          : undefined
                      }
                    >
                      <Text className="font-bold text-sm text-gray-900">
                        📅 Cộng dồn
                      </Text>
                      <Text className="text-[10px] text-gray-500 mt-0.5">
                        Gộp vào kỳ tới
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FOOTER */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex-row justify-between items-center"
        style={{ paddingBottom: Math.max(insets.bottom + 90, 110) }}
      >
        {step > 0 ? (
          <TouchableOpacity
            onPress={() => setStep(step - 1)}
            className="px-5 py-3 rounded-xl"
          >
            <Text className="font-bold text-gray-500 uppercase text-xs tracking-widest">
              Quay lại
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.back()}
            className="px-5 py-3 rounded-xl"
          >
            <Text className="font-bold text-gray-500 uppercase text-xs tracking-widest">
              Hủy bỏ
            </Text>
          </TouchableOpacity>
        )}

        {step < 2 ? (
          <TouchableOpacity
            onPress={() => setStep(step + 1)}
            disabled={step === 0 && !canProceedStep1}
            className={`px-6 py-3.5 rounded-xl flex-row items-center gap-2 ${
              step === 0 && !canProceedStep1 ? "bg-gray-200" : "bg-[#1f1f1f]"
            }`}
            style={
              !(step === 0 && !canProceedStep1)
                ? {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: 4,
                  }
                : undefined
            }
          >
            <Text
              className={`font-bold text-sm uppercase tracking-wide ${
                step === 0 && !canProceedStep1 ? "text-gray-400" : "text-white"
              }`}
            >
              Tiếp tục
            </Text>
            <FontAwesome5
              name="arrow-right"
              size={10}
              color={step === 0 && !canProceedStep1 ? "#9CA3AF" : "white"}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => moveMutation.mutate()}
            disabled={moveMutation.isPending}
            className="px-6 py-3.5 bg-[#DA7756] rounded-xl flex-row items-center gap-2 shadow-lg"
          >
            {moveMutation.isPending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="white" />
                <Text className="font-bold text-white text-sm uppercase tracking-wide">
                  Xác nhận
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
