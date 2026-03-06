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
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

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
          className="w-10 h-10 bg-[#DA7756] rounded-full items-center justify-center"
          style={{
            elevation: 4,
            shadowColor: "#DA7756",
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
          onPress={() => router.push("/(admin)/notifications/new" as any)}
        >
          <FontAwesome5 name="plus" size={16} color="white" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
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
            className={`p-4 mb-3 rounded-[20px] border flex-row gap-4 ${
              !item.isRead
                ? "bg-[#FFF6F3] border-[#FDE1D9]"
                : "bg-white border-gray-100"
            }`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.03,
              shadowRadius: 8,
              elevation: 1,
            }}
            onPress={() =>
              router.push(`/(admin)/notifications/${item.id}` as any)
            }
          >
            <View
              className={`w-12 h-12 rounded-full items-center justify-center ${
                item.type === "ISSUE"
                  ? "bg-red-50"
                  : item.type === "PAYMENT"
                    ? "bg-emerald-50"
                    : "bg-blue-50"
              }`}
            >
              <FontAwesome5
                name={
                  item.type === "ISSUE"
                    ? "exclamation-triangle"
                    : item.type === "PAYMENT"
                      ? "file-invoice-dollar"
                      : "bell"
                }
                size={18}
                color={
                  item.type === "ISSUE"
                    ? "#DC2626"
                    : item.type === "PAYMENT"
                      ? "#059669"
                      : "#2563EB"
                }
              />
              {!item.isRead && (
                <View className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
              )}
            </View>
            <View className="flex-1 justify-center">
              <View className="flex-row justify-between items-start mb-1 gap-2">
                <Text
                  className={`flex-1 text-[15px] ${
                    !item.isRead
                      ? "font-black text-gray-900"
                      : "font-bold text-gray-700"
                  }`}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 whitespace-nowrap">
                  {dayjs(item.createdAt).fromNow()}
                </Text>
              </View>
              <Text
                className={`text-[13px] leading-relaxed ${
                  !item.isRead ? "text-gray-700 font-medium" : "text-gray-500"
                }`}
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
