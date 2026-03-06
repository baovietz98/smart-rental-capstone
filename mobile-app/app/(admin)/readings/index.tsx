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
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMemo, useState } from "react";

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

  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const currentMonthStr = `${String(selectedMonth.getMonth() + 1).padStart(
    2,
    "0",
  )}-${selectedMonth.getFullYear()}`;

  const {
    data: globalUnreadRooms,
    isLoading: isLoadingUnread,
    refetch: refetchUnread,
  } = useQuery({
    queryKey: ["rooms-unread", "global", currentMonthStr],
    queryFn: async () => {
      const res = await api.get("/readings/unread", {
        params: { month: currentMonthStr }, // No buildingId -> get all
      });
      return res.data;
    },
  });

  const isGlobalLoading = isLoading || isLoadingUnread;

  const refetchAll = () => {
    refetch();
    refetchUnread();
  };

  const unreadCountSummary = useMemo(() => {
    if (!globalUnreadRooms) return { total: 0, byBuilding: {} };

    const byBuilding: Record<number, number> = {};
    let total = 0;

    globalUnreadRooms.forEach((r: any) => {
      total++;
      if (!byBuilding[r.buildingId]) {
        byBuilding[r.buildingId] = 0;
      }
      byBuilding[r.buildingId]++;
    });

    return { total, byBuilding };
  }, [globalUnreadRooms]);

  const changeMonth = (delta: number) => {
    const next = new Date(selectedMonth);
    next.setMonth(next.getMonth() + delta);
    setSelectedMonth(next);
  };

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
        <View>
          <Text className="text-xl font-bold text-gray-900 font-serif">
            Chốt điện nước
          </Text>
        </View>

        <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-2xl border border-gray-100 ml-auto">
          <TouchableOpacity onPress={() => changeMonth(-1)} className="p-1">
            <FontAwesome5 name="chevron-left" size={10} color="#374151" />
          </TouchableOpacity>
          <Text className="mx-3 text-xs font-bold text-gray-700">
            {currentMonthStr}
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)} className="p-1">
            <FontAwesome5 name="chevron-right" size={10} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={isGlobalLoading}
            onRefresh={refetchAll}
            tintColor="#DA7756"
          />
        }
      >
        <Text className="text-gray-500 font-medium mb-4 uppercase text-xs tracking-wider">
          Chọn tòa nhà để chốt số
        </Text>

        {/* Global Warning Banner */}
        {unreadCountSummary.total > 0 && !isGlobalLoading && (
          <View className="mb-6 bg-amber-50 rounded-2xl p-4 border border-amber-200 flex-row items-center shadow-sm">
            <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center mr-3">
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={20}
                color="#D97706"
              />
            </View>
            <View className="flex-1">
              <Text className="text-amber-800 font-bold text-sm">
                Báo cáo tháng {currentMonthStr}
              </Text>
              <Text className="text-amber-700 text-xs mt-0.5" numberOfLines={2}>
                Toàn hệ thống đang có{" "}
                <Text className="font-bold">{unreadCountSummary.total}</Text>{" "}
                phòng chưa được chốt chỉ số điện/nước.
              </Text>
            </View>
          </View>
        )}

        {isGlobalLoading ? (
          <ActivityIndicator size="large" color="#DA7756" className="mt-10" />
        ) : (
          <View className="space-y-4">
            {buildings?.map((b: any) => {
              const buildingUnreadCount =
                unreadCountSummary.byBuilding[b.id] || 0;

              return (
                <TouchableOpacity
                  key={b.id}
                  className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex-row justify-between items-center active:bg-gray-50 mb-4"
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
                    {buildingUnreadCount > 0 && (
                      <View className="flex-row items-center mt-2">
                        <View className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
                        <Text className="text-amber-600 text-[11px] font-bold">
                          {buildingUnreadCount} phòng chưa chốt
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                    <FontAwesome5
                      name="chevron-right"
                      size={14}
                      color="#9CA3AF"
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
