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
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

/* Amenities Definitions */
const AMENITIES = [
  { id: "wifi", label: "Wifi", icon: "wifi" },
  { id: "ac", label: "Điều hòa", icon: "wind" },
  { id: "heater", label: "Nóng lạnh", icon: "burn" },
  { id: "bed", label: "Giường", icon: "bed" },
  { id: "wardrobe", label: "Tủ đồ", icon: "archive" }, // using archive as placeholder for wardrobe
  { id: "fridge", label: "Tủ lạnh", icon: "snowflake" }, // using snowflake for fridge related
  { id: "parking", label: "Để xe", icon: "parking" },
  { id: "kitchen", label: "Bếp", icon: "utensils" },
  { id: "washing", label: "Máy giặt", icon: "tshirt" },
];

export default function AddRoomScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      price: "",
      depositPrice: "",
      area: "",
      floor: "",
      maxTenants: "2",
      buildingId: "",
      gender: "ALL", // ALL, MALE, FEMALE
      assets: [] as string[],
    },
  });

  const selectedAssets = watch("assets");
  const selectedGender = watch("gender");

  const { data: buildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: async () => {
      const res = await api.get("/buildings");
      return res.data;
    },
  });

  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);

  const toggleAsset = (assetId: string) => {
    const current = selectedAssets || [];
    if (current.includes(assetId)) {
      setValue(
        "assets",
        current.filter((id) => id !== assetId),
      );
    } else {
      setValue("assets", [...current, assetId]);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post("/rooms", {
        ...data,
        price: parseFloat(data.price),
        depositPrice: data.depositPrice ? parseFloat(data.depositPrice) : 0,
        area: parseFloat(data.area),
        floor: parseInt(data.floor),
        maxTenants: parseInt(data.maxTenants),
        buildingId: selectedBuilding,
        // assets is already array of strings
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

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <View className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 space-y-4">
          {/* Building Selection */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Tòa nhà <Text className="text-red-500">*</Text>
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
              Tên phòng <Text className="text-red-500">*</Text>
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

          {/* Price & Deposit */}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
                Giá thuê <Text className="text-red-500">*</Text>
              </Text>
              <Controller
                control={control}
                name="price"
                rules={{ required: true, pattern: /^\d+$/ }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                    placeholder="3.500.000"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
                Tiền cọc
              </Text>
              <Controller
                control={control}
                name="depositPrice"
                rules={{ pattern: /^\d+$/ }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                    placeholder="3.500.000"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
          </View>

          {/* Area & Floor */}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
                Diện tích (m²) <Text className="text-red-500">*</Text>
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
                Tầng <Text className="text-red-500">*</Text>
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

          {/* Max Tenants & Gender */}
          <View className="flex-row gap-4">
            <View className="flex-1">
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
            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
                Giới tính
              </Text>
              <TouchableOpacity
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row justify-between items-center"
                onPress={() => {
                  const next =
                    selectedGender === "ALL"
                      ? "MALE"
                      : selectedGender === "MALE"
                        ? "FEMALE"
                        : "ALL";
                  setValue("gender", next);
                }}
              >
                <Text className="font-medium text-gray-900">
                  {selectedGender === "ALL"
                    ? "Tất cả"
                    : selectedGender === "MALE"
                      ? "Nam"
                      : "Nữ"}
                </Text>
                <FontAwesome5 name="exchange-alt" size={12} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Amenities (Assets) */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Tiện ích phòng
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {AMENITIES.map((item) => {
                const isSelected = selectedAssets?.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleAsset(item.id)}
                    className={`px-3 py-2 rounded-lg border flex-row items-center gap-2 ${
                      isSelected
                        ? "bg-[#DA7756]/10 border-[#DA7756]"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <FontAwesome5
                      name={item.icon as any}
                      size={12}
                      color={isSelected ? "#DA7756" : "#6B7280"}
                    />
                    <Text
                      className={`text-xs font-medium ${
                        isSelected ? "text-[#DA7756]" : "text-gray-600"
                      }`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
