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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";

export default function CreateIssueScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const { data: rooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await api.get("/rooms");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post("/issues", {
        ...data,
        roomId: selectedRoomId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      Alert.alert("Thành công", "Đã gửi báo cáo sự cố", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      console.error(error);
      Alert.alert("Lỗi", "Không thể tạo sự cố");
    },
  });

  const onSubmit = (data: any) => {
    if (!selectedRoomId) {
      Alert.alert("Lỗi", "Vui lòng chọn phòng");
      return;
    }
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
          Báo cáo sự cố
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 space-y-4">
          {/* Room Selection */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Phòng
            </Text>
            {/* Simple Dropdown Simulator */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="py-1"
            >
              {rooms?.map((r: any) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => setSelectedRoomId(r.id)}
                  className={`mr-3 px-4 py-2 rounded-xl border ${
                    selectedRoomId === r.id
                      ? "bg-[#D97757] border-[#D97757]"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`font-bold ${selectedRoomId === r.id ? "text-white" : "text-gray-700"}`}
                  >
                    {r.name} - {r.building?.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* If no room selected */}
            {!selectedRoomId && (
              <Text className="text-red-500 text-xs mt-1">
                Vui lòng chọn phòng
              </Text>
            )}
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
                  placeholder="VD: Hỏng bóng đèn..."
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

          {/* Description */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Chi tiết
            </Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                  placeholder="Mô tả cụ thể vấn đề..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={{ minHeight: 100 }}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
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
            <Text className="text-white font-bold text-lg">Gửi báo cáo</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
