import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function RoomsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [buildingFilter, setBuildingFilter] = useState<number | "ALL">("ALL");

  // Fetch Rooms
  const {
    data: rooms,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await api.get("/rooms");
      return res.data;
    },
  });

  // Fetch Buildings for Filter
  const { data: buildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: async () => {
      const res = await api.get("/buildings");
      return res.data;
    },
  });

  const filteredRooms = useMemo(() => {
    if (!rooms) return [];
    return rooms.filter((room: any) => {
      const matchesStatus =
        statusFilter === "ALL" || room.status === statusFilter;
      const matchesBuilding =
        buildingFilter === "ALL" || room.buildingId === buildingFilter;
      const matchesSearch = room.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesStatus && matchesBuilding && matchesSearch;
    });
  }, [rooms, statusFilter, buildingFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = rooms?.length || 0;
    const available =
      rooms?.filter((r: any) => r.status === "AVAILABLE").length || 0;
    const rented = rooms?.filter((r: any) => r.status === "RENTED").length || 0;
    const maintenance =
      rooms?.filter((r: any) => r.status === "MAINTENANCE").length || 0;
    return { total, available, rented, maintenance };
  }, [rooms]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RENTED":
        return { bg: "bg-pink-100", text: "text-pink-700", label: "Đang ở" };
      case "AVAILABLE":
        return { bg: "bg-green-100", text: "text-green-700", label: "Trống" };
      case "MAINTENANCE":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-700",
          label: "Bảo trì",
        };
      default:
        return { bg: "bg-gray-100", text: "text-gray-700", label: status };
    }
  };

  const renderRoomCard = ({ item }: { item: any }) => {
    const status = getStatusColor(item.status);
    const buildingName =
      buildings?.find((b: any) => b.id === item.buildingId)?.name ||
      "Unknown Building";

    if (viewMode === "GRID") {
      return (
        <TouchableOpacity
          className="bg-white rounded-[20px] p-4 mb-3 border border-gray-100 shadow-sm flex-1 m-1.5"
          style={{ minHeight: 160 }}
          onPress={() => router.push(`/(admin)/rooms/${item.id}`)}
        >
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[80%]">
              {buildingName}
            </Text>
            <View
              className={`w-2 h-2 rounded-full ${
                item.status === "AVAILABLE"
                  ? "bg-green-500"
                  : item.status === "RENTED"
                    ? "bg-pink-500"
                    : "bg-yellow-500"
              }`}
            />
          </View>

          <Text className="text-2xl font-black text-[#383838] font-serif mb-1">
            {item.name}
          </Text>
          <Text className="text-lg font-bold text-[#DA7756]">
            {new Intl.NumberFormat("vi-VN").format(item.price)}
          </Text>

          <View className="mt-auto space-y-1">
            <View className="flex-row items-center">
              <MaterialCommunityIcons
                name="floor-plan"
                size={12}
                color="#9CA3AF"
              />
              <Text className="text-xs text-gray-500 ml-1">
                {item.area} m² · Tầng {item.floor}
              </Text>
            </View>
            <View className="flex-row items-center">
              <FontAwesome5 name="users" size={10} color="#9CA3AF" />
              <Text className="text-xs text-gray-500 ml-1">
                {item._count?.contracts || 0} / {item.maxTenants} người
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // LIST VIEW
    return (
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm flex-row items-center"
        onPress={() => router.push(`/(admin)/rooms/${item.id}`)}
      >
        <View className="w-12 h-12 bg-gray-50 rounded-xl items-center justify-center mr-4 border border-gray-100">
          <Text className="font-bold text-gray-700 text-lg">{item.name}</Text>
        </View>
        <View className="flex-1">
          <Text className="font-bold text-[#383838] text-base">
            {buildingName}
          </Text>
          <Text className="text-[#DA7756] font-bold text-sm">
            {formatCurrency(item.price)}
          </Text>
          <Text className="text-gray-400 text-xs mt-0.5">
            {item.area} m² • {item._count?.contracts || 0} người
          </Text>
        </View>
        <View className={`${status.bg} px-3 py-1 rounded-lg`}>
          <Text className={`${status.text} text-xs font-bold`}>
            {status.label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      {/* HEADER */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-2xl font-bold text-gray-900 font-serif">
              Quản lý phòng
            </Text>
            <Text className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
              {stats.total} phòng trong hệ thống
            </Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="w-10 h-10 bg-[#DA7756] rounded-full items-center justify-center shadow-lg shadow-orange-200"
              onPress={() => router.push("/(admin)/rooms/new" as any)}
            >
              <FontAwesome5 name="plus" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH & TOGGLE VIEW */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-gray-50 rounded-xl border border-gray-200 flex-row items-center px-4 h-11">
            <FontAwesome5 name="search" size={14} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 font-medium text-gray-900"
              placeholder="Tìm phòng..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View className="flex-row bg-gray-50 rounded-xl border border-gray-200 p-1">
            <TouchableOpacity
              className={`p-2 rounded-lg ${
                viewMode === "GRID" ? "bg-white shadow-sm" : ""
              }`}
              onPress={() => setViewMode("GRID")}
            >
              <MaterialCommunityIcons
                name="view-grid"
                size={20}
                color={viewMode === "GRID" ? "#DA7756" : "#9CA3AF"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              className={`p-2 rounded-lg ${
                viewMode === "LIST" ? "bg-white shadow-sm" : ""
              }`}
              onPress={() => setViewMode("LIST")}
            >
              <MaterialCommunityIcons
                name="view-list"
                size={20}
                color={viewMode === "LIST" ? "#DA7756" : "#9CA3AF"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* FILTERS */}
      <View className="px-6 py-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          {[
            { id: "ALL", label: "Tất cả", count: stats.total },
            { id: "AVAILABLE", label: "Trống", count: stats.available },
            { id: "RENTED", label: "Đang ở", count: stats.rented },
            { id: "MAINTENANCE", label: "Bảo trì", count: stats.maintenance },
          ].map((s) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => setStatusFilter(s.id)}
              className={`mr-3 px-4 py-2 rounded-xl flex-row items-center border ${
                statusFilter === s.id
                  ? "bg-[#383838] border-[#383838]"
                  : "bg-white border-gray-200"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  statusFilter === s.id ? "text-white" : "text-gray-500"
                }`}
              >
                {s.label}
              </Text>
              <View
                className={`ml-2 px-1.5 py-0.5 rounded ${
                  statusFilter === s.id ? "bg-white/20" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    statusFilter === s.id ? "text-white" : "text-gray-500"
                  }`}
                >
                  {s.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* CONTENT */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#DA7756" />
        </View>
      ) : (
        <FlatList
          key={viewMode} // Force re-render on toggle
          data={filteredRooms}
          keyExtractor={(item) => item.id.toString()}
          numColumns={viewMode === "GRID" ? 2 : 1}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor="#DA7756"
            />
          }
          renderItem={renderRoomCard}
        />
      )}
    </SafeAreaView>
  );
}
