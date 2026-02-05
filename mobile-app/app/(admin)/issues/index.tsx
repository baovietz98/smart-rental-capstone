import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

export default function IssuesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("ALL");

  const {
    data: issues,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["issues"],
    queryFn: async () => {
      const res = await api.get("/issues");
      return res.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await api.patch(`/issues/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      Alert.alert("Thành công", "Đã cập nhật trạng thái");
    },
    onError: () => {
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái");
    },
  });

  const filteredIssues = useMemo(() => {
    if (!issues) return [];
    if (statusFilter === "ALL") return issues;
    return issues.filter((i: any) => i.status === statusFilter);
  }, [issues, statusFilter]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "OPEN":
        return {
          label: "Mới",
          bg: "bg-red-50",
          text: "text-red-700",
          icon: "alert-circle",
        };
      case "PROCESSING":
        return {
          label: "Đang xử lý",
          bg: "bg-orange-50",
          text: "text-orange-700",
          icon: "progress-wrench",
        };
      case "DONE":
        return {
          label: "Đã xong",
          bg: "bg-green-50",
          text: "text-green-700",
          icon: "check-circle",
        };
      default:
        return {
          label: status,
          bg: "bg-gray-50",
          text: "text-gray-700",
          icon: "alert",
        };
    }
  };

  const handleStatusPress = (issue: any) => {
    Alert.alert(
      "Cập nhật trạng thái",
      `Chọn trạng thái mới cho "${issue.title}"`,
      [
        {
          text: "Mới",
          onPress: () =>
            updateStatusMutation.mutate({ id: issue.id, status: "OPEN" }),
        },
        {
          text: "Đang xử lý",
          onPress: () =>
            updateStatusMutation.mutate({ id: issue.id, status: "PROCESSING" }),
        },
        {
          text: "Đã xong",
          onPress: () =>
            updateStatusMutation.mutate({ id: issue.id, status: "DONE" }),
        },
        { text: "Hủy", style: "cancel" },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      {/* HEADER */}
      <View className="px-6 py-4 bg-white border-b border-gray-100 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold text-gray-900 font-serif">
            Sự cố
          </Text>
          <Text className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
            Báo cáo & Xử lý
          </Text>
        </View>
        <TouchableOpacity
          className="w-10 h-10 bg-[#DA7756] rounded-full items-center justify-center shadow-lg shadow-orange-200"
          onPress={() => router.push("/(admin)/issues/new" as any)}
        >
          <FontAwesome5 name="plus" size={16} color="white" />
        </TouchableOpacity>
      </View>

      {/* FILTERS */}
      <View className="mt-4 px-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "OPEN", label: "Mới" },
            { id: "PROCESSING", label: "Đang xử lý" },
            { id: "DONE", label: "Đã xong" },
          ].map((f) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => setStatusFilter(f.id)}
              className={`mr-3 px-4 py-2 rounded-xl border ${
                statusFilter === f.id
                  ? "bg-[#383838] border-[#383838]"
                  : "bg-white border-gray-200"
              }`}
            >
              <Text
                className={`font-bold text-xs ${
                  statusFilter === f.id ? "text-white" : "text-gray-600"
                }`}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LIST */}
      <FlatList
        data={filteredIssues}
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
          !isLoading ? (
            <View className="items-center py-20">
              <MaterialCommunityIcons
                name="clipboard-check-outline"
                size={64}
                color="#E5E7EB"
              />
              <Text className="text-gray-400 mt-4 font-bold text-sm">
                Không có sự cố nào
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const status = getStatusInfo(item.status);
          return (
            <TouchableOpacity
              className="bg-white p-5 mb-4 rounded-2xl border border-gray-100 shadow-sm"
              onPress={() => handleStatusPress(item)}
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-row items-center gap-2">
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center ${status.bg}`}
                  >
                    <MaterialCommunityIcons
                      name={status.icon as any}
                      size={14}
                      color={
                        status.text.includes("red")
                          ? "#B91C1C"
                          : status.text.includes("orange")
                            ? "#C2410C"
                            : "#15803D"
                      }
                    />
                  </View>
                  <View>
                    <Text className="text-xs text-gray-400 font-bold uppercase">
                      {item.room?.building?.name} - {item.room?.name}
                    </Text>
                    <Text className="text-gray-900 font-bold text-base mt-0.5">
                      {item.title}
                    </Text>
                  </View>
                </View>
                <Text className="text-[10px] text-gray-400 font-medium">
                  {dayjs(item.createdAt).fromNow()}
                </Text>
              </View>

              <View className="bg-gray-50 p-3 rounded-xl mb-3">
                <Text className="text-gray-600 text-sm leading-relaxed">
                  {item.description}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <View className={`${status.bg} px-3 py-1 rounded-lg`}>
                  <Text className={`text-xs font-bold ${status.text}`}>
                    {status.label}
                  </Text>
                </View>
                <Text className="text-[#DA7756] text-xs font-bold">
                  Cập nhật
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}
