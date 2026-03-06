import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function BuildingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. Fetch Buildings
  const {
    data: buildings,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["buildings-list"],
    queryFn: async () => {
      const res = await api.get("/buildings");
      return res.data;
    },
  });

  // 2. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/buildings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings-list"] });
      Alert.alert("Thành công", "Đã xóa tòa nhà");
    },
    onError: (error: any) => {
      Alert.alert(
        "Không thể xóa",
        error.response?.data?.message || "Đã có lỗi xảy ra",
      );
    },
  });

  const handleDelete = (building: any) => {
    if (building.totalRooms > 0) {
      Alert.alert(
        "Không thể xóa",
        `Tòa nhà này đang có ${building.totalRooms} phòng. Vui lòng xóa hết phòng trước khi xóa tòa nhà.`,
      );
      return;
    }

    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa tòa nhà "${building.name}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => deleteMutation.mutate(building.id),
        },
      ],
    );
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      {/* HEADER */}
      <View className="px-6 py-4 bg-white border-b border-gray-100 flex-row justify-between items-center shadow-sm">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
        >
          <FontAwesome5 name="arrow-left" size={16} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 font-serif">
          Quản lý tòa nhà
        </Text>
        <TouchableOpacity
          className="w-10 h-10 bg-[#DA7756] rounded-full items-center justify-center shadow-lg shadow-orange-200"
          onPress={() => router.push("/(admin)/buildings/new" as any)}
        >
          <FontAwesome5 name="plus" size={16} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#DA7756" className="mt-10" />
        ) : buildings?.length === 0 ? (
          <View className="items-center justify-center py-20">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <FontAwesome5 name="city" size={32} color="#9CA3AF" />
            </View>
            <Text className="text-gray-500 font-medium text-center">
              Chưa có tòa nhà nào.{"\n"}Hãy thêm tòa nhà đầu tiên!
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {buildings?.map((b: any) => (
              <View
                key={b.id}
                className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100"
              >
                {/* Building Header */}
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-1 mr-4">
                    <Text className="text-lg font-bold text-gray-900 mb-1">
                      {b.name}
                    </Text>
                    <View className="flex-row items-center">
                      <FontAwesome5
                        name="map-marker-alt"
                        size={12}
                        color="#9CA3AF"
                        className="mr-1.5"
                      />
                      <Text
                        className="text-gray-500 text-xs flex-1"
                        numberOfLines={1}
                      >
                        {b.address || "Chưa cập nhật địa chỉ"}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      className="w-8 h-8 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
                      onPress={() =>
                        router.push({
                          pathname: "/(admin)/buildings/edit",
                          params: { id: b.id },
                        })
                      }
                    >
                      <FontAwesome5 name="pen" size={12} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="w-8 h-8 bg-red-50 rounded-full items-center justify-center border border-red-100"
                      onPress={() => handleDelete(b)}
                    >
                      <FontAwesome5 name="trash" size={12} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Stats Grid */}
                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <Text className="text-gray-400 text-[10px] font-bold uppercase mb-1">
                      Tổng phòng
                    </Text>
                    <Text className="text-gray-900 font-bold text-lg">
                      {b.totalRooms}
                    </Text>
                  </View>
                  <View className="flex-1 bg-green-50 p-3 rounded-xl border border-green-100">
                    <Text className="text-green-600/60 text-[10px] font-bold uppercase mb-1">
                      Đang ở
                    </Text>
                    <Text className="text-green-700 font-bold text-lg">
                      {b.rentedRooms}
                    </Text>
                  </View>
                  <View className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <Text className="text-gray-400 text-[10px] font-bold uppercase mb-1">
                      Trống
                    </Text>
                    <Text className="text-gray-900 font-bold text-lg">
                      {b.availableRooms}
                    </Text>
                  </View>
                </View>

                {/* Revenue Preview */}
                <View className="bg-[#DA7756]/5 p-3 rounded-xl border border-[#DA7756]/10 flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2">
                    <View className="w-6 h-6 bg-[#DA7756]/20 rounded-full items-center justify-center">
                      <FontAwesome5
                        name="money-bill-wave"
                        size={10}
                        color="#DA7756"
                      />
                    </View>
                    <Text className="text-[#DA7756] text-xs font-bold uppercase">
                      Doanh thu dự kiến
                    </Text>
                  </View>
                  <Text className="text-[#DA7756] font-bold">
                    {formatCurrency(b.totalRevenue)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
