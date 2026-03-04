import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Controller, useForm } from "react-hook-form";

export default function CreateNotificationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      content: "",
      type: "GENERAL",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post("/notifications", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      Alert.alert("Thành công", "Đã gửi thông báo", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể tạo thông báo",
      );
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      {/* HEADER */}
      <View className="px-6 py-4 bg-white border-b border-gray-100 flex-row items-center gap-4">
        <TouchableOpacity
          className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
          onPress={() => router.back()}
        >
          <FontAwesome5 name="arrow-left" size={16} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 font-serif">
          Tạo thông báo mới
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 space-y-4">
          {/* Type Selection */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Loại thông báo
            </Text>
            <Controller
              control={control}
              name="type"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row gap-2">
                  {[
                    {
                      id: "GENERAL",
                      label: "Chung",
                      icon: "info",
                      color: "blue",
                    },
                    {
                      id: "SYSTEM",
                      label: "Hệ thống",
                      icon: "server",
                      color: "gray",
                    },
                    {
                      id: "ALERT",
                      label: "Cảnh báo",
                      icon: "exclamation-triangle",
                      color: "red",
                    },
                  ].map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      onPress={() => onChange(type.id)}
                      className={`flex-1 p-3 rounded-xl border items-center justify-center gap-2 ${
                        value === type.id
                          ? `bg-${type.color}-50 border-${type.color}-200`
                          : "bg-white border-gray-100"
                      }`}
                    >
                      <FontAwesome5
                        name={type.icon as any}
                        size={16}
                        color={
                          value === type.id
                            ? type.color === "red"
                              ? "#DC2626"
                              : type.color === "blue"
                                ? "#2563EB"
                                : "#374151"
                            : "#9CA3AF"
                        }
                      />
                      <Text
                        className={`text-xs font-bold ${
                          value === type.id
                            ? type.color === "red"
                              ? "text-red-700"
                              : type.color === "blue"
                                ? "text-blue-700"
                                : "text-gray-700"
                            : "text-gray-400"
                        }`}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>

          {/* Title */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Tiêu đề
            </Text>
            <Controller
              control={control}
              name="title"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                  placeholder="VD: Bảo trì thang máy..."
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.title && (
              <Text className="text-red-500 text-xs mt-1">
                Vui lòng nhập tiêu đề
              </Text>
            )}
          </View>

          {/* Content */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Nội dung
            </Text>
            <Controller
              control={control}
              name="content"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                  placeholder="Nội dung chi tiết thông báo..."
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  style={{ minHeight: 120 }}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.content && (
              <Text className="text-red-500 text-xs mt-1">
                Vui lòng nhập nội dung
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          className="bg-[#DA7756] p-4 rounded-xl mt-6 items-center shadow-lg shadow-orange-200"
          onPress={handleSubmit(onSubmit)}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Gửi thông báo</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
