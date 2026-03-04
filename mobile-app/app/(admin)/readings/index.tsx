import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function ReadingsList() {
  const router = useRouter();

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

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      {/* HEADER */}
      <View className="px-6 py-4 bg-white border-b border-gray-100 flex-row items-center gap-4 shadow-sm">
        <TouchableOpacity
          className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
          onPress={() => router.back()}
        >
          <FontAwesome5 name="arrow-left" size={16} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 font-serif">
          Chốt điện nước
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        <Text className="text-gray-500 font-medium mb-4 uppercase text-xs tracking-wider">
          Chọn tòa nhà để chốt số
        </Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#DA7756" className="mt-10" />
        ) : (
          <View className="space-y-4">
            {buildings?.map((b: any) => (
              <TouchableOpacity
                key={b.id}
                className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex-row justify-between items-center active:bg-gray-50"
                onPress={() =>
                  router.push({
                    pathname: "/(admin)/readings/[buildingId]",
                    params: { buildingId: b.id, name: b.name },
                  })
                }
              >
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900 mb-1">
                    {b.name}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    {b.totalRooms} phòng •{" "}
                    {b.address || "Chưa cập nhật địa chỉ"}
                  </Text>
                </View>
                <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                  <FontAwesome5
                    name="chevron-right"
                    size={14}
                    color="#9CA3AF"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
