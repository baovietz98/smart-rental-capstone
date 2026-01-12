import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BillList() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const currentMonthStr = `${String(selectedMonth.getMonth() + 1).padStart(
    2,
    "0"
  )}-${selectedMonth.getFullYear()}`;

  const {
    data: bills,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["bills", currentMonthStr],
    queryFn: async () => {
      const res = await api.get("/invoices", {
        params: { month: currentMonthStr },
      });
      return res.data;
    },
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PAID":
        return {
          label: "Đã thanh toán",
          bg: "bg-green-50",
          text: "text-green-600",
          icon: "check-circle",
        };
      case "OVERDUE":
        return {
          label: "Quá hạn",
          bg: "bg-red-50",
          text: "text-red-600",
          icon: "alert-circle",
        };
      case "DRAFT":
        return {
          label: "Bản nháp",
          bg: "bg-gray-50",
          text: "text-gray-600",
          icon: "file-edit",
        };
      default:
        return {
          label: "Chưa thanh toán",
          bg: "bg-orange-50",
          text: "text-orange-600",
          icon: "clock-outline",
        };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount || 0) + " đ";
  };

  const changeMonth = (delta: number) => {
    const next = new Date(selectedMonth);
    next.setMonth(next.getMonth() + delta);
    setSelectedMonth(next);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold text-gray-900 font-serif">
            Hóa đơn
          </Text>
          <Text className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
            Quản lý phiếu thu
          </Text>
        </View>

        <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-2xl border border-gray-100">
          <TouchableOpacity onPress={() => changeMonth(-1)} className="p-1">
            <FontAwesome5 name="chevron-left" size={10} color="#374151" />
          </TouchableOpacity>
          <Text className="mx-3 text-xs font-bold text-gray-700">
            {currentMonthStr}
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)} className="p-1">
            <FontAwesome5 name="chevron-right" size={10} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#DA7756" />
          </View>
        ) : (
          <FlatList
            data={bills}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 20 }}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                tintColor="#DA7756"
              />
            }
            ListEmptyComponent={
              <View className="items-center py-20">
                <MaterialCommunityIcons
                  name="file-search-outline"
                  size={64}
                  color="#E5E7EB"
                />
                <Text className="text-gray-400 mt-4 font-bold text-sm">
                  Không tìm thấy hóa đơn nào
                </Text>
                <Text className="text-gray-300 text-xs mt-1">
                  Vui lòng chọn tháng khác hoặc tạo mới
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const status = getStatusInfo(item.status);
              return (
                <TouchableOpacity
                  className="bg-white p-5 mb-4 rounded-[24px] shadow-sm border border-gray-100 flex-row justify-between items-center"
                  onPress={() => router.push(`/(admin)/bills/${item.id}`)}
                >
                  <View className="flex-1 mr-4">
                    <View className="flex-row items-center mb-2">
                      <Text className="text-gray-900 font-serif text-lg font-bold mr-3">
                        Phòng {item.contract?.room?.name}
                      </Text>
                      <View
                        className={`${status.bg} px-2 py-0.5 rounded-md flex-row items-center`}
                      >
                        <MaterialCommunityIcons
                          name={status.icon as any}
                          size={10}
                          color={status.text.replace("text-", "")}
                          className="mr-1"
                        />
                        <Text
                          className={`${status.text} text-[10px] font-black uppercase`}
                        >
                          {status.label}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-400 text-xs font-medium">
                      Mã: {item.code || `INV-${item.id}`}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-gray-900 font-bold text-lg">
                      {formatCurrency(item.totalAmount)}
                    </Text>
                    <Text className="text-gray-400 text-[10px] uppercase font-black tracking-tighter mt-1">
                      Chi tiết →
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
