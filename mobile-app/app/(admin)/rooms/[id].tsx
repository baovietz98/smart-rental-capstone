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

  const handleDelete = () => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa phòng này không? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  };

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
            // Edit logic here (navigate to edit screen)
            Alert.alert("Thông báo", "Chức năng chỉnh sửa đang cập nhật");
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

          <View className="flex-row gap-4 mb-6">
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
          </View>
        </View>

        {/* TENANTS SECTION */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 font-serif mb-3">
            Cư dân hiện tại
          </Text>
          {room.contracts && room.contracts.length > 0 ? (
            room.contracts.map((contract: any, index: number) => (
              <TouchableOpacity
                key={contract.id}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex-row items-center gap-4 mb-3"
                // Navigate to Tenant Detail
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

          {/* ACTIONS - Create Contract if Available */}
          {room.status === "AVAILABLE" && (
            <TouchableOpacity className="mt-2 bg-[#DA7756] py-3 rounded-xl items-center shadow-lg shadow-orange-200">
              <Text className="text-white font-bold">Tạo hợp đồng mới</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* QUICK ACTIONS */}
        <View>
          <Text className="text-lg font-bold text-gray-900 font-serif mb-3">
            Thao tác nhanh
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-white p-4 rounded-xl border border-gray-100 items-center justify-center gap-2"
              onPress={() =>
                Alert.alert(
                  "Thông báo",
                  "Tính năng báo cáo sự cố đang phát triển",
                )
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

            <TouchableOpacity
              className="flex-1 bg-white p-4 rounded-xl border border-gray-100 items-center justify-center gap-2"
              onPress={handleDelete}
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
