import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Link, useRouter } from "expo-router";
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ContractsList() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "active" | "terminated">("all");

  const {
    data: contracts = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const res = await api.get("/contracts");
      return res.data;
    },
  });

  const filteredContracts = useMemo(() => {
    if (filter === "active") return contracts.filter((c: any) => c.isActive);
    if (filter === "terminated")
      return contracts.filter((c: any) => !c.isActive);
    return contracts;
  }, [contracts, filter]);

  const stats = useMemo(() => {
    const active = contracts.filter((c: any) => c.isActive).length;
    const terminated = contracts.length - active;
    return { total: contracts.length, active, terminated };
  }, [contracts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount || 0) + " đ";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "---";
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100 flex-row justify-between items-center">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
          >
            <FontAwesome5 name="arrow-left" size={16} color="#374151" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-gray-900 font-serif">
              Hợp đồng
            </Text>
            <Text className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
              Quản lý thuê phòng
            </Text>
          </View>
        </View>

        <Link href="/(admin)/contracts/new" asChild>
          <TouchableOpacity
            className="w-10 h-10 bg-[#DA7756] rounded-2xl items-center justify-center shadow-sm"
            style={{ elevation: 2 }}
          >
            <MaterialCommunityIcons name="plus" size={20} color="white" />
          </TouchableOpacity>
        </Link>
      </View>

      {/* Stats Summary */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row gap-3">
          <View className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
            <Text className="text-[10px] font-bold text-gray-500 uppercase">
              Tất cả
            </Text>
            <Text className="text-xl font-black text-gray-900 mt-1">
              {stats.total}
            </Text>
          </View>
          <View className="flex-1 bg-green-50 rounded-xl p-3 border border-green-100">
            <Text className="text-[10px] font-bold text-green-600 uppercase">
              Đang thuê
            </Text>
            <Text className="text-xl font-black text-green-700 mt-1">
              {stats.active}
            </Text>
          </View>
          <View className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
            <Text className="text-[10px] font-bold text-gray-500 uppercase">
              Đã kết thúc
            </Text>
            <Text className="text-xl font-black text-gray-900 mt-1">
              {stats.terminated}
            </Text>
          </View>
        </View>
      </View>

      {/* FILTERS */}
      <View className="px-6 py-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: "all", label: "Tất cả", count: stats.total },
            { id: "active", label: "Đang thuê", count: stats.active },
            { id: "terminated", label: "Đã kết thúc", count: stats.terminated },
          ].map((s) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => setFilter(s.id as any)}
              className={`mr-3 px-4 py-2 rounded-xl flex-row items-center border ${
                filter === s.id
                  ? "bg-[#383838] border-[#383838]"
                  : "bg-white border-gray-200"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  filter === s.id ? "text-white" : "text-gray-500"
                }`}
              >
                {s.label}
              </Text>
              <View
                className={`ml-2 px-1.5 py-0.5 rounded ${
                  filter === s.id ? "bg-white/20" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    filter === s.id ? "text-white" : "text-gray-500"
                  }`}
                >
                  {s.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#DA7756" />
          </View>
        ) : (
          <FlatList
            key="LIST"
            data={filteredContracts}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                tintColor="#DA7756"
              />
            }
            ListEmptyComponent={
              <View className="items-center py-20">
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={64}
                  color="#E5E7EB"
                />
                <Text className="text-gray-400 mt-4 font-bold text-sm">
                  Không tìm thấy hợp đồng nào
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              return (
                <Link href={`/(admin)/contracts/${item.id}`} asChild>
                  <TouchableOpacity className="bg-white p-5 mb-4 rounded-[24px] shadow-sm border border-gray-100">
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center gap-3">
                        <View
                          className={`w-10 h-10 rounded-xl items-center justify-center ${
                            item.isActive ? "bg-green-50" : "bg-gray-100"
                          }`}
                        >
                          <FontAwesome5
                            name="file-contract"
                            size={16}
                            color={item.isActive ? "#22C55E" : "#9CA3AF"}
                          />
                        </View>
                        <View>
                          <Text className="font-bold text-gray-900 text-base">
                            Phòng {item.room?.name}
                          </Text>
                          <Text className="text-xs text-gray-500">
                            {item.room?.building?.name}
                          </Text>
                        </View>
                      </View>
                      <View
                        className={`px-3 py-1.5 rounded-lg ${
                          item.isActive ? "bg-green-100" : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-black uppercase tracking-wider ${
                            item.isActive ? "text-green-700" : "text-gray-500"
                          }`}
                        >
                          {item.isActive ? "Đang thuê" : "Đã kết thúc"}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-3 mb-4 bg-gray-50 p-3 rounded-xl">
                      <View className="w-8 h-8 bg-white rounded-full items-center justify-center shadow-sm">
                        <Text className="text-[#DA7756] font-bold text-[10px]">
                          {item.tenant?.fullName?.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-bold text-gray-900 text-sm">
                          {item.tenant?.fullName}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          Người đại diện
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
                      <View className="flex-row items-center gap-1.5">
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color="#9CA3AF"
                        />
                        <Text className="text-xs font-medium text-gray-500">
                          {formatDate(item.startDate)} →{" "}
                          {formatDate(item.endDate)}
                        </Text>
                      </View>
                      <Text className="font-black text-[#DA7756] text-base">
                        {formatCurrency(item.price)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Link>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
