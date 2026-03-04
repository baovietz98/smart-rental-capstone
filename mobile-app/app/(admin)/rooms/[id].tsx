import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: room, isLoading } = useQuery({
    queryKey: ["room", id],
    queryFn: async () => {
      const res = await api.get(`/rooms/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/rooms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      router.back();
    },
    onError: (error: any) => {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể xóa phòng này",
      );
    },
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  if (isLoading || !room) {
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
          Chi tiết phòng
        </Text>
        <TouchableOpacity
          className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
          onPress={() => {
            router.push({
              pathname: "/(admin)/rooms/edit",
              params: { id },
            });
          }}
        >
          <FontAwesome5 name="pen" size={14} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        {/* ROOM CARD */}
        <View className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6">
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">
                {room.building?.name}
              </Text>
              <Text className="text-3xl font-black text-[#383838] font-serif">
                {room.name}
              </Text>
            </View>
            <View
              className={`px-3 py-1 rounded-full ${
                room.status === "AVAILABLE"
                  ? "bg-green-100"
                  : room.status === "RENTED"
                    ? "bg-pink-100"
                    : "bg-yellow-100"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  room.status === "AVAILABLE"
                    ? "text-green-700"
                    : room.status === "RENTED"
                      ? "text-pink-700"
                      : "text-yellow-700"
                }`}
              >
                {room.status === "AVAILABLE"
                  ? "Trống"
                  : room.status === "RENTED"
                    ? "Đang ở"
                    : "Bảo trì"}
              </Text>
            </View>
          </View>

          {/* Price & Area Grid */}
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1 bg-gray-50 p-3 rounded-xl">
              <Text className="text-gray-400 text-[10px] font-bold uppercase">
                Giá thuê
              </Text>
              <Text className="text-[#DA7756] font-bold text-lg">
                {formatCurrency(room.price)}
              </Text>
            </View>
            <View className="flex-1 bg-gray-50 p-3 rounded-xl">
              <Text className="text-gray-400 text-[10px] font-bold uppercase">
                Diện tích
              </Text>
              <Text className="text-gray-900 font-bold text-lg">
                {room.area} m²
              </Text>
            </View>
          </View>

          {/* Deposit */}
          {room.depositPrice && (
            <View className="bg-[#FFF7ED] p-3 rounded-xl mb-6 border border-[#FFEDD5] flex-row justify-between items-center">
              <Text className="text-[#9A3412] font-medium text-xs">
                Tiền cọc yêu cầu:
              </Text>
              <Text className="text-[#C2410C] font-bold">
                {formatCurrency(room.depositPrice)}
              </Text>
            </View>
          )}

          {/* Details List */}
          <View className="space-y-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons
                  name="floor-plan"
                  size={18}
                  color="#9CA3AF"
                />
                <Text className="text-gray-600 font-medium">Tầng</Text>
              </View>
              <Text className="text-gray-900 font-bold">{room.floor}</Text>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <FontAwesome5 name="users" size={14} color="#9CA3AF" />
                <Text className="text-gray-600 font-medium">
                  Số người tối đa
                </Text>
              </View>
              <Text className="text-gray-900 font-bold">
                {room.maxTenants} người
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <FontAwesome5 name="venus-mars" size={14} color="#9CA3AF" />
                <Text className="text-gray-600 font-medium">Giới tính</Text>
              </View>
              <Text className="text-gray-900 font-bold">
                {room.gender === "ALL"
                  ? "Tất cả"
                  : room.gender === "MALE"
                    ? "Nam"
                    : "Nữ"}
              </Text>
            </View>
          </View>

          {/* Amenities */}
          {room.assets && room.assets.length > 0 && (
            <View className="mt-6 pt-4 border-t border-gray-100">
              <Text className="text-xs font-bold text-gray-500 uppercase mb-3">
                Tiện ích
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {room.assets.map((asset: string) => (
                  <View
                    key={asset}
                    className="bg-gray-100 px-3 py-1.5 rounded-lg flex-row items-center gap-1.5"
                  >
                    <FontAwesome5
                      name="check-circle"
                      size={10}
                      color="#374151"
                    />
                    <Text className="text-xs font-medium text-gray-700 capitalize">
                      {asset === "wifi"
                        ? "Wifi"
                        : asset === "ac"
                          ? "Điều hòa"
                          : asset === "heater"
                            ? "Nóng lạnh"
                            : asset === "bed"
                              ? "Giường"
                              : asset === "wardrobe"
                                ? "Tủ đồ"
                                : asset === "fridge"
                                  ? "Tủ lạnh"
                                  : asset === "parking"
                                    ? "Để xe"
                                    : asset === "kitchen"
                                      ? "Bếp"
                                      : asset === "washing"
                                        ? "Máy giặt"
                                        : asset}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* TENANTS SECTION */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 font-serif mb-3">
            Cư dân hiện tại
          </Text>
          {room.contracts && room.contracts.length > 0 ? (
            room.contracts.map((contract: any) => (
              <TouchableOpacity
                key={contract.id}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex-row items-center gap-4 mb-3"
                onPress={() =>
                  router.push(`/(admin)/tenants/${contract.tenantId}` as any)
                }
              >
                <View className="w-10 h-10 bg-[#DA7756]/10 rounded-full items-center justify-center">
                  <Text className="text-[#DA7756] font-bold">
                    {contract.tenant?.fullName?.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-gray-900">
                    {contract.tenant?.fullName}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    {contract.tenant?.phone}
                  </Text>
                </View>
                <FontAwesome5 name="chevron-right" size={12} color="#D1D5DB" />
              </TouchableOpacity>
            ))
          ) : (
            <View className="bg-white p-6 rounded-xl border border-dashed border-gray-200 items-center">
              <Text className="text-gray-400 font-medium">Chưa có cư dân</Text>
            </View>
          )}

          {/* Create Contract if Available */}
          {room.status === "AVAILABLE" && (
            <TouchableOpacity
              className="mt-2 bg-[#DA7756] py-3 rounded-xl items-center shadow-lg shadow-orange-200"
              onPress={() =>
                router.push({
                  pathname: "/(admin)/contracts/new",
                  params: {
                    roomId: room.id,
                    roomName: room.name,
                    buildingId: room.buildingId,
                    roomPrice: room.price,
                    depositPrice: room.depositPrice,
                  },
                } as any)
              }
            >
              <Text className="text-white font-bold">Tạo hợp đồng mới</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* QUICK ACTIONS */}
        <View>
          <Text className="text-lg font-bold text-gray-900 font-serif mb-3">
            Thao tác nhanh
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {/* Move Room - only when RENTED */}
            {room.status === "RENTED" && room.contracts?.[0] && (
              <TouchableOpacity
                className="bg-white p-4 rounded-xl border border-gray-100 items-center justify-center gap-2"
                style={{ width: "47%" }}
                onPress={() =>
                  router.push({
                    pathname: "/(admin)/rooms/move-room",
                    params: {
                      contractId: room.contracts[0].id,
                      roomName: room.name,
                      roomPrice: room.price,
                      deposit:
                        room.contracts[0].paidDeposit || room.depositPrice || 0,
                    },
                  } as any)
                }
              >
                <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
                  <FontAwesome5 name="exchange-alt" size={16} color="#3B82F6" />
                </View>
                <Text className="text-xs font-bold text-gray-700">
                  Chuyển phòng
                </Text>
              </TouchableOpacity>
            )}

            {/* Maintenance Toggle */}
            {room.status !== "RENTED" && (
              <TouchableOpacity
                className="bg-white p-4 rounded-xl border border-gray-100 items-center justify-center gap-2"
                style={{ width: "47%" }}
                onPress={() => {
                  const newStatus =
                    room.status === "MAINTENANCE" ? "AVAILABLE" : "MAINTENANCE";
                  const label =
                    newStatus === "MAINTENANCE" ? "Bảo trì" : "Trống";
                  Alert.alert(
                    "Cập nhật trạng thái",
                    `Chuyển phòng sang trạng thái "${label}"?`,
                    [
                      { text: "Hủy", style: "cancel" },
                      {
                        text: "Xác nhận",
                        onPress: async () => {
                          try {
                            await api.patch(`/rooms/${id}/status`, {
                              status: newStatus,
                            });
                            queryClient.invalidateQueries({
                              queryKey: ["room", id],
                            });
                            queryClient.invalidateQueries({
                              queryKey: ["rooms"],
                            });
                            Alert.alert(
                              "Thành công",
                              `Phòng đã chuyển sang "${label}"`,
                            );
                          } catch (err: any) {
                            Alert.alert(
                              "Lỗi",
                              err.response?.data?.message ||
                                "Không thể cập nhật",
                            );
                          }
                        },
                      },
                    ],
                  );
                }}
              >
                <View className="w-10 h-10 bg-yellow-50 rounded-full items-center justify-center">
                  <FontAwesome5
                    name={
                      room.status === "MAINTENANCE" ? "check-circle" : "tools"
                    }
                    size={16}
                    color={
                      room.status === "MAINTENANCE" ? "#22C55E" : "#F59E0B"
                    }
                  />
                </View>
                <Text className="text-xs font-bold text-gray-700">
                  {room.status === "MAINTENANCE" ? "Mở phòng" : "Bảo trì"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Report Issue */}
            <TouchableOpacity
              className="bg-white p-4 rounded-xl border border-gray-100 items-center justify-center gap-2"
              style={{ width: "47%" }}
              onPress={() =>
                router.push({
                  pathname: "/(admin)/issues/new",
                  params: { roomId: id },
                })
              }
            >
              <View className="w-10 h-10 bg-red-50 rounded-full items-center justify-center">
                <FontAwesome5
                  name="exclamation-triangle"
                  size={16}
                  color="#EF4444"
                />
              </View>
              <Text className="text-xs font-bold text-gray-700">Báo sự cố</Text>
            </TouchableOpacity>

            {/* Delete Room */}
            <TouchableOpacity
              className={`bg-white p-4 rounded-xl border items-center justify-center gap-2 ${
                room.status === "RENTED"
                  ? "border-gray-200 opacity-50"
                  : "border-gray-100"
              }`}
              style={{ width: "47%" }}
              onPress={() => {
                // Pre-check: block if room has active contracts
                const hasActiveContracts =
                  room.contracts && room.contracts.some((c: any) => c.isActive);

                if (room.status === "RENTED" || hasActiveContracts) {
                  Alert.alert(
                    "⛔ Không thể xóa",
                    "Phòng đang có hợp đồng thuê (trạng thái: Đang ở).\n\n" +
                      "Để xóa phòng, bạn cần:\n" +
                      "1. Thanh lý hợp đồng hiện tại\n" +
                      "2. Chờ phòng chuyển về trạng thái Trống\n" +
                      "3. Sau đó mới xóa được",
                    [{ text: "Đã hiểu", style: "default" }],
                  );
                  return;
                }

                Alert.alert(
                  "⚠️ Xác nhận xóa phòng",
                  `Bạn có chắc chắn muốn xóa phòng "${room.name}"?\n\n` +
                    "Hành động này sẽ:\n" +
                    "• Xóa vĩnh viễn phòng khỏi hệ thống\n" +
                    "• Xóa toàn bộ lịch sử hợp đồng cũ\n" +
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
              <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                <FontAwesome5 name="trash" size={16} color="#6B7280" />
              </View>
              <Text className="text-xs font-bold text-gray-700">Xóa phòng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
