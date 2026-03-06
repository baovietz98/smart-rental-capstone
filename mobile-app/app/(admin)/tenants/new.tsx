import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

export default function AddTenantScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: "",
      phone: "",
      cccd: "",
      email: "",
      job: "",
      hometown: "",
      vehicles: [] as { plateNumber: string; type: string }[],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "vehicles",
  });

  const pickImage = async (type: "front" | "back") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === "front") setFrontImage(result.assets[0].uri);
      else setBackImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    const formData = new FormData();
    formData.append("file", {
      uri,
      name: "image.jpg",
      type: "image/jpeg",
    } as any);

    const res = await api.post("/upload/image/tenants", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data.url;
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      let cccdFrontUrl = "";
      let cccdBackUrl = "";

      // Upload images first if exist
      if (frontImage) {
        cccdFrontUrl = await uploadImage(frontImage);
      }
      if (backImage) {
        cccdBackUrl = await uploadImage(backImage);
      }

      // Construct paylaod matching backend DTO
      const payload = {
        fullName: data.fullName,
        phone: data.phone,
        cccd: data.cccd,
        info: {
          email: data.email,
          job: data.job,
          hometown: data.hometown,
          cccdFront: cccdFrontUrl,
          cccdBack: cccdBackUrl,
        },
        vehicles: data.vehicles,
      };
      await api.post("/tenants", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      Alert.alert("Thành công", "Đã thêm cư dân mới", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      console.error(error);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể thêm cư dân",
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
          Thêm cư dân mới
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 150 }}>
        <View className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 space-y-4">
          {/* CCCD Images */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Ảnh CCCD/CMND
            </Text>
            <View className="flex-row gap-4 h-28">
              <TouchableOpacity
                className="flex-1 border border-dashed border-gray-300 rounded-xl items-center justify-center overflow-hidden bg-gray-50"
                onPress={() => pickImage("front")}
              >
                {frontImage ? (
                  <Image
                    source={{ uri: frontImage }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="items-center">
                    <FontAwesome5 name="camera" size={20} color="#9CA3AF" />
                    <Text className="text-[10px] font-bold text-gray-400 mt-1 uppercase">
                      Mặt trước
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 border border-dashed border-gray-300 rounded-xl items-center justify-center overflow-hidden bg-gray-50"
                onPress={() => pickImage("back")}
              >
                {backImage ? (
                  <Image
                    source={{ uri: backImage }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="items-center">
                    <FontAwesome5 name="camera" size={20} color="#9CA3AF" />
                    <Text className="text-[10px] font-bold text-gray-400 mt-1 uppercase">
                      Mặt sau
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Full Name */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Họ và tên <Text className="text-red-500">*</Text>
            </Text>
            <Controller
              control={control}
              name="fullName"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                  placeholder="Nguyễn Văn A"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.fullName && (
              <Text className="text-red-500 text-xs mt-1">
                Vui lòng nhập họ tên
              </Text>
            )}
          </View>

          {/* Phone */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Số điện thoại <Text className="text-red-500">*</Text>
            </Text>
            <Controller
              control={control}
              name="phone"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                  placeholder="0912345678"
                  keyboardType="phone-pad"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.phone && (
              <Text className="text-red-500 text-xs mt-1">
                Vui lòng nhập SĐT
              </Text>
            )}
          </View>

          {/* CCCD */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              CCCD/CMND
            </Text>
            <Controller
              control={control}
              name="cccd"
              rules={{ required: false }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                  placeholder="12 số"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
          </View>

          {/* Email */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Email
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                  placeholder="email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
          </View>

          {/* Addtl Info */}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
                Nghề nghiệp
              </Text>
              <Controller
                control={control}
                name="job"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                    placeholder="Tự do"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
                Quê quán
              </Text>
              <Controller
                control={control}
                name="hometown"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                    placeholder="Hà Nội"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
          </View>

          {/* Vehicles Section */}
          <View className="pt-4 border-t border-gray-100 mt-2">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xs font-bold text-gray-500 uppercase">
                Thông tin xe
              </Text>
              <TouchableOpacity
                onPress={() => append({ plateNumber: "", type: "" })}
                className="flex-row items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full"
              >
                <FontAwesome5 name="plus" size={10} color="#DA7756" />
                <Text className="text-[#DA7756] text-xs font-bold">
                  Thêm xe
                </Text>
              </TouchableOpacity>
            </View>

            {fields.map((field, index) => (
              <View key={field.id} className="flex-row items-end gap-3 mb-3">
                <View className="flex-[2]">
                  <Text className="text-[10px] font-bold text-gray-400 mb-1 uppercase">
                    Biển số
                  </Text>
                  <Controller
                    control={control}
                    name={`vehicles.${index}.plateNumber`}
                    rules={{ required: true }}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-900"
                        placeholder="29A1-12345"
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-bold text-gray-400 mb-1 uppercase">
                    Loại xe
                  </Text>
                  <Controller
                    control={control}
                    name={`vehicles.${index}.type`}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-900"
                        placeholder="Xe máy"
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => remove(index)}
                  className="w-9 h-9 bg-red-50 rounded-xl items-center justify-center mb-[1px]"
                >
                  <FontAwesome5 name="trash-alt" size={12} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            {fields.length === 0 && (
              <Text className="text-gray-400 text-xs italic text-center py-2">
                Chưa có thông tin xe
              </Text>
            )}
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
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Lưu hồ sơ</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
