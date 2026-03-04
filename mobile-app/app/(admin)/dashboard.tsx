import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import clsx from "clsx";

export default function Dashboard() {
  const router = useRouter();
  console.log("Dashboard rendering V3");
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
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
      try {
        const res = await api.get("/buildings");
        return res.data;
      } catch (error) {
        console.error("Fetch Buildings Error:", error);
        return [];
      }
    },
  });

  // 2. Fetch Stats based on buildingId
  const {
    data: stats,
    isLoading: isStatsLoading,
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
          allInvoicesRes, // Changed from overdueInvoicesRes (fetching all to filter locally)
          unreadReadingsRes,
        ] = await Promise.all([
          api.get(`/invoices/stats/${currentMonth}`, { params }).catch(() => ({
            data: {
              totalAmount: 0,
              totalPaid: 0,
              totalDebt: 0,
              growth: 0,
              breakdown: { rent: 0, services: 0 },
            },
          })),
          api.get("/contracts/stats", { params }).catch(() => ({
            data: { active: 0, totalRooms: 0, vacant: 0, expiring: 0 },
          })),
          api
            .get("/issues/stats", { params })
            .catch(() => ({ data: { OPEN: 0 } })),
          api
            .get("/invoices", { params: { ...params } }) // Removed status filter to get OVERDUE too
            .catch(() => ({ data: [] })),
          api
            .get("/readings/unread", {
              params: { ...params, month: currentMonth, serviceId: 1 },
            })
            .catch(() => ({ data: [] })),
        ]);

        // Filter for Bad Debt (Includes PUBLISHED and OVERDUE with debt > 0)
        // Adjust logic to specifically target what needs collection
        const overdueList = allInvoicesRes.data.filter(
          (inv: any) =>
            (inv.status === "PUBLISHED" ||
              inv.status === "OVERDUE" ||
              inv.status === "PARTIAL") &&
            inv.debtAmount > 0,
        );

        const badDebtTotal = overdueList.reduce(
          (sum: number, inv: any) => sum + inv.debtAmount,
          0,
        );

        const actions: any[] = [];

        // Readings Actions
        unreadReadingsRes.data
          .slice(0, 3)
          .forEach((room: any, index: number) => {
            const uniqueId = room.roomId
              ? `reading-${room.roomId}`
              : `reading-fallback-${index}`;
            const rName = room.roomName || room.name || "??";

            actions.push({
              id: uniqueId,
              type: "READING",
              title: `Phòng ${rName}`,
              subtitle: "Chưa chốt chỉ số",
              icon: "flash-outline",
              iconColor: "text-amber-500",
              iconBg: "bg-amber-50",
              actionText: "Chốt số",
              route: `/(admin)/bills/new`,
            });
          });

        // Payment Actions
        overdueList.slice(0, 3).forEach((inv: any, index: number) => {
          const uniqueId = inv.id
            ? `overdue-${inv.id}`
            : `overdue-fallback-${index}`;

          const isOverdue = inv.status === "OVERDUE";

          actions.push({
            id: uniqueId,
            type: "PAYMENT",
            title: `Phòng ${inv.contract?.room?.name || "??"} - ${inv.month}`,
            subtitle: isOverdue
              ? `Quá hạn: ${formatCurrency(inv.debtAmount)}`
              : `Nợ: ${formatCurrency(inv.debtAmount)}`,
            icon: isOverdue ? "alert-circle-outline" : "cash-outline",
            iconColor: isOverdue ? "text-red-600" : "text-rose-500",
            iconBg: isOverdue ? "bg-red-50" : "bg-rose-50",
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
          actions: actions.slice(0, 5),
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
  const finance = stats?.finance;
  const contracts = stats?.contracts;
  const actions = stats?.actions || [];
  const badDebt = stats?.badDebt || { amount: 0, count: 0 };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount || 0);
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedDate(newDate);
  };

  // Progress calculations
  const totalAmount = finance?.totalAmount || 0;
  const totalPaid = finance?.totalPaid || 0;
  const progressPercent = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* HEADER SECTION */}
      <View className="bg-white px-5 pt-3 pb-4 border-b border-slate-100 z-10 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.05)]">
        <View className="flex-row justify-between items-center mb-4">
          {/* Brand / Title */}
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 bg-indigo-600 rounded-xl items-center justify-center shadow-lg shadow-indigo-200">
              <Ionicons name="grid" size={20} color="white" />
            </View>
            <View>
              <Text className="text-lg font-bold text-slate-800 leading-tight">
                Tổng quan
              </Text>
              <Text className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">
                {selectedBuilding?.name || "Tất cả tòa nhà"}
              </Text>
            </View>
          </View>

          {/* RIGHT GROUP: Month & Bell */}
          <View className="flex-row items-center gap-3">
            {/* Month Selector */}
            <View className="flex-row items-center bg-slate-100 rounded-full p-1 pl-3 pr-1">
              <Text className="text-xs font-bold text-slate-600 mr-2">
                {currentMonth}
              </Text>
              <View className="flex-row gap-1">
                <TouchableOpacity
                  onPress={() => changeMonth(-1)}
                  className="w-7 h-7 bg-white rounded-full items-center justify-center shadow-sm"
                >
                  <Ionicons name="chevron-back" size={14} color="#64748B" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => changeMonth(1)}
                  className="w-7 h-7 bg-white rounded-full items-center justify-center shadow-sm"
                >
                  <Ionicons name="chevron-forward" size={14} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Notification Bell */}
            <TouchableOpacity
              className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-slate-100 relative"
              onPress={() => router.push("/(admin)/notifications" as any)}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#64748B"
              />
              {/* Red Dot if needed - logic for unread count can go here */}
              <View className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Horizontal Building Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
          contentContainerStyle={{ paddingRight: 20 }}
        >
          <TouchableOpacity
            onPress={() => setSelectedBuilding(null)}
            className={clsx(
              "px-5 py-2 rounded-full mr-2 border transition-all",
              !selectedBuilding
                ? "bg-slate-800 border-slate-800 shadow-md shadow-slate-300"
                : "bg-white border-slate-200",
            )}
          >
            <Text
              className={clsx(
                "text-xs font-bold",
                !selectedBuilding ? "text-white" : "text-slate-600",
              )}
            >
              Tất cả
            </Text>
          </TouchableOpacity>
          {buildings?.map((b: any) => (
            <TouchableOpacity
              key={b.id}
              onPress={() => setSelectedBuilding(b)}
              className={clsx(
                "px-5 py-2 rounded-full mr-2 border",
                selectedBuilding?.id === b.id
                  ? "bg-slate-800 border-slate-800 shadow-md shadow-slate-300"
                  : "bg-white border-slate-200",
              )}
            >
              <Text
                className={clsx(
                  "text-xs font-bold",
                  selectedBuilding?.id === b.id
                    ? "text-white"
                    : "text-slate-600",
                )}
              >
                {b.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor="#4F46E5"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* REVENUE CARD - V3 (No Donut, Big Numbers) */}
        <View className="bg-white rounded-[28px] p-6 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.04)] mb-6 border border-slate-50">
          <View className="flex-row justify-between items-start mb-6">
            <View>
              <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                Tổng doanh thu
              </Text>
              <View className="flex-row items-baseline">
                <Text
                  className={clsx(
                    "text-3xl font-bold text-slate-800 mr-2",
                    Platform.OS === "ios" ? "font-[Menlo]" : "font-monospace",
                  )}
                >
                  {formatCurrency(totalAmount)}
                </Text>
                <Text className="text-sm font-medium text-slate-400">đ</Text>
              </View>

              {/* Growth Badge */}
              {finance?.growth !== undefined && (
                <View className="flex-row items-center mt-2">
                  <View
                    className={clsx(
                      "w-5 h-5 rounded-full items-center justify-center mr-1.5",
                      finance.growth >= 0 ? "bg-emerald-100" : "bg-rose-100",
                    )}
                  >
                    <Ionicons
                      name={
                        finance.growth >= 0 ? "trending-up" : "trending-down"
                      }
                      size={10}
                      color={finance.growth >= 0 ? "#10B981" : "#F43F5E"}
                    />
                  </View>
                  <Text
                    className={clsx(
                      "text-xs font-bold",
                      finance.growth >= 0
                        ? "text-emerald-600"
                        : "text-rose-600",
                    )}
                  >
                    {finance.growth.toFixed(1)}%
                  </Text>
                  <Text className="text-[10px] text-slate-400 ml-1">
                    so với tháng trước
                  </Text>
                </View>
              )}
            </View>

            {/* Collected Amount - Big & Bold */}
            <View className="items-end">
              <Text className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">
                Đã thực thu
              </Text>
              <Text
                className={clsx(
                  "text-xl font-black text-indigo-600",
                  Platform.OS === "ios" ? "font-[Menlo]" : "font-monospace",
                )}
              >
                {formatCurrency(totalPaid)}
                <Text className="text-xs font-medium text-indigo-400">đ</Text>
              </Text>
              <Text className="text-[10px] font-bold text-slate-400 mt-1">
                Đạt {progressPercent.toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* Progress Bar Line */}
          <View className="h-2 w-full bg-slate-100 rounded-full mb-5 overflow-hidden">
            <View
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </View>

          {/* Breakdown */}
          <View className="flex-row">
            <View className="flex-1 pr-4 border-r border-slate-50">
              <View className="flex-row items-center mb-1">
                <View className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2" />
                <Text className="text-xs font-medium text-slate-500">
                  Tiền phòng
                </Text>
              </View>
              <Text className="text-sm font-bold text-slate-800 ml-3.5">
                {formatCurrency(finance?.breakdown?.rent || 0)}
              </Text>
            </View>
            <View className="flex-1 pl-4">
              <View className="flex-row items-center mb-1">
                <View className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2" />
                <Text className="text-xs font-medium text-slate-500">
                  Dịch vụ
                </Text>
              </View>
              <Text className="text-sm font-bold text-slate-800 ml-3.5">
                {formatCurrency(finance?.breakdown?.services || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* STATUS & BAD DEBT CARDS */}
        <View className="flex-row gap-4 mb-6">
          {/* Rooms Status */}
          <View className="flex-1 bg-white p-5 rounded-[24px] shadow-[0_8px_30px_-8px_rgba(0,0,0,0.04)] border border-slate-50">
            <View className="flex-row items-center gap-2 mb-4">
              <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center">
                <Ionicons name="business-outline" size={16} color="#64748B" />
              </View>
              <Text className="text-xs font-bold text-slate-700">
                Trạng thái phòng
              </Text>
            </View>

            <View className="space-y-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-slate-500 font-medium">
                  Đang thuê
                </Text>
                <View className="flex-row items-center bg-emerald-50 px-2 py-0.5 rounded-md">
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                  <Text className="text-xs font-bold text-emerald-700">
                    {contracts?.active || 0}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-slate-500 font-medium">
                  Trống
                </Text>
                <View className="flex-row items-center bg-slate-50 px-2 py-0.5 rounded-md">
                  <View className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
                  <Text className="text-xs font-bold text-slate-600">
                    {contracts?.vacant || 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bad Debt - Clean with accent */}
          <View className="flex-1 bg-white p-5 rounded-[24px] shadow-[0_8px_30px_-8px_rgba(0,0,0,0.04)] border border-rose-100/50">
            <View className="flex-row items-center gap-2 mb-4">
              <View className="w-8 h-8 rounded-full bg-rose-50 items-center justify-center">
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#F43F5E"
                />
              </View>
              <Text className="text-xs font-bold text-rose-600">
                Nợ cần thu
              </Text>
            </View>

            <Text className="text-xl font-bold text-slate-800">
              {formatCurrency(badDebt.amount)}
              <Text className="text-xs text-slate-400 font-normal">đ</Text>
            </Text>
            <Text className="text-[10px] text-slate-400 mt-1 mb-3">
              Từ {badDebt.count} phòng chưa đóng
            </Text>

            <TouchableOpacity
              className="flex-row items-center justify-center py-2 bg-rose-50 rounded-xl"
              onPress={() => router.push("/(admin)/bills" as any)}
            >
              <Text className="text-[10px] font-bold text-rose-600 mr-1">
                Xem chi tiết
              </Text>
              <Ionicons name="arrow-forward" size={10} color="#E11D48" />
            </TouchableOpacity>
          </View>
        </View>

        {/* TASKS LIST - Elegant & Light */}
        <View className="bg-white rounded-[28px] px-5 py-6 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.04)] border border-slate-50">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-base font-bold text-slate-800">
              Cần xử lý hôm nay
            </Text>
            <View className="bg-slate-100 px-2.5 py-1 rounded-lg">
              <Text className="text-[10px] font-extrabold text-slate-600">
                {actions.length}
              </Text>
            </View>
          </View>

          {actions.length > 0 ? (
            <View className="space-y-1">
              {actions.map((action: any, index: number) => (
                <TouchableOpacity
                  key={action.id}
                  onPress={() => router.push(action.route)}
                  activeOpacity={0.7}
                  className={clsx(
                    "flex-row items-center p-3 rounded-2xl border border-transparent transition-all",
                    // Alternate background for striped effect or just hover? Let's keep it simple white with active state
                    "active:bg-slate-50 bg-white mb-2 shadow-sm border-slate-100",
                  )}
                >
                  {/* Icon Box */}
                  <View
                    className={clsx(
                      "w-10 h-10 rounded-[14px] items-center justify-center mr-3.5",
                      action.iconBg || "bg-slate-100",
                    )}
                  >
                    <Ionicons
                      name={action.icon || "ellipse"}
                      size={20}
                      className={action.iconColor || "text-slate-500"}
                      color={
                        (action.iconColor || "").includes("amber")
                          ? "#F59E0B"
                          : "#F43F5E"
                      }
                    />
                  </View>

                  {/* Text Info */}
                  <View className="flex-1">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-sm font-bold text-slate-800">
                        {action.title}
                      </Text>
                      {/* Action Link Text instead of Button */}
                      <View className="flex-row items-center">
                        <Text className="text-[10px] font-bold text-indigo-600 mr-0.5">
                          {action.actionText}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={10}
                          color="#4F46E5"
                        />
                      </View>
                    </View>
                    <Text className="text-xs text-slate-400 mt-0.5">
                      {action.subtitle}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="items-center py-10 opacity-60">
              <Ionicons
                name="checkmark-circle-outline"
                size={48}
                color="#CBD5E1"
              />
              <Text className="text-sm text-slate-500 mt-3 font-medium">
                Tuyệt vời! Đã xong hết việc.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB - Elegant */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-[20px] items-center justify-center shadow-lg shadow-indigo-400/40"
        onPress={() => router.push("/(admin)/bills/new" as any)}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
