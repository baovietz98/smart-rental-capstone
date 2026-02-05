import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

export default function AddRoomScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      price: "",
      area: "",
      floor: "",
      maxTenants: "2",
      buildingId: "",
    },
  });

  const { data: buildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: async () => {
      const res = await api.get("/buildings");
      return res.data;
    },
  });

  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post("/rooms", {
        ...data,
        price: parseFloat(data.price),
        area: parseFloat(data.area),
        floor: parseInt(data.floor),
        maxTenants: parseInt(data.maxTenants),
        buildingId: selectedBuilding,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      Alert.alert("Thành công", "Đã thêm phòng mới", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      console.error(error);
      Alert.alert("Lỗi", "Không thể thêm phòng. Vui lòng thử lại.");
    },
  });

  const onSubmit = (data: any) => {
    if (!selectedBuilding) {
      Alert.alert("Lỗi", "Vui lòng chọn tòa nhà");
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
          Thêm phòng mới
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 space-y-4">
          {/* Building Selection */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Tòa nhà
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {buildings?.map((b: any) => (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => setSelectedBuilding(b.id)}
                  className={`mr-3 px-4 py-2 rounded-xl border ${
                    selectedBuilding === b.id
                      ? "bg-[#383838] border-[#383838]"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`font-bold ${
                      selectedBuilding === b.id ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Name */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Tên phòng
            </Text>
            <Controller
              control={control}
              name="name"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                  placeholder="VD: P.101"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.name && (
              <Text className="text-red-500 text-xs mt-1">
                Vui lòng nhập tên phòng
              </Text>
            )}
          </View>

          {/* Price */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Giá thuê (VNĐ)
            </Text>
            <Controller
              control={control}
              name="price"
              rules={{ required: true, pattern: /^\d+$/ }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                  placeholder="VD: 3500000"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.price && (
              <Text className="text-red-500 text-xs mt-1">
                Giá không hợp lệ
              </Text>
            )}
          </View>

          {/* Area & Floor */}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
                Diện tích (m²)
              </Text>
              <Controller
                control={control}
                name="area"
                rules={{ required: true }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                    placeholder="25"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
                Tầng
              </Text>
              <Controller
                control={control}
                name="floor"
                rules={{ required: true }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                    placeholder="1"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
          </View>

          {/* Max Tenants */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Số người tối đa
            </Text>
            <Controller
              control={control}
              name="maxTenants"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                  placeholder="2"
                  keyboardType="numeric"
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
            <Text className="text-white font-bold text-lg">Tạo phòng mới</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
