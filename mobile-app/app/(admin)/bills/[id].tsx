import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BillDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: bill, isLoading } = useQuery({
    queryKey: ["bill", id],
    queryFn: async () => {
      const res = await api.get(`/invoices/${id}`);
      return res.data;
    },
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/invoices/${id}/payment`, {
        amount: bill?.debtAmount,
        method: "CASH",
        note: "Thanh toán tại quầy (Mobile)",
      });
    },
    onSuccess: () => {
      Alert.alert("Thành công", "Đã ghi nhận thanh toán hóa đơn.");
      queryClient.invalidateQueries({ queryKey: ["bill", id] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (err: any) => {
      Alert.alert("Lỗi", err.response?.data?.message || "Không thể thanh toán");
    },
  });

  const handleShare = async () => {
    if (!bill) return;
    try {
      const message = `Phòng ${bill.contract?.room?.name} - Hóa đơn tháng ${
        bill.month
      }\nSố tiền: ${bill.totalAmount.toLocaleString()}đ\nHạn chót: ${
        bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : "N/A"
      }\nVui lòng thanh toán sớm. Trân trọng!`;
      await Share.share({ message });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount || 0) + " đ";
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#DA7756" />
      </View>
    );
  }

  if (!bill) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-gray-400 font-bold">
          Không tìm thấy thông tin hóa đơn
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <FontAwesome5 name="arrow-left" size={16} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 font-serif">
          Chi tiết hóa đơn
        </Text>
      </View>

      <ScrollView className="flex-1 p-6">
        <View className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 mb-6 items-center">
          <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">
            Tổng cộng cần thu
          </Text>
          <Text className="text-4xl font-serif text-gray-900 font-bold mb-4">
            {formatCurrency(bill.totalAmount)}
          </Text>

          <View
            className={`px-3 py-1 rounded-full ${
              bill.status === "PAID" ? "bg-green-50" : "bg-orange-50"
            }`}
          >
            <Text
              className={`text-[10px] font-black uppercase ${
                bill.status === "PAID" ? "text-green-600" : "text-orange-600"
              }`}
            >
              {bill.status === "PAID"
                ? "Đã thanh toán"
                : "Còn nợ: " + formatCurrency(bill.debtAmount)}
            </Text>
          </View>
        </View>

        <View className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mb-6">
          <Text className="text-gray-900 font-bold mb-4 border-b border-gray-50 pb-2">
            Thông tin phòng {bill.contract?.room?.name}
          </Text>

          <View className="space-y-4">
            <View className="flex-row justify-between">
              <Text className="text-gray-400 text-xs">Tiền phòng</Text>
              <Text className="text-gray-900 font-bold text-xs">
                {formatCurrency(bill.roomCharge)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-400 text-xs">
                Điện ({bill.electricityUsage} kWh)
              </Text>
              <Text className="text-gray-900 font-bold text-xs">
                {formatCurrency(bill.electricityCharge)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-400 text-xs">
                Nước ({bill.waterUsage} m3)
              </Text>
              <Text className="text-gray-900 font-bold text-xs">
                {formatCurrency(bill.waterCharge)}
              </Text>
            </View>
            {bill.serviceCharge > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-gray-400 text-xs">Phí dịch vụ</Text>
                <Text className="text-gray-900 font-bold text-xs">
                  {formatCurrency(bill.serviceCharge)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          className="bg-blue-600 p-5 rounded-2xl flex-row justify-center items-center shadow-lg mb-4"
          onPress={handleShare}
        >
          <MaterialCommunityIcons
            name="share-variant"
            size={20}
            color="white"
            className="mr-2"
          />
          <Text className="text-white font-black uppercase tracking-widest text-sm ml-2">
            Gửi Zalo / Thông báo
          </Text>
        </TouchableOpacity>

        {bill.status !== "PAID" && (
          <TouchableOpacity
            className="bg-gray-900 p-5 rounded-2xl items-center mb-10 shadow-lg"
            onPress={() => {
              Alert.alert(
                "Xác nhận",
                `Xác nhận khách đã thanh toán ${formatCurrency(
                  bill.debtAmount
                )}?`,
                [
                  { text: "Hủy", style: "cancel" },
                  { text: "Đồng ý", onPress: () => payMutation.mutate() },
                ]
              );
            }}
            disabled={payMutation.isPending}
          >
            <Text className="text-white font-black uppercase tracking-widest text-sm">
              {payMutation.isPending ? "Đang xử lý..." : "Xác nhận đã thu tiền"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
