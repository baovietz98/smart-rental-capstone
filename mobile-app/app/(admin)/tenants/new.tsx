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

export default function AddTenantScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
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
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Construct paylaod matching backend DTO
      const payload = {
        fullName: data.fullName,
        phone: data.phone,
        cccd: data.cccd,
        info: {
          email: data.email,
          job: data.job,
          hometown: data.hometown,
        },
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

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 space-y-4">
          {/* Full Name */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Họ và tên
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
              Số điện thoại
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
        </View>

        <TouchableOpacity
          className="bg-[#DA7756] p-4 rounded-xl mt-6 items-center shadow-lg shadow-orange-200"
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
