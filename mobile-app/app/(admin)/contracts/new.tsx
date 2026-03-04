import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState, useEffect, useMemo } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);

export default function NewContract() {
  const params = useLocalSearchParams<{
    roomId?: string;
    roomName?: string;
    buildingId?: string;
    roomPrice?: string;
    depositPrice?: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form state
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(
    params.buildingId ? Number(params.buildingId) : null,
  );
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(
    params.roomId ? Number(params.roomId) : null,
  );
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [price, setPrice] = useState(params.roomPrice || "");
  const [deposit, setDeposit] = useState(params.depositPrice || "");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 365 * 86400000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Existing Tenant
  const [searchTenant, setSearchTenant] = useState("");

  // New Tenant Tab (true = new, false = existing)
  const [isNewTenantTab, setIsNewTenantTab] = useState(false);
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantPhone, setNewTenantPhone] = useState("");

  // Services initial index config
  const [initialIndexes, setInitialIndexes] = useState<Record<number, string>>(
    {},
  );

  // Fetch buildings
  const { data: buildings = [] } = useQuery({
    queryKey: ["buildings"],
    queryFn: async () => {
      const res = await api.get("/buildings");
      return res.data;
    },
  });

  // Fetch Services for initial indexes
  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await api.get("/services");
      return res.data;
    },
  });

  // Fetch rooms for selected building
  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms", "building", selectedBuildingId],
    queryFn: async () => {
      const res = await api.get("/rooms", {
        params: { buildingId: selectedBuildingId, status: "AVAILABLE" },
      });
      return res.data;
    },
    enabled: !!selectedBuildingId,
  });

  // Fetch tenants
  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants", searchTenant],
    queryFn: async () => {
      const res = await api.get("/tenants", {
        params: searchTenant ? { search: searchTenant } : {},
      });
      return res.data;
    },
  });

  // Auto-fill price when room is selected
  const selectedRoom = useMemo(
    () => rooms.find((r: any) => r.id === selectedRoomId),
    [rooms, selectedRoomId],
  );

  useEffect(() => {
    if (selectedRoom && !params.roomPrice) {
      setPrice(selectedRoom.price?.toString() || "");
      setDeposit(selectedRoom.depositPrice?.toString() || "");
    }
  }, [selectedRoom]);

  const formatDate = (d: Date) =>
    `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;

  // Create contract mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      let finalTenantId = selectedTenantId;

      // If we are on the New Tenant Tab, we first need to POST the new tenant
      if (isNewTenantTab) {
        if (!newTenantName || !newTenantPhone) {
          throw new Error("Vui lòng nhập họ tên và số điện thoại khách thuê.");
        }

        try {
          const tenantRes = await api.post("/tenants", {
            fullName: newTenantName,
            phone: newTenantPhone,
            info: {},
          });
          finalTenantId = tenantRes.data.id;
        } catch (error: any) {
          console.log("Error creating inline tenant", error);
          throw new Error(
            error.response?.data?.message || "Không thể tạo khách mới",
          );
        }
      }

      // Convert local initialIndexes string values to numbers
      const numericIndexes: Record<string, number> = {};
      Object.keys(initialIndexes).forEach((key) => {
        numericIndexes[key] = Number(initialIndexes[Number(key)]);
      });

      return api.post("/contracts", {
        roomId: selectedRoomId,
        tenantId: finalTenantId,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        price: Number(price),
        deposit: Number(deposit),
        initialIndexes: numericIndexes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      Alert.alert("Thành công", "Đã tạo hợp đồng mới!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không thể tạo hợp đồng",
      );
    },
  });

  const canSubmit =
    selectedRoomId &&
    (isNewTenantTab ? newTenantName && newTenantPhone : selectedTenantId) &&
    Number(price) > 0;

  const indexServices = useMemo(() => {
    return Array.isArray(services)
      ? services.filter((s: any) => s.type === "INDEX")
      : [];
  }, [services]);

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      {/* HEADER */}
      <View className="px-6 py-4 bg-white border-b border-gray-100 flex-row items-center gap-4">
        <TouchableOpacity
          className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
          onPress={() => router.back()}
        >
          <FontAwesome5 name="arrow-left" size={16} color="#374151" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-gray-900 font-serif">
            Tạo hợp đồng
          </Text>
          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            New Contract
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* Step 1: Building & Room */}
        <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
          <Text className="text-xs font-bold text-gray-500 uppercase mb-3">
            <Text className="text-[#DA7756]">① </Text>Chọn phòng
          </Text>

          {/* Building Selection */}
          {!params.roomId && (
            <>
              <Text className="text-xs font-semibold text-gray-600 mb-1">
                Tòa nhà
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-3"
              >
                <View className="flex-row gap-2">
                  {buildings.map((b: any) => (
                    <TouchableOpacity
                      key={b.id}
                      onPress={() => {
                        setSelectedBuildingId(b.id);
                        setSelectedRoomId(null);
                      }}
                      className={`px-4 py-2.5 rounded-xl border ${
                        selectedBuildingId === b.id
                          ? "bg-[#DA7756] border-[#DA7756]"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-sm font-bold ${
                          selectedBuildingId === b.id
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        {b.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Room Selection */}
              <Text className="text-xs font-semibold text-gray-600 mb-1">
                Phòng trống
              </Text>
              {selectedBuildingId && rooms.length === 0 ? (
                <View className="bg-gray-50 rounded-xl p-4 items-center">
                  <Text className="text-gray-400">Không có phòng trống</Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap gap-2">
                  {rooms.map((r: any) => (
                    <TouchableOpacity
                      key={r.id}
                      onPress={() => setSelectedRoomId(r.id)}
                      className={`px-3 py-2 rounded-xl border ${
                        selectedRoomId === r.id
                          ? "bg-[#FFF4F0] border-[#DA7756]"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <Text
                        className={`font-bold text-sm ${
                          selectedRoomId === r.id
                            ? "text-[#DA7756]"
                            : "text-gray-700"
                        }`}
                      >
                        {r.name}
                      </Text>
                      <Text className="text-[10px] text-gray-500">
                        {formatCurrency(r.price)} đ
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Pre-selected room */}
          {params.roomId && (
            <View className="bg-[#FFF4F0] rounded-xl p-4 flex-row items-center gap-3">
              <View className="w-9 h-9 bg-[#DA7756] rounded-xl items-center justify-center">
                <FontAwesome5 name="door-open" size={14} color="white" />
              </View>
              <View>
                <Text className="font-bold text-gray-900">
                  {params.roomName}
                </Text>
                <Text className="text-xs text-gray-500">
                  {formatCurrency(Number(params.roomPrice))} đ/tháng
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Step 2: Tenant */}
        <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
          <Text className="text-xs font-bold text-gray-500 uppercase mb-3">
            <Text className="text-[#DA7756]">② </Text>Khách thuê
          </Text>

          {/* Tab Switcher */}
          <View className="flex-row p-1 bg-gray-100 rounded-xl mb-4">
            <TouchableOpacity
              onPress={() => setIsNewTenantTab(false)}
              className={`flex-1 py-2 items-center rounded-lg ${!isNewTenantTab ? "bg-white shadow-sm" : ""}`}
            >
              <Text
                className={`font-bold text-xs ${!isNewTenantTab ? "text-gray-900" : "text-gray-500"}`}
              >
                Tìm khách cũ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsNewTenantTab(true)}
              className={`flex-1 py-2 items-center rounded-lg ${isNewTenantTab ? "bg-white shadow-sm" : ""}`}
            >
              <Text
                className={`font-bold text-xs ${isNewTenantTab ? "text-[#DA7756]" : "text-gray-500"}`}
              >
                Tạo khách mới
              </Text>
            </TouchableOpacity>
          </View>

          {/* Panel: Existing Tenant */}
          {!isNewTenantTab && (
            <View>
              <View className="bg-gray-50 border border-gray-200 rounded-xl flex-row items-center px-4 mb-3">
                <Ionicons name="search" size={18} color="#9CA3AF" />
                <TextInput
                  className="flex-1 py-3 ml-2 text-gray-900"
                  placeholder="Tìm theo tên hoặc SĐT..."
                  value={searchTenant}
                  onChangeText={setSearchTenant}
                />
              </View>

              <ScrollView style={{ maxHeight: 200 }}>
                {tenants.map((t: any) => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setSelectedTenantId(t.id)}
                    className={`p-3 rounded-xl flex-row items-center gap-3 mb-1 ${
                      selectedTenantId === t.id ? "bg-[#FFF4F0]" : ""
                    }`}
                  >
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center ${
                        selectedTenantId === t.id
                          ? "bg-[#DA7756]"
                          : "bg-gray-200"
                      }`}
                    >
                      <Text
                        className={`font-bold text-xs ${
                          selectedTenantId === t.id
                            ? "text-white"
                            : "text-gray-600"
                        }`}
                      >
                        {t.fullName?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-gray-900 text-sm">
                        {t.fullName}
                      </Text>
                      <Text className="text-xs text-gray-500">{t.phone}</Text>
                    </View>
                    {selectedTenantId === t.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#DA7756"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Panel: New Tenant */}
          {isNewTenantTab && (
            <View className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <Text className="text-xs font-semibold text-gray-600 mb-1">
                Họ tên <Text className="text-red-500">*</Text>
              </Text>
              <View className="bg-white border border-gray-200 rounded-xl px-4 mb-3">
                <TextInput
                  className="py-3 text-gray-900"
                  placeholder="Nguyễn Văn A"
                  value={newTenantName}
                  onChangeText={setNewTenantName}
                />
              </View>

              <Text className="text-xs font-semibold text-gray-600 mb-1">
                Số điện thoại <Text className="text-red-500">*</Text>
              </Text>
              <View className="bg-white border border-gray-200 rounded-xl px-4">
                <TextInput
                  className="py-3 text-gray-900"
                  placeholder="0909..."
                  keyboardType="phone-pad"
                  value={newTenantPhone}
                  onChangeText={setNewTenantPhone}
                />
              </View>
              <Text className="text-xs text-gray-400 mt-2 italic">
                * Khách hàng mới sẽ được tự động lưu vào hệ thống khi tạo hợp
                đồng.
              </Text>
            </View>
          )}
        </View>

        {/* Step 3: Financial */}
        <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
          <Text className="text-xs font-bold text-gray-500 uppercase mb-3">
            <Text className="text-[#DA7756]">③ </Text>Thông tin hợp đồng
          </Text>

          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-gray-600 mb-1">
                Giá thuê <Text className="text-red-500">*</Text>
              </Text>
              <View className="bg-gray-50 border border-gray-200 rounded-xl flex-row items-center px-4">
                <Text className="text-gray-400 mr-1">₫</Text>
                <TextInput
                  className="flex-1 py-3 font-bold text-gray-900"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-gray-600 mb-1">
                Tiền cọc
              </Text>
              <View className="bg-gray-50 border border-gray-200 rounded-xl flex-row items-center px-4">
                <Text className="text-gray-400 mr-1">₫</Text>
                <TextInput
                  className="flex-1 py-3 font-bold text-gray-900"
                  keyboardType="numeric"
                  value={deposit}
                  onChangeText={setDeposit}
                />
              </View>
            </View>
          </View>

          {/* Dates */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-gray-600 mb-1">
                Ngày bắt đầu
              </Text>
              <TouchableOpacity
                className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex-row items-center justify-between"
                onPress={() => setShowStartPicker(true)}
              >
                <Text className="font-bold text-gray-900 text-xs">
                  {formatDate(startDate)}
                </Text>
                <Ionicons name="calendar" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={(_, date) => {
                    setShowStartPicker(Platform.OS === "ios");
                    if (date) setStartDate(date);
                  }}
                />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-gray-600 mb-1">
                Ngày kết thúc
              </Text>
              <TouchableOpacity
                className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex-row items-center justify-between"
                onPress={() => setShowEndPicker(true)}
              >
                <Text className="font-bold text-gray-900 text-xs">
                  {formatDate(endDate)}
                </Text>
                <Ionicons name="calendar" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={(_, date) => {
                    setShowEndPicker(Platform.OS === "ios");
                    if (date) setEndDate(date);
                  }}
                />
              )}
            </View>
          </View>

          {/* Services Setup */}
          {indexServices.length > 0 && (
            <View className="mt-5 pt-5 border-t border-gray-100">
              <Text className="text-sm font-bold text-gray-800 mb-3 flex-row items-center">
                <Ionicons name="flash" size={16} color="#EAB308" /> Chốt chỉ số
                điện/nước ban đầu
              </Text>

              <View className="flex-row flex-wrap gap-3">
                {indexServices.map((service: any) => (
                  <View key={service.id} className="w-[48%] mb-2">
                    <Text className="text-xs font-semibold text-gray-600 mb-1">
                      {service.name}
                    </Text>
                    <View className="bg-gray-50 border border-gray-200 rounded-xl px-3">
                      <TextInput
                        className="py-2.5 font-bold text-gray-900"
                        keyboardType="numeric"
                        placeholder="0"
                        value={initialIndexes[service.id] || ""}
                        onChangeText={(v) =>
                          setInitialIndexes((prev) => ({
                            ...prev,
                            [service.id]: v,
                          }))
                        }
                      />
                    </View>
                  </View>
                ))}
              </View>
              <Text className="text-xs text-gray-400 mt-1">
                * Chỉ số này sẽ tính là số cũ cho tháng đầu tiên.
              </Text>
            </View>
          )}
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          onPress={() => createMutation.mutate()}
          disabled={!canSubmit || createMutation.isPending}
          className={`py-4 mt-6 rounded-xl flex-row justify-center items-center gap-2 ${
            canSubmit
              ? "bg-[#DA7756] shadow-lg shadow-orange-200"
              : "bg-gray-200"
          }`}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={canSubmit ? "white" : "#9CA3AF"}
              />
              <Text
                className={`font-bold text-lg ${
                  canSubmit ? "text-white" : "text-gray-400"
                }`}
              >
                Tạo hợp đồng
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
