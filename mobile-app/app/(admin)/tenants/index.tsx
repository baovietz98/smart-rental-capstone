import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function TenantsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: tenants,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const res = await api.get("/tenants");
      return res.data;
    },
  });

  const filteredTenants = useMemo(() => {
    if (!tenants) return [];
    return tenants.filter(
      (t: any) =>
        t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.phone?.includes(searchQuery),
    );
  }, [tenants, searchQuery]);

  const renderTenantItem = ({ item }: { item: any }) => {
    const roomName = item.contracts?.[0]?.room?.name;
    const buildingName = item.contracts?.[0]?.room?.building?.name;

    return (
      <TouchableOpacity
        className="bg-white p-4 mb-3 rounded-2xl border border-gray-100 shadow-sm flex-row items-center gap-4"
        onPress={() => router.push(`/(admin)/tenants/${item.id}`)}
      >
        <View className="w-12 h-12 bg-gray-50 rounded-full items-center justify-center border border-gray-100">
          <Text className="text-[#DA7756] font-bold text-lg font-serif">
            {item.fullName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View className="flex-1">
          <Text className="text-gray-900 font-bold text-base font-serif">
            {item.fullName}
          </Text>
          <View className="flex-row items-center mt-1">
            <FontAwesome5 name="phone-alt" size={10} color="#9CA3AF" />
            <Text className="text-gray-500 text-xs ml-1.5">{item.phone}</Text>
          </View>
        </View>

        <View className="items-end">
          {roomName ? (
            <View className="bg-green-50 px-2 py-1 rounded-lg">
              <Text className="text-green-700 font-bold text-xs">
                {roomName}
              </Text>
              <Text className="text-green-600/60 text-[10px]">
                {buildingName}
              </Text>
            </View>
          ) : (
            <View className="bg-orange-50 px-2 py-1 rounded-lg">
              <Text className="text-orange-600 font-bold text-[10px]">
                Chưa thuê
              </Text>
            </View>
          )}
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
              Cư dân
            </Text>
            <Text className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
              Quản lý khách thuê
            </Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 bg-[#DA7756] rounded-full items-center justify-center shadow-lg shadow-orange-200"
            onPress={() => router.push("/(admin)/tenants/new" as any)}
          >
            <FontAwesome5 name="plus" size={16} color="white" />
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <View className="bg-gray-50 rounded-xl border border-gray-200 flex-row items-center px-4 h-11">
          <FontAwesome5 name="search" size={14} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 font-medium text-gray-900"
            placeholder="Tìm theo tên hoặc SĐT..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* CONTENT */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#DA7756" />
        </View>
      ) : (
        <FlatList
          data={filteredTenants}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
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
                name="account-search-outline"
                size={64}
                color="#E5E7EB"
              />
              <Text className="text-gray-400 mt-4 font-bold text-sm">
                Không tìm thấy cư dân nào
              </Text>
            </View>
          }
          renderItem={renderTenantItem}
        />
      )}
    </SafeAreaView>
  );
}
