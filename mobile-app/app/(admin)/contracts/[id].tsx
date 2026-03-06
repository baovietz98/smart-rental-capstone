import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);

const formatDate = (dateStr: string) => {
  if (!dateStr) return "---";
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
};

export default function ContractDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Extension modal state
  const [showExtend, setShowExtend] = useState(false);
  const [extEndDate, setExtEndDate] = useState(new Date());
  const [extPrice, setExtPrice] = useState("");
  const [showExtDatePicker, setShowExtDatePicker] = useState(false);

  // Liquidation modal state
  const [showLiquidate, setShowLiquidate] = useState(false);

  const { data: contract, isLoading } = useQuery({
    queryKey: ["contract", id],
    queryFn: async () => {
      const res = await api.get(`/contracts/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Terminate / Liquidate
  const terminateMutation = useMutation({
    mutationFn: async () => {
      return api.patch(`/contracts/${id}/terminate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setShowLiquidate(false);
      Alert.alert("Thành công", "Hợp đồng đã được thanh lý");
    },
    onError: (err: any) => {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không thể thanh lý hợp đồng",
      );
    },
  });

  // Extension
  const extensionMutation = useMutation({
    mutationFn: async () => {
      return api.patch(`/contracts/${id}`, {
        endDate: extEndDate.toISOString().split("T")[0],
        price: Number(extPrice),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      setShowExtend(false);
      Alert.alert("Thành công", "Đã gia hạn hợp đồng");
    },
    onError: (err: any) => {
      Alert.alert("Lỗi", err.response?.data?.message || "Không thể gia hạn");
    },
  });

  // Delete contract
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/contracts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      Alert.alert("Thành công", "Đã xóa hợp đồng", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không thể xóa hợp đồng",
      );
    },
  });

  if (isLoading || !contract) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F9FAFB]">
        <ActivityIndicator size="large" color="#DA7756" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      {/* HEADER */}
      <View className="px-6 py-4 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <TouchableOpacity
          className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
          onPress={() => router.back()}
        >
          <FontAwesome5 name="arrow-left" size={16} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 font-serif">
          Chi tiết hợp đồng
        </Text>
        <View
          className={`px-2.5 py-1 rounded-full ${
            contract.isActive ? "bg-green-100" : "bg-gray-100"
          }`}
        >
          <Text
            className={`text-[10px] font-bold ${
              contract.isActive ? "text-green-700" : "text-gray-500"
            }`}
          >
            {contract.isActive ? "Đang thuê" : "Đã kết thúc"}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 150 }}>
        {/* Contract ID */}
        <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Hợp đồng
              </Text>
              <Text className="text-3xl font-bold text-gray-900 font-serif">
                #{contract.id}
              </Text>
            </View>
            <View className="w-12 h-12 bg-[#DA7756]/10 rounded-2xl items-center justify-center">
              <FontAwesome5 name="file-contract" size={20} color="#DA7756" />
            </View>
          </View>

          {/* Room Info */}
          <View className="bg-gray-50 rounded-xl p-4 mb-3">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 bg-blue-50 rounded-xl items-center justify-center">
                <FontAwesome5 name="door-open" size={14} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-gray-900">
                  {contract.room?.name}
                </Text>
                <Text className="text-xs text-gray-500">
                  {contract.room?.building?.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push(`/(admin)/rooms/${contract.roomId}` as any)
                }
              >
                <Text className="text-xs font-bold text-[#DA7756]">
                  Xem phòng
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tenant Info */}
          <View className="bg-gray-50 rounded-xl p-4">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 bg-[#DA7756]/10 rounded-xl items-center justify-center">
                <FontAwesome5 name="user" size={14} color="#DA7756" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-gray-900">
                  {contract.tenant?.fullName}
                </Text>
                <Text className="text-xs text-gray-500">
                  {contract.tenant?.phone}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push(`/(admin)/tenants/${contract.tenantId}` as any)
                }
              >
                <Text className="text-xs font-bold text-[#DA7756]">
                  Xem khách
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Financial Details */}
        <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
          <Text className="text-xs font-bold text-gray-500 uppercase mb-3">
            Thông tin tài chính
          </Text>

          <View className="space-y-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Giá thuê</Text>
              <Text className="font-bold text-[#DA7756]">
                {formatCurrency(contract.price)} đ/tháng
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Tiền cọc</Text>
              <Text className="font-bold text-gray-900">
                {formatCurrency(contract.deposit || 0)} đ
              </Text>
            </View>
            {contract.paidDeposit !== undefined && (
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Cọc đã đóng</Text>
                <Text className="font-bold text-green-600">
                  {formatCurrency(contract.paidDeposit || 0)} đ
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Date Details */}
        <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
          <Text className="text-xs font-bold text-gray-500 uppercase mb-3">
            Thời hạn hợp đồng
          </Text>

          <View className="space-y-3">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <Ionicons name="calendar-outline" size={16} color="#22C55E" />
                <Text className="text-gray-600">Ngày bắt đầu</Text>
              </View>
              <Text className="font-bold text-gray-900">
                {formatDate(contract.startDate)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <Ionicons name="calendar-outline" size={16} color="#EF4444" />
                <Text className="text-gray-600">Ngày kết thúc</Text>
              </View>
              <Text className="font-bold text-gray-900">
                {formatDate(contract.endDate)}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions - only if active */}
        {contract.isActive && (
          <View>
            <Text className="text-lg font-bold text-gray-900 font-serif mb-3">
              Thao tác
            </Text>
            <View className="space-y-3">
              {/* Extension */}
              <TouchableOpacity
                className="bg-white p-4 rounded-2xl border border-gray-100 flex-row items-center gap-4"
                onPress={() => {
                  const end = contract.endDate
                    ? new Date(
                        new Date(contract.endDate).getTime() + 180 * 86400000,
                      )
                    : new Date(Date.now() + 180 * 86400000);
                  setExtEndDate(end);
                  setExtPrice(contract.price?.toString() || "");
                  setShowExtend(true);
                }}
              >
                <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center">
                  <FontAwesome5
                    name="calendar-plus"
                    size={16}
                    color="#3B82F6"
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-gray-900">
                    Gia hạn hợp đồng
                  </Text>
                  <Text className="text-xs text-gray-500">
                    Kéo dài thời gian thuê
                  </Text>
                </View>
                <FontAwesome5 name="chevron-right" size={12} color="#D1D5DB" />
              </TouchableOpacity>

              {/* Move Room */}
              <TouchableOpacity
                className="bg-white p-4 rounded-2xl border border-gray-100 flex-row items-center gap-4"
                onPress={() =>
                  router.push({
                    pathname: "/(admin)/rooms/move-room",
                    params: {
                      contractId: contract.id,
                      roomName: contract.room?.name,
                      roomPrice: contract.price,
                      deposit: contract.paidDeposit || contract.deposit || 0,
                    },
                  } as any)
                }
              >
                <View className="w-10 h-10 bg-teal-50 rounded-xl items-center justify-center">
                  <FontAwesome5 name="exchange-alt" size={16} color="#0D9488" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-gray-900">Chuyển phòng</Text>
                  <Text className="text-xs text-gray-500">
                    Chuyển sang phòng khác
                  </Text>
                </View>
                <FontAwesome5 name="chevron-right" size={12} color="#D1D5DB" />
              </TouchableOpacity>

              {/* Terminate / Liquidate */}
              <TouchableOpacity
                className="bg-white p-4 rounded-2xl border border-red-100 flex-row items-center gap-4"
                onPress={() => setShowLiquidate(true)}
              >
                <View className="w-10 h-10 bg-red-50 rounded-xl items-center justify-center">
                  <FontAwesome5 name="times-circle" size={16} color="#EF4444" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-red-600">
                    Thanh lý hợp đồng
                  </Text>
                  <Text className="text-xs text-gray-500">
                    Kết thúc hợp đồng sớm
                  </Text>
                </View>
                <FontAwesome5 name="chevron-right" size={12} color="#D1D5DB" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Delete Contract - always visible */}
        <View className="mt-6">
          <TouchableOpacity
            className="bg-white p-4 rounded-2xl border border-red-100 flex-row items-center gap-4"
            onPress={() => {
              // Pre-check 1: active contract must be terminated first
              if (contract.isActive) {
                Alert.alert(
                  "⛔ Không thể xóa",
                  "Hợp đồng đang hoạt động không thể xóa trực tiếp.\n\n" +
                    "Để xóa, bạn cần:\n" +
                    "1. Thanh lý hợp đồng trước\n" +
                    "2. Sau đó mới xóa được hợp đồng",
                  [{ text: "Đã hiểu", style: "default" }],
                );
                return;
              }

              // Pre-check 2: has invoices → cannot delete
              const invoiceCount = contract.invoices?.length || 0;
              if (invoiceCount > 0) {
                Alert.alert(
                  "⛔ Không thể xóa",
                  `Hợp đồng này đã có ${invoiceCount} hóa đơn liên quan.\n\n` +
                    "Vì lý do bảo toàn dữ liệu tài chính, không thể xóa hợp đồng đã phát sinh hóa đơn.",
                  [{ text: "Đã hiểu", style: "default" }],
                );
                return;
              }

              // Safe to delete
              Alert.alert(
                "⚠️ Xác nhận xóa hợp đồng",
                `Bạn có chắc chắn muốn xóa hợp đồng #${contract.id}?\n\n` +
                  "Hành động này sẽ:\n" +
                  "• Xóa vĩnh viễn hợp đồng\n" +
                  "• Không thể hoàn tác",
                [
                  { text: "Hủy", style: "cancel" },
                  {
                    text: "Xóa vĩnh viễn",
                    style: "destructive",
                    onPress: () => deleteMutation.mutate(),
                  },
                ],
              );
            }}
          >
            <View className="w-10 h-10 bg-red-50 rounded-xl items-center justify-center">
              <FontAwesome5 name="trash-alt" size={16} color="#EF4444" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-red-500">Xóa hợp đồng</Text>
              <Text className="text-xs text-gray-500">
                {contract.isActive
                  ? "Cần thanh lý trước"
                  : contract.invoices?.length > 0
                    ? `Không thể xóa (có ${contract.invoices.length} hóa đơn)`
                    : "Xóa vĩnh viễn hợp đồng"}
              </Text>
            </View>
            <FontAwesome5 name="chevron-right" size={12} color="#D1D5DB" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ══════ Extension Modal ══════ */}
      <Modal visible={showExtend} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View
            className="bg-white rounded-t-3xl p-6"
            style={{ paddingBottom: Platform.OS === "ios" ? 40 : 24 }}
          >
            <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-6" />
            <Text className="text-xl font-bold text-gray-900 font-serif mb-1">
              Gia hạn hợp đồng
            </Text>
            <Text className="text-sm text-gray-500 mb-6">
              Phòng {contract.room?.name} • {contract.tenant?.fullName}
            </Text>

            {/* Current Info */}
            <View className="bg-blue-50 rounded-xl p-4 border border-blue-100 mb-5">
              <View className="flex-row justify-between mb-1">
                <Text className="text-sm text-gray-600">Ngày KT cũ:</Text>
                <Text className="font-bold text-gray-900">
                  {formatDate(contract.endDate)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-600">Giá hiện tại:</Text>
                <Text className="font-bold text-gray-900">
                  {formatCurrency(contract.price)} đ
                </Text>
              </View>
            </View>

            {/* New End Date */}
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Ngày kết thúc mới
            </Text>
            <TouchableOpacity
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center justify-between mb-4"
              onPress={() => setShowExtDatePicker(true)}
            >
              <Text className="font-bold text-gray-900">
                {formatDate(extEndDate.toISOString())}
              </Text>
              <Ionicons name="calendar" size={18} color="#3B82F6" />
            </TouchableOpacity>
            {showExtDatePicker && (
              <DateTimePicker
                value={extEndDate}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={(_, date) => {
                  setShowExtDatePicker(Platform.OS === "ios");
                  if (date) setExtEndDate(date);
                }}
              />
            )}

            {/* New Price */}
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Giá thuê mới
            </Text>
            <View className="bg-gray-50 border border-gray-200 rounded-xl flex-row items-center px-4 mb-6">
              <Text className="text-gray-400 mr-2">₫</Text>
              <TextInput
                className="flex-1 py-3 font-bold text-gray-900"
                keyboardType="numeric"
                value={extPrice}
                onChangeText={setExtPrice}
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl border border-gray-200 items-center"
                onPress={() => setShowExtend(false)}
              >
                <Text className="font-bold text-gray-500">Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3.5 bg-[#3B82F6] rounded-xl items-center shadow-lg"
                onPress={() => extensionMutation.mutate()}
                disabled={extensionMutation.isPending}
              >
                {extensionMutation.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="font-bold text-white">Xác nhận gia hạn</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════ Liquidation Modal ══════ */}
      <Modal visible={showLiquidate} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View
            className="bg-white rounded-t-3xl p-6"
            style={{ paddingBottom: Platform.OS === "ios" ? 40 : 24 }}
          >
            <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-6" />
            <Text className="text-xl font-bold text-red-600 font-serif mb-1">
              Thanh lý hợp đồng
            </Text>
            <Text className="text-sm text-gray-500 mb-4">
              Phòng {contract.room?.name} • {contract.tenant?.fullName}
            </Text>

            {/* Warning */}
            <View className="bg-red-50 rounded-xl p-4 border border-red-100 mb-5 flex-row items-start gap-3">
              <Ionicons name="warning" size={20} color="#EF4444" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-red-800">
                  Lưu ý quan trọng
                </Text>
                <Text className="text-xs text-red-600 mt-1">
                  Hành động này sẽ kết thúc hợp đồng ngay lập tức. Phòng sẽ
                  chuyển về trạng thái &quot;Trống&quot;.
                </Text>
              </View>
            </View>

            {/* Deposit Info */}
            <View className="bg-gray-50 rounded-xl p-4 mb-5">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Cọc đã đóng:</Text>
                <Text className="font-bold text-gray-900">
                  {formatCurrency(contract.paidDeposit || 0)} đ
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl border border-gray-200 items-center"
                onPress={() => setShowLiquidate(false)}
              >
                <Text className="font-bold text-gray-500">Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3.5 bg-red-600 rounded-xl items-center shadow-lg"
                onPress={() => terminateMutation.mutate()}
                disabled={terminateMutation.isPending}
              >
                {terminateMutation.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="font-bold text-white">
                    Xác nhận thanh lý
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
