import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

/* Amenities Definitions (Same as AddRoomScreen) */
const AMENITIES = [
  { id: "wifi", label: "Wifi", icon: "wifi" },
  { id: "ac", label: "Điều hòa", icon: "wind" },
  { id: "heater", label: "Nóng lạnh", icon: "burn" },
  { id: "bed", label: "Giường", icon: "bed" },
  { id: "wardrobe", label: "Tủ đồ", icon: "archive" },
  { id: "fridge", label: "Tủ lạnh", icon: "snowflake" },
  { id: "parking", label: "Để xe", icon: "parking" },
  { id: "kitchen", label: "Bếp", icon: "utensils" },
  { id: "washing", label: "Máy giặt", icon: "tshirt" },
];

export default function EditRoomScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      price: "",
      depositPrice: "",
      area: "",
      floor: "",
      maxTenants: "2",
      gender: "ALL", // ALL, MALE, FEMALE
      assets: [] as string[],
    },
  });

  const selectedAssets = watch("assets");
  const selectedGender = watch("gender");

  // Fetch Room Details
  const { data: room, isLoading } = useQuery({
    queryKey: ["room", id],
    queryFn: async () => {
      const res = await api.get(`/rooms/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Pre-fill form when data is loaded
  useEffect(() => {
    if (room) {
      reset({
        name: room.name,
        price: room.price?.toString() || "",
        depositPrice: room.depositPrice?.toString() || "",
        area: room.area?.toString() || "",
        floor: room.floor?.toString() || "",
        maxTenants: room.maxTenants?.toString() || "2",
        gender: room.gender || "ALL",
        assets: room.assets || [],
      });
    }
  }, [room, reset]);

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

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.patch(`/rooms/${id}`, {
        ...data,
        price: parseFloat(data.price),
        depositPrice: data.depositPrice ? parseFloat(data.depositPrice) : 0,
        area: parseFloat(data.area),
        floor: parseInt(data.floor),
        maxTenants: parseInt(data.maxTenants),
        // assets is already array of strings
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["room", id] });
      Alert.alert("Thành công", "Đã cập nhật thông tin phòng", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      console.error(error);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể cập nhật phòng",
      );
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F9FAFB]">
        <ActivityIndicator size="large" color="#DA7756" />
      </View>
    );
  }

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
          Chỉnh sửa phòng
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 150 }}>
        <View className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 space-y-4">
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
          className="bg-[#DA7756] p-4 rounded-xl mt-6 items-center"
          style={{
            elevation: 4,
            shadowColor: "#DA7756",
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
          onPress={handleSubmit(onSubmit)}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Lưu thay đổi</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
