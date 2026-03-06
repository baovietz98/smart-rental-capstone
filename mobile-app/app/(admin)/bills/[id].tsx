import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SafeAreaView } from "react-native-safe-area-context";

const ServiceIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "ELECTRIC":
      return (
        <MaterialCommunityIcons
          name="lightning-bolt"
          size={16}
          color="#F59E0B"
        />
      );
    case "WATER":
      return <MaterialCommunityIcons name="water" size={16} color="#3B82F6" />;
    case "INTERNET":
      return <MaterialCommunityIcons name="wifi" size={16} color="#10B981" />;
    case "TRASH":
      return <MaterialCommunityIcons name="delete" size={16} color="#6B7280" />;
    case "VEHICLE":
      return (
        <MaterialCommunityIcons name="motorbike" size={16} color="#6B7280" />
      );
    case "FIXED":
      return (
        <MaterialCommunityIcons
          name="star-four-points"
          size={16}
          color="#0D9488"
        />
      );
    default:
      return (
        <MaterialCommunityIcons
          name="circle-medium"
          size={16}
          color="#9CA3AF"
        />
      );
  }
};

export default function BillDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("Thanh toán tiền mặt");

  const { data: bill, isLoading } = useQuery({
    queryKey: ["bill", id],
    queryFn: async () => {
      const res = await api.get(`/invoices/${id}`);
      return res.data;
    },
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      // Remove dots/commas from formatted string to get number
      const cleanAmount = parseInt(
        paymentAmount.replace(/\./g, "").replace(/,/g, ""),
      );

      if (!cleanAmount || cleanAmount <= 0)
        throw new Error("Số tiền không hợp lệ");
      if (cleanAmount > bill?.debtAmount)
        throw new Error("Số tiền thu không được lớn hơn số nợ");

      return api.post(`/invoices/${id}/payment`, {
        amount: cleanAmount,
        method: "CASH",
        note: paymentNote,
      });
    },
    onSuccess: () => {
      Alert.alert("Thành công", "Đã ghi nhận thanh toán hóa đơn.");
      setModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ["bill", id] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (err: any) => {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || err.message || "Không thể thanh toán",
      );
    },
  });

  // --- ACTIONS MUTATIONS ---
  const publishMutation = useMutation({
    mutationFn: () => api.patch(`/invoices/${id}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill", id] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      Alert.alert("Thành công", "Đã phát hành hóa đơn");
    },
    onError: (err: any) =>
      Alert.alert("Lỗi", err.message || "Không thể phát hành"),
  });

  const unpublishMutation = useMutation({
    mutationFn: () => api.patch(`/invoices/${id}/unpublish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill", id] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      Alert.alert("Thành công", "Đã hủy phát hành hóa đơn");
    },
    onError: (err: any) =>
      Alert.alert("Lỗi", err.message || "Không thể hủy phát hành"),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.patch(`/invoices/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill", id] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      Alert.alert("Thành công", "Đã hủy hóa đơn");
    },
    onError: (err: any) => Alert.alert("Lỗi", err.message || "Không thể hủy"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      Alert.alert("Thành công", "Đã xóa hóa đơn", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => Alert.alert("Lỗi", err.message || "Không thể xóa"),
  });

  const showOptions = () => {
    if (!bill) return;

    const options = [{ text: "Đóng", style: "cancel", onPress: () => {} }];

    if (bill.status === "DRAFT") {
      options.push({
        text: "✅ Phát hành",
        style: "default",
        onPress: () => publishMutation.mutate(),
      });
      options.push({
        text: "🗑️ Xóa hóa đơn",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Xác nhận xóa",
            "Bạn có chắc chắn muốn xóa hóa đơn này không?",
            [
              { text: "Hủy", style: "cancel" },
              {
                text: "Xóa",
                style: "destructive",
                onPress: () => deleteMutation.mutate(),
              },
            ],
          );
        },
      });
    } else if (bill.status === "PUBLISHED" || bill.status === "OVERDUE") {
      options.push({
        text: "Gửi lại Zalo/Link",
        style: "default",
        onPress: handleShare,
      });
      options.push({
        text: "Thu hồi (Về nháp)",
        style: "default",
        onPress: () => unpublishMutation.mutate(),
      });
      options.push({
        text: "Hủy hóa đơn",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Xác nhận hủy",
            "Hóa đơn sẽ chuyển sang trạng thái CANCELLED?",
            [
              { text: "Không", style: "cancel" },
              {
                text: "Đồng ý",
                style: "destructive",
                onPress: () => cancelMutation.mutate(),
              },
            ],
          );
        },
      });
    }

    // @ts-ignore
    Alert.alert("Tùy chọn", "Chọn thao tác với hóa đơn này", options);
  };

  const handleShare = async () => {
    if (!bill) return;

    if (!bill.accessCode) {
      Alert.alert(
        "Lỗi",
        "Hóa đơn này chưa có mã truy cập công khai. Vui lòng phát hành hóa đơn trước.",
      );
      return;
    }

    // CONFIG: Thay đổi domain này thành địa chỉ Web Admin thực tế của bạn
    // Nếu chạy local: http://192.168.1.x:3000
    // Nếu đã deploy: https://your-project.vercel.app
    const WEB_APP_URL = "https://quan-ly-nha-tro.vercel.app";

    // 1. Generate Link & Content
    const publicLink = `${WEB_APP_URL}/bill/${bill.accessCode}`;

    // 2. Prepare Message (Shortened for Zalo to avoid truncation)
    const messageContent = `Hóa đơn P.${bill.contract?.room?.name} T${bill.month}\nTC: ${formatCurrency(bill.debtAmount)}\nLink: ${publicLink}`;

    // 3. Show Action Sheet
    Alert.alert("Gửi hóa đơn", "Chọn phương thức gửi cho khách:", [
      { text: "Đóng", style: "cancel" },
      {
        text: "Gửi qua Zalo",
        onPress: () => {
          const zaloUrl = `https://zalo.me/share?text=${encodeURIComponent(messageContent)}`;
          Linking.openURL(zaloUrl).catch(() => {
            // Fallback
            Alert.alert("Lỗi", "Không mở được Zalo");
          });
        },
      },
      {
        text: "Copy Link",
        onPress: async () => {
          await Clipboard.setStringAsync(publicLink);
          Alert.alert(
            "Đã sao chép",
            "Link hóa đơn đã được lưu vào bộ nhớ tạm.",
          );
        },
      },
    ]);
  };

  const handleAmountChange = (text: string) => {
    // Remove verify characters
    const numeric = text.replace(/[^0-9]/g, "");
    if (numeric) {
      const formatted = new Intl.NumberFormat("vi-VN").format(
        parseInt(numeric),
      );
      setPaymentAmount(formatted);
    } else {
      setPaymentAmount("");
    }
  };

  const openPaymentModal = () => {
    if (bill) {
      setPaymentAmount(new Intl.NumberFormat("vi-VN").format(bill.debtAmount));
      setModalVisible(true);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount || 0) + " đ";
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F2F2F7]">
        <ActivityIndicator color="#DA7756" />
      </View>
    );
  }

  if (!bill) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F2F2F7] p-6">
        <Text className="text-gray-400 font-bold">
          Không tìm thấy thông tin hóa đơn
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F2F2F7]">
      {/* Header */}
      <SafeAreaView
        edges={["top"]}
        className="bg-white z-10 shadow-sm border-b border-gray-100"
      >
        <View className="px-5 py-3 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center active:bg-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900 font-serif">
            Hóa đơn tháng {bill.month}
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleShare}
              className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center active:bg-blue-100"
            >
              <Ionicons name="share-outline" size={20} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={showOptions}
              className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center active:bg-gray-100"
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        {/* RECEIPT CARD */}
        <View className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-100 mb-6">
          {/* Top Section: Room & Date */}
          <View className="bg-[#DA7756] p-6 items-center">
            <View className="bg-white/20 px-4 py-1 rounded-full mb-2">
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                {bill.contract?.room?.building?.name || "Tòa nhà"}
              </Text>
            </View>
            <Text className="text-white text-3xl font-serif font-black mb-1">
              P. {bill.contract?.room?.name}
            </Text>
            <Text className="text-white/80 text-sm font-medium">
              Hạn thanh toán:{" "}
              {bill.dueDate
                ? new Date(bill.dueDate).toLocaleDateString("vi-VN")
                : "---"}
            </Text>
          </View>

          {/* Ticket Edge Effect (Optional Visual Trick) */}
          <View className="h-4 bg-white -mt-2 rounded-t-[20px]" />

          <View className="px-6 py-2">
            {/* RENT ROW */}
            <View className="flex-row items-center justify-between py-3 border-b border-gray-50 border-dashed">
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 bg-gray-50 rounded-full items-center justify-center">
                  <MaterialCommunityIcons
                    name="home-city"
                    size={16}
                    color="#4B5563"
                  />
                </View>
                <Text className="text-gray-700 font-medium">Tiền phòng</Text>
              </View>
              <Text className="text-gray-900 font-bold font-serif">
                {formatCurrency(bill.roomCharge)}
              </Text>
            </View>

            {/* DYNAMIC LINE ITEMS */}
            {bill.lineItems?.map((item: any, index: number) => {
              if (item.type === "RENT") return null;

              let label = item.name;
              let subLabel = "";

              if (item.type === "ELECTRIC") {
                subLabel = `${item.quantity} kWh × ${formatCurrency(item.unitPrice)}`;
              } else if (item.type === "WATER") {
                subLabel = `${item.quantity} m³ × ${formatCurrency(item.unitPrice)}`;
              }

              return (
                <View
                  key={index}
                  className="flex-row justify-between py-3 border-b border-gray-50 border-dashed"
                >
                  <View className="flex-row gap-3">
                    <View className="w-8 h-8 bg-gray-50 rounded-full items-center justify-center">
                      <ServiceIcon type={item.type} />
                    </View>
                    <View>
                      <Text className="text-gray-700 font-medium">{label}</Text>
                      {!!subLabel && (
                        <Text className="text-gray-400 text-[10px] mt-0.5">
                          {subLabel}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text className="text-gray-900 font-bold font-serif">
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              );
            })}

            {/* PREVIOUS DEBT */}
            {bill.previousDebt > 0 && (
              <View className="flex-row justify-between py-3 border-b border-gray-50 border-dashed bg-red-50/50 -mx-6 px-6">
                <View className="flex-row items-center gap-3">
                  <MaterialCommunityIcons
                    name="history"
                    size={16}
                    color="#DC2626"
                  />
                  <Text className="text-red-700 font-medium">Nợ cũ</Text>
                </View>
                <Text className="text-red-700 font-bold font-serif">
                  {formatCurrency(bill.previousDebt)}
                </Text>
              </View>
            )}

            {/* TOTAL SECTION */}
            <View className="mt-4 pt-2 mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500 font-medium">Tổng cộng</Text>
                <Text className="text-gray-900 font-bold text-lg font-serif">
                  {formatCurrency(bill.totalAmount)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-gray-500 font-medium">Đã thanh toán</Text>
                <Text className="text-green-600 font-bold">
                  {formatCurrency(bill.paidAmount)}
                </Text>
              </View>

              <View className="h-[1px] bg-gray-200 my-3 border-dashed" />

              <View className="flex-row justify-between items-end">
                <Text className="text-gray-900 font-black text-sm uppercase">
                  Cần thanh toán
                </Text>
                <Text className="text-[#DA7756] font-black text-2xl font-serif">
                  {formatCurrency(bill.debtAmount)}
                </Text>
              </View>
            </View>
          </View>

          {/* Status Badge */}
          {(() => {
            const statusMap: Record<
              string,
              { bg: string; text: string; label: string }
            > = {
              PAID: {
                bg: "bg-green-100",
                text: "text-green-700",
                label: "ĐÃ THANH TOÁN",
              },
              PARTIAL: {
                bg: "bg-amber-100",
                text: "text-amber-700",
                label: "THANH TOÁN 1 PHẦN",
              },
              OVERDUE: {
                bg: "bg-red-100",
                text: "text-red-700",
                label: "QUÁ HẠN",
              },
              DRAFT: {
                bg: "bg-gray-100",
                text: "text-gray-600",
                label: "BẢN NHÁP",
              },
              PUBLISHED: {
                bg: "bg-orange-100",
                text: "text-orange-700",
                label: "CHƯA THANH TOÁN",
              },
            };
            const s = statusMap[bill.status] ?? statusMap["PUBLISHED"];
            return (
              <View className={`py-3 items-center ${s.bg}`}>
                <Text
                  className={`font-black uppercase tracking-widest text-xs ${s.text}`}
                >
                  {s.label}
                </Text>
              </View>
            );
          })()}
        </View>

        {/* VIETQR SECTION - SEPARATE CARD */}
        {bill.debtAmount > 0 && bill.status !== "PAID" && (
          <View className="mb-6 bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm items-center">
            <Text className="text-gray-500 font-bold uppercase text-xs mb-4">
              Mã QR Chuyển khoản nhanh
            </Text>
            {/* QR Image removed due to emulator network issues */}
            <View className="flex-row items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 border-dashed">
              <MaterialCommunityIcons
                name="bank-outline"
                size={16}
                color="#4B5563"
              />
              <Text className="text-gray-600 text-xs font-medium">
                MB Bank: 9300 131 000 273
              </Text>
            </View>
          </View>
        )}

        {/* PAYMENT HISTORY */}
        {bill.paymentHistory && bill.paymentHistory.length > 0 && (
          <View className="mb-6">
            <Text className="text-gray-500 font-bold uppercase text-xs mb-3 ml-2">
              Lịch sử giao dịch
            </Text>
            <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              {bill.paymentHistory.map((history: any, idx: number) => (
                <View
                  key={idx}
                  className={`flex-row justify-between items-center ${idx < bill.paymentHistory.length - 1 ? "border-b border-gray-50 pb-3 mb-3" : ""}`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 bg-green-50 rounded-full items-center justify-center">
                      <MaterialCommunityIcons
                        name="check"
                        size={14}
                        color="#10B981"
                      />
                    </View>
                    <View>
                      <Text className="text-gray-900 font-bold text-sm">
                        Thanh toán{" "}
                        {history.method === "CASH"
                          ? "Tiền mặt"
                          : history.method}
                      </Text>
                      <Text className="text-gray-400 text-[10px]">
                        {new Date(history.date).toLocaleDateString("vi-VN")}{" "}
                        {new Date(history.date).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-green-600 font-bold text-sm">
                    +{formatCurrency(history.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* FLOAT BOTTOM ACTION */}
      {bill.status !== "PAID" && (
        <View
          className="absolute bottom-[130px] left-5 right-5 z-[999]"
          style={{
            elevation: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4.65,
          }}
        >
          <TouchableOpacity
            className={`flex-row items-center justify-center py-4 rounded-full bg-[#1a1a1a]`}
            onPress={openPaymentModal}
            disabled={payMutation.isPending}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="cash-plus"
              size={20}
              color="white"
              className="mr-2"
            />
            <Text className="text-white font-bold text-base">Thu tiền mặt</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* PAYMENT MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-[32px] p-6 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">
                Xác nhận thu tiền
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="bg-gray-100 p-2 rounded-full"
              >
                <MaterialCommunityIcons name="close" size={20} color="gray" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-gray-500 text-xs font-bold uppercase mb-2">
                Số tiền thu (VNĐ)
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-2xl font-bold text-gray-900 text-center"
                value={paymentAmount}
                onChangeText={handleAmountChange}
                keyboardType="number-pad"
                placeholder="0"
              />
              <Text className="text-center text-gray-400 text-xs mt-2">
                Còn nợ: {formatCurrency(bill?.debtAmount)}
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-gray-500 text-xs font-bold uppercase mb-2">
                Ghi chú
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900"
                value={paymentNote}
                onChangeText={setPaymentNote}
                placeholder="Ví dụ: Người nhà đóng hộ..."
              />
            </View>

            <TouchableOpacity
              className="bg-[#1a1a1a] py-4 rounded-2xl items-center shadow-lg mb-4"
              onPress={() => payMutation.mutate()}
              disabled={payMutation.isPending}
            >
              {payMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Xác nhận</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
