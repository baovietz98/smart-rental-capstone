import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function TenantDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant", id],
    queryFn: async () => {
      // Assuming a get-one endpoint or filtering from list if not present
      // To be safe, usually endpoints support /tenants/:id
      // If not, we might need a workaround, but verified plan assumed /tenants endpoint returns list.
      // Let's assume /tenants/search or similar logic, but for simpler detail we might need to rely on the general list or a specific endpoint.
      // Based on Web Admin analysis, `handleViewDetail` uses client-side data from the list.
      // Ideally mobile should modify backend to support GET /tenants/:id if not exists.
      // But let's try GET /tenants first and find locally if needed, OR try GET /tenants/:id.
      // Let's try GET /tenants/:id as it's standard REST.
      try {
        const res = await api.get(`/tenants/${id}`); // Assuming this exists or works
        return res.data;
      } catch (e) {
        // Fallback: fetch all and find
        const res = await api.get("/tenants");
        return res.data.find((t: any) => t.id === Number(id));
      }
    },
    enabled: !!id,
  });

  const handleCall = () => {
    if (tenant?.phone) {
      Linking.openURL(`tel:${tenant.phone}`);
    }
  };

  if (isLoading || !tenant) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F9FAFB]">
        <ActivityIndicator size="large" color="#DA7756" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      {/* HEADER */}
      <View className="px-6 py-4 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <TouchableOpacity
          className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
          onPress={() => router.back()}
        >
          <FontAwesome5 name="arrow-left" size={16} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 font-serif">
          Hồ sơ cư dân
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* PROFILE CARD */}
        <View className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6 items-center">
          <View className="w-24 h-24 bg-[#F5F5F0] rounded-full items-center justify-center border-4 border-white shadow-sm mb-4">
            <Text className="text-4xl font-black text-[#DA7756] font-serif">
              {tenant.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-2xl font-black text-[#383838] font-serif text-center mb-1">
            {tenant.fullName}
          </Text>
          {tenant.contracts?.[0] ? (
            <View className="bg-green-100 px-3 py-1 rounded-full border border-green-200">
              <Text className="text-green-700 font-bold text-xs">
                {tenant.contracts[0].room?.name} -{" "}
                {tenant.contracts[0].room?.building?.name}
              </Text>
            </View>
          ) : (
            <View className="bg-gray-100 px-3 py-1 rounded-full">
              <Text className="text-gray-500 font-bold text-xs">
                Chưa có hợp đồng
              </Text>
            </View>
          )}

          <View className="flex-row gap-4 mt-6 w-full">
            <TouchableOpacity
              className="flex-1 bg-[#DA7756] p-3 rounded-xl items-center flex-row justify-center gap-2 shadow-lg shadow-orange-200"
              onPress={handleCall}
            >
              <FontAwesome5 name="phone-alt" size={14} color="white" />
              <Text className="text-white font-bold">Gọi điện</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-white border border-gray-200 p-3 rounded-xl items-center flex-row justify-center gap-2">
              <FontAwesome5 name="comment-alt" size={14} color="#374151" />
              <Text className="text-gray-700 font-bold">Nhắn tin</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* INFO */}
        <View className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-100 mb-6">
          <View className="p-4 bg-gray-50 border-b border-gray-100">
            <Text className="font-bold text-gray-900 uppercase text-xs tracking-wider">
              Thông tin cá nhân
            </Text>
          </View>
          <View className="p-4 space-y-4">
            <View className="flex-row justify-between border-b border-gray-50 pb-3">
              <Text className="text-gray-500 font-medium">Số điện thoại</Text>
              <Text className="text-gray-900 font-bold">{tenant.phone}</Text>
            </View>
            <View className="flex-row justify-between border-b border-gray-50 pb-3">
              <Text className="text-gray-500 font-medium">CCCD/CMND</Text>
              <Text className="text-gray-900 font-bold">
                {tenant.cccd || "---"}
              </Text>
            </View>
            <View className="flex-row justify-between border-b border-gray-50 pb-3">
              <Text className="text-gray-500 font-medium">Ngày sinh</Text>
              <Text className="text-gray-900 font-bold">
                {tenant.info?.dob || "---"}
              </Text>
            </View>
            <View className="flex-row justify-between pb-1">
              <Text className="text-gray-500 font-medium">Email</Text>
              <Text className="text-gray-900 font-bold">
                {tenant.user?.email || tenant.info?.email || "---"}
              </Text>
            </View>
          </View>
        </View>

        {/* DOCUMENTS */}
        <View className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-100">
          <View className="p-4 bg-gray-50 border-b border-gray-100">
            <Text className="font-bold text-gray-900 uppercase text-xs tracking-wider">
              Giấy tờ tùy thân
            </Text>
          </View>
          <View className="p-4 flex-row gap-4">
            <View className="flex-1 h-32 bg-gray-50 rounded-xl border border-dashed border-gray-300 items-center justify-center overflow-hidden">
              {tenant.info?.cccdFront ? (
                <Image
                  source={{ uri: tenant.info.cccdFront }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-gray-400 text-xs text-center px-2">
                  Mặt trước
                </Text>
              )}
            </View>
            <View className="flex-1 h-32 bg-gray-50 rounded-xl border border-dashed border-gray-300 items-center justify-center overflow-hidden">
              {tenant.info?.cccdBack ? (
                <Image
                  source={{ uri: tenant.info.cccdBack }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-gray-400 text-xs text-center px-2">
                  Mặt sau
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
