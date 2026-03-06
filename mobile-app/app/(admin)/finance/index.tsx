import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import dayjs from "dayjs";

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface Transaction {
  id: number;
  code: string;
  amount: number;
  type: "DEPOSIT" | "INVOICE_PAYMENT" | "EXPENSE" | "OTHER";
  date: string;
  note: string;
  contract?: {
    room?: { name: string };
    tenant?: { fullName: string };
  };
}

interface Stats {
  income: number;
  expense: number;
  net: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN").format(amount || 0) + "đ";

const getTypeLabel = (type: string) => {
  switch (type) {
    case "INVOICE_PAYMENT":
      return "Thanh toán HĐ";
    case "DEPOSIT":
      return "Tiền cọc";
    case "EXPENSE":
      return "Chi phí";
    default:
      return "Khác";
  }
};

const isExpense = (type: string) => type === "EXPENSE" || type === "OTHER";

// ─── Component ────────────────────────────────────────────────────────────────
export default function FinancePage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Form state
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNote, setExpenseNote] = useState("");

  const currentMonth = `${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${selectedDate.getFullYear()}`;

  const changeMonth = (delta: number) => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + delta);
    setSelectedDate(d);
  };

  // ── Queries ────────────────────────────────────────────────────────────────
  const {
    data: transactions = [],
    isLoading: txLoading,
    refetch: refetchTx,
  } = useQuery<Transaction[]>({
    queryKey: ["transactions", currentMonth],
    queryFn: async () => {
      const res = await api.get("/transactions", {
        params: { month: currentMonth, take: 50 },
      });
      return res.data;
    },
  });

  const {
    data: stats = { income: 0, expense: 0, net: 0 },
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery<Stats>({
    queryKey: ["transaction-stats", currentMonth],
    queryFn: async () => {
      const res = await api.get("/transactions/stats", {
        params: { month: currentMonth },
      });
      return res.data || { income: 0, expense: 0, net: 0 };
    },
  });

  const isLoading = txLoading || statsLoading;

  const onRefresh = useCallback(() => {
    refetchTx();
    refetchStats();
  }, [refetchTx, refetchStats]);

  // ── Create Expense Mutation ────────────────────────────────────────────────
  const createExpense = useMutation({
    mutationFn: async () => {
      const amount = Number(expenseAmount.replace(/\D/g, ""));
      if (!amount || amount <= 0) throw new Error("Số tiền không hợp lệ");
      if (!expenseNote.trim()) throw new Error("Vui lòng nhập lý do chi");

      return api.post("/transactions", {
        amount,
        type: "EXPENSE",
        date: new Date().toISOString(),
        note: expenseNote.trim(),
        contractId: null,
      });
    },
    onSuccess: () => {
      setShowExpenseModal(false);
      setExpenseAmount("");
      setExpenseNote("");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction-stats"] });
      Alert.alert("✅ Thành công", "Đã tạo phiếu chi thành công!");
    },
    onError: (err: any) => {
      Alert.alert("Lỗi", err.message || "Có lỗi xảy ra");
    },
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F8F7F4" }}
      edges={["top"]}
    >
      {/* HEADER */}
      <View
        style={{
          backgroundColor: "white",
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#F0F0EC",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 38,
                height: 38,
                backgroundColor: "#1B4332",
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="trending-up" size={18} color="white" />
            </View>
            <View>
              <Text
                style={{ fontSize: 18, fontWeight: "800", color: "#1A1A1A" }}
              >
                Tài chính
              </Text>
              <Text
                style={{ fontSize: 11, color: "#9CA3AF", fontWeight: "500" }}
              >
                Doanh thu &amp; chi phí
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowExpenseModal(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: "#C5221F",
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 12,
            }}
          >
            <Ionicons name="add" size={16} color="white" />
            <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>
              Phiếu chi
            </Text>
          </TouchableOpacity>
        </View>

        {/* Month Selector */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F4F4F0",
            borderRadius: 12,
            padding: 4,
          }}
        >
          <TouchableOpacity
            onPress={() => changeMonth(-1)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: "white",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="chevron-back" size={16} color="#64748B" />
          </TouchableOpacity>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              fontWeight: "700",
              fontSize: 14,
              color: "#1A1A1A",
            }}
          >
            {currentMonth}
          </Text>
          <TouchableOpacity
            onPress={() => changeMonth(1)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: "white",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── STATS CARDS ── */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          {/* Income */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#F0FDF4",
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: "#BBF7D0",
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                backgroundColor: "#16A34A",
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <Ionicons name="trending-up" size={18} color="white" />
            </View>
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: "#15803D",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 4,
              }}
            >
              Tổng thu
            </Text>
            {statsLoading ? (
              <ActivityIndicator size="small" color="#16A34A" />
            ) : (
              <Text
                style={{ fontSize: 15, fontWeight: "800", color: "#14532D" }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(stats.income)}
              </Text>
            )}
          </View>

          {/* Expense */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#FEF2F2",
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: "#FECACA",
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                backgroundColor: "#DC2626",
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <Ionicons name="trending-down" size={18} color="white" />
            </View>
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: "#DC2626",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 4,
              }}
            >
              Tổng chi
            </Text>
            {statsLoading ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <Text
                style={{ fontSize: 15, fontWeight: "800", color: "#7F1D1D" }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(stats.expense)}
              </Text>
            )}
          </View>
        </View>

        {/* Net Profit */}
        <View
          style={{
            backgroundColor: "#1A1A2E",
            borderRadius: 20,
            padding: 20,
            marginBottom: 20,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}
              >
                Lợi nhuận ròng
              </Text>
              {statsLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text
                  style={{
                    fontSize: 26,
                    fontWeight: "900",
                    color: stats.net >= 0 ? "#4ADE80" : "#F87171",
                  }}
                >
                  {stats.net >= 0 ? "+" : ""}
                  {formatCurrency(stats.net)}
                </Text>
              )}
            </View>
            <View
              style={{
                width: 44,
                height: 44,
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="wallet-outline" size={22} color="#9CA3AF" />
            </View>
          </View>
          {/* Progress bar */}
          <View
            style={{
              height: 4,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 2,
              marginTop: 14,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${stats.income > 0 ? Math.min((stats.net / stats.income) * 100, 100) : 0}%`,
                backgroundColor: "#4ADE80",
                borderRadius: 2,
              }}
            />
          </View>
        </View>

        {/* ── TRANSACTIONS LIST ── */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "#F0F0EC",
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* Section Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: "#F4F4F0",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#1A1A1A" }}>
              Giao dịch gần đây
            </Text>
            <View
              style={{
                backgroundColor: "#F4F4F0",
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 20,
              }}
            >
              <Text
                style={{ fontSize: 11, fontWeight: "700", color: "#6B7280" }}
              >
                {transactions.length} giao dịch
              </Text>
            </View>
          </View>

          {/* Content */}
          {txLoading ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#DA7756" />
              <Text style={{ color: "#9CA3AF", marginTop: 8, fontSize: 13 }}>
                Đang tải...
              </Text>
            </View>
          ) : transactions.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  backgroundColor: "#F4F4F0",
                  borderRadius: 28,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                <Ionicons name="receipt-outline" size={26} color="#D1D5DB" />
              </View>
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#9CA3AF" }}
              >
                Chưa có giao dịch nào
              </Text>
            </View>
          ) : (
            transactions.map((tx, index) => (
              <View
                key={tx.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: index < transactions.length - 1 ? 1 : 0,
                  borderBottomColor: "#F9F9F7",
                }}
              >
                {/* Icon */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: isExpense(tx.type) ? "#FEF2F2" : "#F0FDF4",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                    flexShrink: 0,
                  }}
                >
                  <Ionicons
                    name={
                      tx.type === "EXPENSE"
                        ? "remove-circle-outline"
                        : tx.type === "DEPOSIT"
                          ? "shield-checkmark-outline"
                          : "cash-outline"
                    }
                    size={18}
                    color={isExpense(tx.type) ? "#DC2626" : "#16A34A"}
                  />
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: "#1A1A1A",
                    }}
                    numberOfLines={1}
                  >
                    {tx.note || tx.code}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 2,
                    }}
                  >
                    <Text style={{ fontSize: 10, color: "#9CA3AF" }}>
                      {dayjs(tx.date).format("DD/MM/YYYY")}
                    </Text>
                    <View
                      style={{
                        backgroundColor: "#F4F4F0",
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                        borderRadius: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: "600",
                          color: "#6B7280",
                        }}
                      >
                        {getTypeLabel(tx.type)}
                      </Text>
                    </View>
                    {tx.contract?.room?.name && (
                      <Text style={{ fontSize: 10, color: "#9CA3AF" }}>
                        · P.{tx.contract.room.name}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Amount */}
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "800",
                    color: isExpense(tx.type) ? "#DC2626" : "#16A34A",
                    marginLeft: 8,
                  }}
                >
                  {isExpense(tx.type) ? "-" : "+"}
                  {new Intl.NumberFormat("vi-VN").format(tx.amount)}đ
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ── CREATE EXPENSE MODAL ── */}
      <Modal
        visible={showExpenseModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowExpenseModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
            activeOpacity={1}
            onPress={() => setShowExpenseModal(false)}
          />
          <View
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              paddingBottom: Platform.OS === "ios" ? 40 : 24,
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: "#FEF2F2",
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons name="trending-down" size={20} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 17, fontWeight: "800", color: "#1A1A1A" }}
                >
                  Tạo phiếu chi
                </Text>
                <Text style={{ fontSize: 12, color: "#9CA3AF" }}>
                  Ghi nhận chi phí vận hành
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowExpenseModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: "#F4F4F0",
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: "#374151",
                marginBottom: 6,
              }}
            >
              SỐ TIỀN CHI (đ)
            </Text>
            <TextInput
              value={expenseAmount}
              onChangeText={(v) => setExpenseAmount(v.replace(/\D/g, ""))}
              keyboardType="numeric"
              placeholder="Nhập số tiền..."
              placeholderTextColor="#D1D5DB"
              style={{
                backgroundColor: "#F9F9F7",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#E5E5E0",
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 20,
                fontWeight: "700",
                color: "#DC2626",
                marginBottom: 16,
              }}
            />

            {/* Note */}
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: "#374151",
                marginBottom: 6,
              }}
            >
              LÝ DO CHI
            </Text>
            <TextInput
              value={expenseNote}
              onChangeText={setExpenseNote}
              placeholder="VD: Sửa bóng đèn, Mua văn phòng phẩm..."
              placeholderTextColor="#D1D5DB"
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: "#F9F9F7",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#E5E5E0",
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 14,
                color: "#1A1A1A",
                textAlignVertical: "top",
                marginBottom: 24,
                minHeight: 80,
              }}
            />

            {/* Submit */}
            <TouchableOpacity
              onPress={() => createExpense.mutate()}
              disabled={createExpense.isPending}
              style={{
                backgroundColor: createExpense.isPending
                  ? "#9CA3AF"
                  : "#C5221F",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {createExpense.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="checkmark-circle" size={20} color="white" />
              )}
              <Text style={{ color: "white", fontWeight: "800", fontSize: 15 }}>
                {createExpense.isPending ? "Đang tạo..." : "Tạo phiếu chi"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
