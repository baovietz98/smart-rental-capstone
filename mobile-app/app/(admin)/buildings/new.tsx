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

export default function NewBuildingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      address: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post("/buildings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings-list"] });
      queryClient.invalidateQueries({ queryKey: ["buildings"] }); // For dashboard
      Alert.alert("Thành công", "Đã thêm tòa nhà mới", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      console.error(error);
      Alert.alert("Lỗi", "Không thể thêm tòa nhà");
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
          Thêm tòa nhà mới
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 space-y-4">
          {/* Name */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Tên tòa nhà <Text className="text-red-500">*</Text>
            </Text>
            <Controller
              control={control}
              name="name"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                  placeholder="VD: Sunrise Apartment"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.name && (
              <Text className="text-red-500 text-xs mt-1">
                Vui lòng nhập tên tòa nhà
              </Text>
            )}
          </View>

          {/* Address */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Địa chỉ
            </Text>
            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                  placeholder="VD: 123 Nguyễn Văn Linh..."
                  multiline
                  numberOfLines={2}
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
            <Text className="text-white font-bold text-lg">Tạo tòa nhà</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
