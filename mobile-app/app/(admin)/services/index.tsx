import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const SERVICE_TYPES = [
  {
    key: "METERED",
    label: "Theo chỉ số",
    icon: "speedometer",
    color: "#F59E0B",
  },
  { key: "FIXED", label: "Cố định", icon: "pricetag", color: "#3B82F6" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);

export default function ServicesList() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [type, setType] = useState<"METERED" | "FIXED">("FIXED");

  const {
    data: services = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await api.get("/services");
      return res.data;
    },
  });

  const openCreateForm = () => {
    setEditingService(null);
    setName("");
    setPrice("");
    setUnit("");
    setType("FIXED");
    setShowForm(true);
  };

  const openEditForm = (service: any) => {
    setEditingService(service);
    setName(service.name);
    setPrice(service.price?.toString() || "");
    setUnit(service.unit || "");
    setType(service.type || "FIXED");
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        price: Number(price),
        unit,
        type,
      };
      if (editingService) {
        return api.patch(`/services/${editingService.id}`, payload);
      }
      return api.post("/services", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setShowForm(false);
      Alert.alert(
        "Thành công",
        editingService ? "Đã cập nhật dịch vụ" : "Đã tạo dịch vụ mới",
      );
    },
    onError: (err: any) => {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không thể lưu dịch vụ",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      Alert.alert("Thành công", "Đã xóa dịch vụ");
    },
    onError: (err: any) => {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không thể xóa dịch vụ",
      );
    },
  });

  const handleDelete = (service: any) => {
    Alert.alert(
      "⚠️ Vô hiệu hóa dịch vụ",
      `Bạn có muốn vô hiệu hóa dịch vụ "${service.name}"?\n\n` +
        "Lưu ý:\n" +
        "• Dịch vụ sẽ bị ẩn khỏi danh sách (không xóa vĩnh viễn)\n" +
        "• Hóa đơn cũ có dịch vụ này sẽ KHÔNG bị ảnh hưởng\n" +
        "• Các hóa đơn mới sẽ không thể chọn dịch vụ này",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Vô hiệu hóa",
          style: "destructive",
          onPress: () => deleteMutation.mutate(service.id),
        },
      ],
    );
  };

  const getServiceIcon = (service: any) => {
    const n = service.name?.toLowerCase() || "";
    if (n.includes("điện") || n.includes("electric"))
      return { icon: "flash", color: "#F59E0B", bg: "#FEF3C7" };
    if (n.includes("nước") || n.includes("water"))
      return { icon: "water", color: "#3B82F6", bg: "#DBEAFE" };
    if (n.includes("wifi") || n.includes("internet"))
      return { icon: "wifi", color: "#0D9488", bg: "#CCFBF1" };
    if (n.includes("rác") || n.includes("vệ sinh"))
      return { icon: "leaf", color: "#22C55E", bg: "#DCFCE7" };
    if (n.includes("gửi xe") || n.includes("parking"))
      return { icon: "car", color: "#EF4444", bg: "#FEE2E2" };
    return { icon: "settings", color: "#6B7280", bg: "#F3F4F6" };
  };

  const renderItem = ({ item }: { item: any }) => {
    const si = getServiceIcon(item);
    return (
      <TouchableOpacity
        className="bg-white mx-5 mb-3 p-4 rounded-2xl border border-gray-100 flex-row items-center gap-4"
        onPress={() => openEditForm(item)}
        onLongPress={() => handleDelete(item)}
      >
        <View
          className="w-11 h-11 rounded-xl items-center justify-center"
          style={{ backgroundColor: si.bg }}
        >
          <Ionicons name={si.icon as any} size={20} color={si.color} />
        </View>
        <View className="flex-1">
          <Text className="font-bold text-gray-900">{item.name}</Text>
          <View className="flex-row items-center gap-2 mt-0.5">
            <View
              className={`px-1.5 py-0.5 rounded ${
                item.type === "METERED" ? "bg-amber-50" : "bg-blue-50"
              }`}
            >
              <Text
                className={`text-[10px] font-bold ${
                  item.type === "METERED" ? "text-amber-600" : "text-blue-600"
                }`}
              >
                {item.type === "METERED" ? "Theo chỉ số" : "Cố định"}
              </Text>
            </View>
            {item.unit && (
              <Text className="text-xs text-gray-400">{item.unit}</Text>
            )}
          </View>
        </View>
        <View className="items-end">
          <Text className="font-bold text-[#DA7756]">
            {formatCurrency(item.price)} đ
          </Text>
          <Text className="text-[10px] text-gray-400">
            {item.type === "METERED" ? "/số" : "/tháng"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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
        <View className="items-center">
          <Text className="text-xl font-bold text-gray-900 font-serif">
            Dịch vụ
          </Text>
          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Services Management
          </Text>
        </View>
        <TouchableOpacity
          className="w-10 h-10 bg-[#DA7756] rounded-full items-center justify-center"
          onPress={openCreateForm}
        >
          <Ionicons name="add" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#DA7756" />
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 16, paddingBottom: 150 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListHeaderComponent={
            <View className="px-5 mb-3">
              <View className="bg-cyan-50 rounded-xl p-4 border border-cyan-100 flex-row items-center gap-3">
                <Ionicons name="information-circle" size={20} color="#0891B2" />
                <Text className="text-xs text-cyan-700 flex-1">
                  Nhấn giữ để vô hiệu hóa dịch vụ. Nhấn để chỉnh sửa.
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Ionicons name="settings-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-400 font-medium mt-4">
                Chưa có dịch vụ nào
              </Text>
              <TouchableOpacity
                className="mt-4 bg-[#DA7756] px-6 py-2.5 rounded-xl"
                onPress={openCreateForm}
              >
                <Text className="text-white font-bold">
                  Tạo dịch vụ đầu tiên
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ══════ Create/Edit Modal ══════ */}
      <Modal visible={showForm} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View
            className="bg-white rounded-t-3xl p-6"
            style={{ paddingBottom: Platform.OS === "ios" ? 40 : 24 }}
          >
            <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-6" />
            <Text className="text-xl font-bold text-gray-900 font-serif mb-1">
              {editingService ? "Chỉnh sửa dịch vụ" : "Tạo dịch vụ mới"}
            </Text>
            <Text className="text-sm text-gray-500 mb-6">
              {editingService
                ? "Cập nhật thông tin dịch vụ"
                : "Thêm dịch vụ mới cho hệ thống"}
            </Text>

            {/* Name */}
            <Text className="text-xs font-bold text-gray-500 uppercase mb-1">
              Tên dịch vụ <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 mb-4"
              placeholder="VD: Điện, Nước, Wifi..."
              value={name}
              onChangeText={setName}
            />

            {/* Type */}
            <Text className="text-xs font-bold text-gray-500 uppercase mb-1">
              Loại dịch vụ
            </Text>
            <View className="bg-gray-100 p-1.5 rounded-xl flex-row gap-2 mb-4">
              {SERVICE_TYPES.map((st) => (
                <TouchableOpacity
                  key={st.key}
                  onPress={() => setType(st.key as any)}
                  className={`flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2 ${
                    type === st.key ? "bg-white" : ""
                  }`}
                  style={
                    type === st.key
                      ? {
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }
                      : undefined
                  }
                >
                  <Ionicons
                    name={st.icon as any}
                    size={14}
                    color={type === st.key ? st.color : "#9CA3AF"}
                  />
                  <Text
                    className={`text-xs font-bold ${
                      type === st.key ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {st.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Price & Unit */}
            <View className="flex-row gap-3 mb-6">
              <View className="flex-1">
                <Text className="text-xs font-bold text-gray-500 uppercase mb-1">
                  Đơn giá <Text className="text-red-500">*</Text>
                </Text>
                <View className="bg-gray-50 border border-gray-200 rounded-xl flex-row items-center px-4">
                  <Text className="text-gray-400 mr-1">₫</Text>
                  <TextInput
                    className="flex-1 py-3 font-bold text-gray-900"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0"
                  />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-gray-500 uppercase mb-1">
                  Đơn vị
                </Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900"
                  placeholder="VD: kWh, m³..."
                  value={unit}
                  onChangeText={setUnit}
                />
              </View>
            </View>

            {/* Actions */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl border border-gray-200 items-center"
                onPress={() => setShowForm(false)}
              >
                <Text className="font-bold text-gray-500">Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3.5 bg-[#DA7756] rounded-xl items-center shadow-lg"
                onPress={() => saveMutation.mutate()}
                disabled={!name || !price || saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="font-bold text-white">
                    {editingService ? "Cập nhật" : "Tạo mới"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
