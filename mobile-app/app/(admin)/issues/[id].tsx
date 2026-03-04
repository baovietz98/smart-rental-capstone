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
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

export default function IssueDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: issue, isLoading } = useQuery({
    queryKey: ["issue", id],
    queryFn: async () => {
      const res = await api.get(`/issues/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await api.patch(`/issues/${id}/status`, null, { params: { status } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue", id] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      Alert.alert("Thành công", "Đã cập nhật trạng thái");
    },
    onError: (error: any) => {
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể cập nhật");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/issues/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      Alert.alert("Thành công", "Đã xóa sự cố", [
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
      "Bạn có chắc chắn muốn xóa sự cố này không? Hành động này không thể hoàn tác.",
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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "OPEN":
        return {
          label: "Mới",
          color: "text-red-600",
          bg: "bg-red-50",
          icon: "alert-circle",
        };
      case "PROCESSING":
        return {
          label: "Đang xử lý",
          color: "text-orange-600",
          bg: "bg-orange-50",
          icon: "progress-wrench",
        };
      case "DONE":
        return {
          label: "Đã xong",
          color: "text-green-600",
          bg: "bg-green-50",
          icon: "check-circle",
        };
      default:
        return {
          label: status,
          color: "text-gray-600",
          bg: "bg-gray-50",
          icon: "help-circle",
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

  if (!issue) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-500">Không tìm thấy sự cố</Text>
      </View>
    );
  }

  const statusInfo = getStatusInfo(issue.status);

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
          Chi tiết sự cố
        </Text>
        <TouchableOpacity
          className="w-10 h-10 bg-red-50 rounded-full items-center justify-center border border-red-100"
          onPress={handleDelete}
        >
          <FontAwesome5 name="trash-alt" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        {/* Main Info Card */}
        <View className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 mb-6">
          <View className="flex-row items-center gap-3 mb-4">
            <View
              className={`w-12 h-12 rounded-full items-center justify-center ${statusInfo.bg}`}
            >
              <MaterialCommunityIcons
                name={statusInfo.icon as any}
                size={24}
                color={
                  statusInfo.color.replace("text-", "").replace("-600", "") ===
                  "red"
                    ? "#DC2626"
                    : statusInfo.color
                          .replace("text-", "")
                          .replace("-600", "") === "orange"
                      ? "#EA580C"
                      : "#16A34A"
                }
              />
              {/* Note: extraction of color hex is tricky here, simplifying logic below */}
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 leading-tight">
                {issue.title}
              </Text>
              <Text className="text-sm text-gray-500 font-medium mt-1">
                {dayjs(issue.createdAt).format("HH:mm DD/MM/YYYY")}
              </Text>
            </View>
          </View>

          <View className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <Text className="text-xs font-bold text-gray-400 uppercase mb-2">
              Mô tả
            </Text>
            <Text className="text-gray-700 text-base leading-relaxed">
              {issue.description || "Không có mô tả"}
            </Text>
          </View>
        </View>

        {/* Location Card */}
        <View className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 mb-6 flex-row items-center gap-4">
          <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
            <FontAwesome5 name="building" size={16} color="#3B82F6" />
          </View>
          <View>
            <Text className="text-xs font-bold text-gray-400 uppercase">
              Địa điểm
            </Text>
            <Text className="text-base font-bold text-gray-900">
              {issue.room?.building?.name} - {issue.room?.name}
            </Text>
          </View>
        </View>

        {/* Status Actions */}
        <Text className="text-sm font-bold text-gray-500 uppercase mb-3 ml-2">
          Cập nhật trạng thái
        </Text>
        <View className="gap-3">
          {issue.status !== "OPEN" && (
            <TouchableOpacity
              className="bg-white p-4 rounded-xl border border-gray-200 flex-row items-center justify-between"
              onPress={() => updateStatusMutation.mutate("OPEN")}
            >
              <View className="flex-row items-center gap-3">
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={20}
                  color="#DC2626"
                />
                <Text className="font-bold text-gray-700">Đánh dấu Mới</Text>
              </View>
              {updateStatusMutation.isPending && <ActivityIndicator />}
            </TouchableOpacity>
          )}

          {issue.status !== "PROCESSING" && (
            <TouchableOpacity
              className="bg-white p-4 rounded-xl border border-gray-200 flex-row items-center justify-between"
              onPress={() => updateStatusMutation.mutate("PROCESSING")}
            >
              <View className="flex-row items-center gap-3">
                <MaterialCommunityIcons
                  name="progress-wrench"
                  size={20}
                  color="#EA580C"
                />
                <Text className="font-bold text-gray-700">Đang xử lý</Text>
              </View>
              {updateStatusMutation.isPending && <ActivityIndicator />}
            </TouchableOpacity>
          )}

          {issue.status !== "DONE" && (
            <TouchableOpacity
              className="bg-white p-4 rounded-xl border border-gray-200 flex-row items-center justify-between"
              onPress={() => updateStatusMutation.mutate("DONE")}
            >
              <View className="flex-row items-center gap-3">
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color="#16A34A"
                />
                <Text className="font-bold text-gray-700">Đã xong</Text>
              </View>
              {updateStatusMutation.isPending && <ActivityIndicator />}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
