import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { useEffect } from "react";

dayjs.extend(relativeTime);
dayjs.locale("vi");

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: notification, isLoading } = useQuery({
    queryKey: ["notification", id],
    queryFn: async () => {
      const res = await api.get(`/notifications/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const markReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Auto mark as read when viewed
  useEffect(() => {
    if (notification && !notification.isRead) {
      markReadMutation.mutate();
    }
  }, [notification, markReadMutation]);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      Alert.alert("Thành công", "Đã xóa thông báo", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể xóa");
    },
  });

  const handleDelete = () => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa thông báo này không?",
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

  const getTypeInfo = (type: string) => {
    switch (type) {
      case "ISSUE":
        return {
          icon: "exclamation-circle",
          color: "text-red-600",
          bg: "bg-red-50",
        };
      case "PAYMENT":
        return {
          icon: "money-bill-wave",
          color: "text-green-600",
          bg: "bg-green-50",
        };
      case "ALERT":
        return {
          icon: "exclamation-triangle",
          color: "text-orange-600",
          bg: "bg-orange-50",
        };
      case "SYSTEM":
        return { icon: "server", color: "text-gray-600", bg: "bg-gray-50" };
      default:
        return {
          icon: "info-circle",
          color: "text-blue-600",
          bg: "bg-blue-50",
        };
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#DA7756" />
      </View>
    );
  }

  if (!notification) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-500">Không tìm thấy thông báo</Text>
      </View>
    );
  }

  const typeInfo = getTypeInfo(notification.type);

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <TouchableOpacity
          className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
          onPress={() => router.back()}
        >
          <FontAwesome5 name="arrow-left" size={16} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 font-serif">
          Chi tiết
        </Text>
        <TouchableOpacity
          className="w-10 h-10 bg-red-50 rounded-full items-center justify-center border border-red-100"
          onPress={handleDelete}
        >
          <FontAwesome5 name="trash-alt" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Main Info Card */}
        <View className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 mb-6">
          <View className="flex-row items-center gap-3 mb-4">
            <View
              className={`w-12 h-12 rounded-full items-center justify-center ${typeInfo.bg}`}
            >
              <FontAwesome5
                name={typeInfo.icon as any}
                size={20}
                color={
                  typeInfo.color.replace("text-", "").replace("-600", "") ===
                  "red"
                    ? "#DC2626"
                    : typeInfo.color
                          .replace("text-", "")
                          .replace("-600", "") === "green"
                      ? "#16A34A"
                      : typeInfo.color
                            .replace("text-", "")
                            .replace("-600", "") === "orange"
                        ? "#EA580C"
                        : typeInfo.color
                              .replace("text-", "")
                              .replace("-600", "") === "blue"
                          ? "#2563EB"
                          : "#4B5563"
                }
              />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 leading-tight">
                {notification.title}
              </Text>
              <Text className="text-sm text-gray-500 font-medium mt-1">
                {dayjs(notification.createdAt).format("HH:mm DD/MM/YYYY")}
              </Text>
            </View>
          </View>

          <View className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <Text className="text-gray-800 text-base leading-relaxed">
              {notification.content ||
                notification.message ||
                "Không có nội dung"}
            </Text>
          </View>
        </View>

        {/* Meta Info */}
        <View className="flex-row gap-4">
          <View className="flex-1 bg-white p-4 rounded-xl border border-gray-100 items-center">
            <Text className="text-xs text-gray-400 font-bold uppercase mb-1">
              TRẠNG THÁI
            </Text>
            <Text
              className={`font-bold ${notification.isRead ? "text-green-600" : "text-orange-600"}`}
            >
              {notification.isRead ? "Đã đọc" : "Chưa đọc"}
            </Text>
          </View>
          <View className="flex-1 bg-white p-4 rounded-xl border border-gray-100 items-center">
            <Text className="text-xs text-gray-400 font-bold uppercase mb-1">
              LOẠI
            </Text>
            <Text className="font-bold text-gray-700">
              {notification.type || "General"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
