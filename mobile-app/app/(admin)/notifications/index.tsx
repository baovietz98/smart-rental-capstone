import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import React from "react";

export default function NotificationsScreen() {
  const router = useRouter();

  const {
    data: notifications,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications");
      return res.data;
    },
  });

  /* Mark Read moved to Detail Screen */

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100 flex-row justify-between items-center">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
            onPress={() => router.back()}
          >
            <FontAwesome5 name="arrow-left" size={16} color="#374151" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-gray-900 font-serif">
              Thông báo
            </Text>
            <Text className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
              Cập nhật hệ thống
            </Text>
          </View>
        </View>
        <TouchableOpacity
          className="w-10 h-10 bg-[#DA7756] rounded-full items-center justify-center shadow-lg shadow-orange-200"
          onPress={() => router.push("/(admin)/notifications/new" as any)}
        >
          <FontAwesome5 name="plus" size={16} color="white" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#DA7756"
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-20">
              <MaterialCommunityIcons
                name="bell-sleep-outline"
                size={64}
                color="#E5E7EB"
              />
              <Text className="text-gray-400 mt-4 font-bold text-sm">
                Không có thông báo nào
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            className={`bg-white p-4 mb-3 rounded-2xl border border-gray-100 shadow-sm flex-row gap-4 ${!item.isRead ? "bg-orange-50/30" : ""}`}
            onPress={() =>
              router.push(`/(admin)/notifications/${item.id}` as any)
            }
          >
            <View
              className={`w-10 h-10 rounded-full items-center justify-center ${
                item.type === "ISSUE"
                  ? "bg-red-100"
                  : item.type === "PAYMENT"
                    ? "bg-green-100"
                    : "bg-blue-100"
              }`}
            >
              <FontAwesome5
                name={
                  item.type === "ISSUE"
                    ? "exclamation-circle"
                    : item.type === "PAYMENT"
                      ? "money-bill-wave"
                      : "info"
                }
                size={16}
                color={
                  item.type === "ISSUE"
                    ? "#DC2626"
                    : item.type === "PAYMENT"
                      ? "#16A34A"
                      : "#2563EB"
                }
              />
            </View>
            <View className="flex-1">
              <View className="flex-row justify-between items-start">
                <Text className="font-bold text-gray-900 text-sm flex-1 mr-2">
                  {item.title}
                </Text>
                <Text className="text-[10px] text-gray-400 font-medium">
                  {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </Text>
              </View>
              <Text
                className="text-gray-500 text-xs mt-1 leading-relaxed"
                numberOfLines={2}
              >
                {item.message}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
