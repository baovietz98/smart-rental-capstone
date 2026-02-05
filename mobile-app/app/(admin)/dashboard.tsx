import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from "react-native";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

export default function Dashboard() {
  const router = useRouter();
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const currentMonth = `${String(selectedDate.getMonth() + 1).padStart(
    2,
    "0",
  )}-${selectedDate.getFullYear()}`;

  // 1. Fetch Buildings
  const {
    data: buildings,
    isLoading: isBuildingsLoading,
    refetch: refetchBuildings,
  } = useQuery({
    queryKey: ["buildings"],
    queryFn: async () => {
      const res = await api.get("/buildings");
      return res.data;
    },
  });

  // 2. Fetch Stats based on buildingId
  const {
    data: stats,
    isLoading: isStatsLoading,
    isRefetching: isStatsRefetching,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["dashboard-stats", selectedBuilding?.id, currentMonth],
    queryFn: async () => {
      const params = selectedBuilding
        ? { buildingId: selectedBuilding.id }
        : {};

      try {
        const [
          invoiceStatsRes,
          contractStatsRes,
          issueStatsRes,
          overdueInvoicesRes,
          unreadReadingsRes,
        ] = await Promise.all([
          // 1. Tài chính tháng hiện tại
          api.get(`/invoices/stats/${currentMonth}`, { params }).catch((e) => {
            console.error("Invoice Stats Error:", e);
            return { data: { totalAmount: 0, totalPaid: 0, totalDebt: 0 } };
          }),
          // 2. Trạng thái phòng/HĐ
          api.get("/contracts/stats", { params }).catch((e) => {
            console.error("Contract Stats Error:", e);
            return {
              data: { active: 0, totalRooms: 0, vacant: 0, expiring: 0 },
            };
          }),
          // 3. Thống kê sự cố
          api.get("/issues/stats", { params }).catch((e) => {
            console.error("Issue Stats Error:", e);
            return { data: { OPEN: 0 } };
          }),
          // 4. Danh sách nợ (hóa đơn đã phát hành nhưng chưa trả hết)
          api
            .get("/invoices", { params: { ...params, status: "PUBLISHED" } })
            .catch((e) => {
              console.error("Overdue Fetch Error:", e);
              return { data: [] };
            }),
          // 5. Phòng chưa chốt điện (serviceId=1)
          api
            .get("/readings/unread", {
              params: { ...params, month: currentMonth, serviceId: 1 },
            })
            .catch((e) => {
              console.error("Unread Reading Error:", e);
              return { data: [] };
            }),
        ]);

        // Tính toán Nợ xấu (Overdue)
        const overdueList = overdueInvoicesRes.data.filter(
          (inv: any) => inv.debtAmount > 0,
        );
        const badDebtTotal = overdueList.reduce(
          (sum: number, inv: any) => sum + inv.debtAmount,
          0,
        );

        // Tổng hợp Registry "Cần xử lý ngay"
        const actions: any[] = [];

        // ⚡ Thêm các phòng chưa chốt số
        unreadReadingsRes.data.slice(0, 2).forEach((room: any) => {
          actions.push({
            id: `reading-${room.id}`,
            type: "READING",
            title: `P.${room.name}: Chưa chốt điện`,
            icon: "lightning-bolt",
            actionText: "Chốt ngay",
            route: `/(admin)/readings/patrol/${room.id}`,
          });
        });

        // 💸 Thêm các phòng nợ tiền
        overdueList.slice(0, 3).forEach((inv: any) => {
          actions.push({
            id: `overdue-${inv.id}`,
            type: "PAYMENT",
            title: `P.${inv.contract?.room?.name}: Quá hạn ${inv.month}`,
            icon: "bank-transfer-out",
            actionText: "Thu tiền",
            route: `/(admin)/bills/${inv.id}`,
          });
        });

        return {
          finance: invoiceStatsRes.data,
          contracts: contractStatsRes.data,
          issues: issueStatsRes.data,
          badDebt: {
            amount: badDebtTotal,
            count: overdueList.length,
          },
          actions: actions.slice(0, 5), // Chỉ lấy tối đa 5 việc quan trọng nhất
        };
      } catch (err) {
        console.error("Dashboard Stats Fetch Panic:", err);
        throw err;
      }
    },
    retry: 1,
    staleTime: 30000,
  });

  const onRefresh = () => {
    refetchBuildings();
    refetchStats();
  };

  const isLoading = isBuildingsLoading || isStatsLoading;
  const isSyncing = isStatsRefetching;
  const finance = stats?.finance;
  const contracts = stats?.contracts;
  const actions = stats?.actions || [];
  const badDebt = stats?.badDebt || { amount: 0, count: 0 };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount || 0) + " đ";
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedDate(newDate);
  };

  const [showFabMenu, setShowFabMenu] = useState(false);

  const fabActions = [
    {
      id: "bill",
      label: "Lập phiếu thu",
      icon: "file-invoice-dollar",
      color: "#383838", // Graphite
      route: "/(admin)/bills/new",
    },
    {
      id: "room",
      label: "Thêm phòng",
      icon: "plus-circle",
      color: "#383838",
      route: "/(admin)/rooms/new",
    },
    {
      id: "issue",
      label: "Báo sự cố",
      icon: "exclamation-circle",
      color: "#C64545", // Warning Red
      route: "/(admin)/issues/new",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      {/* Building Picker Modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View className="bg-white rounded-t-[40px] p-8 pb-12 max-h-[70%]">
            <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-8" />
            <Text className="text-2xl font-bold text-gray-900 mb-6 font-serif">
              Chọn tòa nhà
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                className={`py-5 border-b border-gray-100 flex-row justify-between items-center`}
                onPress={() => {
                  setSelectedBuilding(null);
                  setShowPicker(false);
                }}
              >
                <Text
                  className={`text-lg ${
                    !selectedBuilding
                      ? "text-claude-accent font-bold"
                      : "text-gray-600"
                  }`}
                >
                  Tất cả tòa nhà
                </Text>
                {!selectedBuilding && (
                  <FontAwesome5 name="check" size={16} color="#DA7756" />
                )}
              </TouchableOpacity>

              {buildings?.map((b: any) => (
                <TouchableOpacity
                  key={b.id}
                  className="py-5 border-b border-gray-100 flex-row justify-between items-center"
                  onPress={() => {
                    setSelectedBuilding(b);
                    setShowPicker(false);
                  }}
                >
                  <View>
                    <Text
                      className={`text-lg ${
                        selectedBuilding?.id === b.id
                          ? "text-claude-accent font-bold"
                          : "text-gray-600"
                      }`}
                    >
                      {b.name}
                    </Text>
                    <Text className="text-gray-400 text-xs">{b.address}</Text>
                  </View>
                  {selectedBuilding?.id === b.id && (
                    <FontAwesome5 name="check" size={16} color="#DA7756" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Tầng 1: Header - Command Center Style */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-[#383838]/40 text-[10px] font-black uppercase tracking-[3px]">
            Command Center
          </Text>
          <View className="flex-row items-center">
            <TouchableOpacity
              className="mr-3 relative"
              onPress={() => router.push("/(admin)/notifications" as any)}
            >
              <FontAwesome5 name="bell" size={16} color="#383838" />
              <View className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
            </TouchableOpacity>
            <View className="w-2 h-2 bg-green-500 rounded-full mr-2 shadow-sm shadow-green-200" />
            <Text className="text-[10px] font-black text-[#383838]/60 uppercase tracking-widest">
              Live
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-end">
          <TouchableOpacity
            className="flex-1 flex-row items-center"
            onPress={() => setShowPicker(true)}
          >
            <Text
              className="text-2xl font-black text-[#383838] mr-2 font-serif"
              numberOfLines={1}
            >
              {selectedBuilding?.name || "Global View"}
            </Text>
            <FontAwesome5 name="chevron-down" size={10} color="#DA7756" />
          </TouchableOpacity>

          <View className="flex-row items-center bg-[#F9FAFB] px-3 py-2 rounded-xl border border-gray-100">
            <TouchableOpacity onPress={() => changeMonth(-1)} className="p-1">
              <FontAwesome5 name="chevron-left" size={10} color="#383838" />
            </TouchableOpacity>
            <Text className="mx-3 text-[10px] font-black text-[#383838] tracking-tighter uppercase">
              {currentMonth}
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)} className="p-1">
              <FontAwesome5 name="chevron-right" size={10} color="#383838" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor="#DA7756"
          />
        }
      >
        {/* Syncing Indicator */}
        {isSyncing && (
          <View className="flex-row items-center justify-center mb-4 bg-blue-50/50 py-2 rounded-xl border border-blue-100/50">
            <ActivityIndicator size="small" color="#3B82F6" className="mr-2" />
            <Text className="text-blue-600 text-[10px] font-bold uppercase tracking-wider">
              Đang đồng bộ dữ liệu...
            </Text>
          </View>
        )}

        {/* BENTO GRID: Financial & Status Area */}
        <View className="flex-row flex-wrap justify-between">
          {/* Tile 1: Tài chính (Thu nhập) - Wide */}
          <View className="w-full bg-[#383838] p-6 rounded-[32px] mb-4 shadow-sm">
            <View className="flex-row justify-between items-start mb-6">
              <View>
                <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">
                  Thu nhập {currentMonth}
                </Text>
                <Text className="text-sm text-white/60 font-medium">
                  Dự kiến: {formatCurrency(finance?.totalAmount)}
                </Text>
              </View>
              <View className="w-10 h-10 bg-white/10 rounded-2xl items-center justify-center">
                <MaterialCommunityIcons
                  name="trending-up"
                  size={20}
                  color="#DA7756"
                />
              </View>
            </View>

            <View className="flex-row justify-between items-end">
              <View>
                <Text className="text-4xl font-black text-[#DA7756] font-serif">
                  {formatCurrency(finance?.totalPaid)}
                </Text>
                <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">
                  Đã thu thực tế
                </Text>
              </View>

              <View className="items-end">
                <Text className="text-white text-xl font-bold">
                  {Math.round(
                    (finance?.totalPaid / (finance?.totalAmount || 1)) * 100,
                  ) || 0}
                  %
                </Text>
                <View className="w-16 h-1 w-full bg-white/10 rounded-full mt-1 overflow-hidden">
                  <View
                    className="h-full bg-[#DA7756]"
                    style={{
                      width: `${
                        (finance?.totalPaid / (finance?.totalAmount || 1)) *
                          100 || 0
                      }%`,
                    }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Tile 2: Báo động Nợ xấu - 1/2 Width */}
          <TouchableOpacity
            className="w-[48%] bg-[#C64545] p-5 rounded-[32px] mb-4 shadow-sm justify-between aspect-square"
            onPress={() => router.push("/(admin)/bills" as any)}
          >
            <View className="flex-row justify-between items-start">
              <View className="w-10 h-10 bg-white/20 rounded-2xl items-center justify-center">
                <MaterialCommunityIcons
                  name="alert-decagram"
                  size={20}
                  color="white"
                />
              </View>
              <Text className="text-white/80 text-[10px] font-black uppercase tracking-widest text-right">
                Nợ xấu
              </Text>
            </View>
            <View>
              <Text className="text-white text-lg font-black leading-tight">
                {formatCurrency(badDebt.amount)}
              </Text>
              <Text className="text-white/60 text-[8px] font-black uppercase tracking-tighter mt-1">
                Đang nợ bởi {badDebt.count} phòng
              </Text>
            </View>
            <View className="flex-row items-center mt-2 group">
              <Text className="text-white text-[8px] font-black uppercase tracking-widest">
                Xử lý ngay
              </Text>
              <FontAwesome5
                name="arrow-right"
                size={6}
                color="white"
                className="ml-1"
              />
            </View>
          </TouchableOpacity>

          {/* Tile 3: Trạng thái lấp đầy - 1/2 Width */}
          <View className="w-[48%] bg-white p-5 rounded-[32px] mb-4 border border-gray-100 shadow-sm justify-between aspect-square">
            <View className="flex-row justify-between items-start">
              <Text className="text-[#383838]/40 text-[10px] font-black uppercase tracking-widest">
                Trạng thái
              </Text>
              <View className="w-8 h-8 bg-[#F9FAFB] rounded-xl items-center justify-center border border-gray-50">
                <MaterialCommunityIcons
                  name="home-city"
                  size={14}
                  color="#383838"
                />
              </View>
            </View>

            <View className="space-y-3">
              <View className="flex-row items-center justify-between">
                <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                <Text className="text-[10px] font-bold text-[#383838]">
                  Đang ở
                </Text>
              </View>
              <Text className="text-[10px] font-black text-[#383838]">
                {contracts?.active || 0}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-1.5" />
                <Text className="text-[10px] font-bold text-[#383838]">
                  Sắp hết
                </Text>
              </View>
              <Text className="text-[10px] font-black text-[#383838]">
                {contracts?.expiring || 0}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-1.5 h-1.5 rounded-full bg-gray-200 mr-1.5" />
                <Text className="text-[10px] font-bold text-[#383838]">
                  Trống
                </Text>
              </View>
              <Text className="text-[10px] font-black text-[#383838]">
                {contracts?.vacant || 0}
              </Text>
            </View>

            <View className="h-1 bg-gray-50 rounded-full overflow-hidden">
              <View
                className="h-full bg-green-500"
                style={{
                  width: `${
                    (contracts?.active / (contracts?.totalRooms || 1)) * 100 ||
                    0
                  }%`,
                }}
              />
            </View>
          </View>
        </View>

        {/* Tầng 3: Cần xử lý ngay (Action Registry) */}
        <View className="bg-white rounded-[40px] p-6 border border-gray-100 shadow-sm mb-12">
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-xl font-bold text-[#383838] font-serif">
                Cần xử lý ngay
              </Text>
              <Text className="text-[#383838]/40 text-[8px] font-black uppercase tracking-widest mt-1">
                Đang có {actions.length} đầu việc ưu tiên
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(admin)/bills" as any)}
              className="bg-[#383838]/5 px-3 py-1.5 rounded-xl"
            >
              <Text className="text-[#383838] text-[9px] font-black uppercase tracking-widest">
                Tất cả hóa đơn
              </Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-4">
            {actions.length > 0 ? (
              actions.map((action: any) => (
                <View
                  key={action.id}
                  className="flex-row items-center bg-[#F9FAFB] p-4 rounded-[24px] border border-gray-50"
                >
                  <View
                    className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
                      action.type === "READING"
                        ? "bg-[#DA7756]/10"
                        : action.type === "PAYMENT"
                          ? "bg-[#C64545]/10"
                          : "bg-gray-100"
                    } border border-white shadow-sm`}
                  >
                    <MaterialCommunityIcons
                      name={action.icon as any}
                      size={20}
                      color={
                        action.type === "READING"
                          ? "#DA7756"
                          : action.type === "PAYMENT"
                            ? "#C64545"
                            : "#383838"
                      }
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-[#383838] text-sm font-bold"
                      numberOfLines={1}
                    >
                      {action.title}
                    </Text>
                    <Text className="text-gray-400 text-[9px] font-bold uppercase tracking-tighter mt-0.5">
                      {action.type === "READING"
                        ? "Điện nước"
                        : action.type === "PAYMENT"
                          ? "Tài chính"
                          : "Bảo trì"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    className={`px-4 py-2 rounded-xl border ${
                      action.type === "READING"
                        ? "bg-[#DA7756] border-[#DA7756]"
                        : action.type === "PAYMENT"
                          ? "bg-[#C64545] border-[#C64545]"
                          : "bg-[#383838] border-[#383838]"
                    }`}
                    onPress={() => router.push(action.route as any)}
                  >
                    <Text className="text-white text-[9px] font-black uppercase tracking-widest">
                      {action.actionText}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View className="items-center py-12 px-6">
                <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4 border border-gray-100">
                  <FontAwesome5 name="check-double" size={24} color="#D1D5DB" />
                </View>
                <Text className="text-gray-900 text-sm font-bold mb-1">
                  Mọi thứ đã xong!
                </Text>
                <Text className="text-gray-400 text-[10px] text-center mb-6 leading-relaxed">
                  Không có công việc ưu tiên nào cần xử lý ngay lúc này. Hệ
                  thống vận hành trơn tru.
                </Text>
                <TouchableOpacity
                  className="bg-[#383838]/5 px-6 py-2 rounded-full border border-gray-100"
                  onPress={onRefresh}
                >
                  <Text className="text-[#383838] text-[10px] font-black uppercase tracking-widest">
                    Làm mới bảng tin
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button - "Pro" Menu */}
      <View className="absolute bottom-8 right-8 items-end">
        {showFabMenu && (
          <View className="mb-4 space-y-4 items-end">
            {fabActions.map((action, index) => (
              <View key={action.id} className="flex-row items-center">
                <View className="bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm mr-3">
                  <Text className="text-gray-900 text-[10px] font-black uppercase tracking-widest">
                    {action.label}
                  </Text>
                </View>
                <TouchableOpacity
                  style={{ backgroundColor: action.color }}
                  className="w-12 h-12 rounded-2xl items-center justify-center shadow-lg"
                  onPress={() => {
                    setShowFabMenu(false);
                    router.push(action.route as any);
                  }}
                >
                  <FontAwesome5 name={action.icon} size={16} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <TouchableOpacity
          className={`${
            showFabMenu ? "bg-gray-900" : "bg-claude-accent"
          } w-16 h-16 rounded-full items-center justify-center shadow-2xl shadow-orange-500/40`}
          activeOpacity={0.8}
          onPress={() => setShowFabMenu(!showFabMenu)}
        >
          <FontAwesome5
            name={showFabMenu ? "times" : "plus"}
            size={20}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {/* Loading Overlay */}
      {isLoading && !stats && (
        <View className="absolute inset-0 bg-white/95 items-center justify-center z-50">
          <View className="items-center">
            <ActivityIndicator size="large" color="#DA7756" />
            <Text className="text-gray-900 mt-6 font-bold tracking-[4px] uppercase text-[10px]">
              Đang khởi tạo Cockpit...
            </Text>
            <Text className="text-gray-400 mt-2 text-[8px] uppercase tracking-widest font-medium">
              Thiết lập dữ liệu quản lý
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
