import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5, Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/vi";

dayjs.extend(customParseFormat);
dayjs.locale("vi");

export default function BuildingReadingsScreen() {
  const router = useRouter();
  const { buildingId, name } = useLocalSearchParams();
  const queryClient = useQueryClient();

  // State for Month Selection
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("MM-YYYY"));

  // State for Input Data: { [contractId_serviceId]: newIndex }
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  // 1. Fetch Prepare Data
  const {
    data: rooms,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["readings-prepare", buildingId, selectedMonth],
    queryFn: async () => {
      const res = await api.get("/readings/prepare-bulk", {
        params: { buildingId, month: selectedMonth },
      });
      return res.data;
    },
    enabled: !!buildingId,
  });

  // Pre-fill existing readings if available
  useEffect(() => {
    if (rooms) {
      const newInputs: Record<string, string> = {};
      rooms.forEach((room: any) => {
        room.services.forEach((service: any) => {
          if (service.newIndex !== null) {
            newInputs[`${room.contractId}_${service.serviceId}`] =
              service.newIndex.toString();
          }
        });
      });
      setInputValues(newInputs);
    }
  }, [rooms]);

  // 2. Submit Mutation
  const bulkCreateMutation = useMutation({
    mutationFn: async (payload: any) => {
      // Send payload directly as array based on backend expectation
      await api.post("/readings/bulk", payload, {
        params: { month: selectedMonth },
      });
    },
    onSuccess: () => {
      Alert.alert("Thành công", "Đã lưu chỉ số điện nước");
      queryClient.invalidateQueries({ queryKey: ["readings-prepare"] });
      // Optionally navigate back or stay
    },
    onError: (error: any) => {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message ||
          "Không thể lưu dữ liệu. Vui lòng kiểm tra lại kết nối.",
      );
    },
  });

  const handleSave = () => {
    // Transform inputs to payload
    const readings: any[] = [];

    rooms?.forEach((room: any) => {
      room.services.forEach((service: any) => {
        const key = `${room.contractId}_${service.serviceId}`;
        const val = inputValues[key];

        // Only submit if value is present and valid
        if (val && !isNaN(Number(val))) {
          readings.push({
            contractId: room.contractId,
            serviceId: service.serviceId,
            newIndex: Number(val),
            oldIndex: service.oldIndex,
          });
        }
      });
    });

    if (readings.length === 0) {
      Alert.alert("Thông báo", "Chưa có dữ liệu nào được nhập");
      return;
    }

    // Send the array directly, NOT wrapped in object
    bulkCreateMutation.mutate(readings);
  };

  const changeMonth = (delta: number) => {
    const current = dayjs(selectedMonth, "MM-YYYY");
    const newDate = current.add(delta, "month");
    setSelectedMonth(newDate.format("MM-YYYY"));
    setInputValues({}); // Reset inputs when changing month
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER */}
      <View className="bg-white border-b border-gray-100 shadow-sm z-10">
        <View className="px-6 py-4 flex-row justify-between items-center">
          <TouchableOpacity
            className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
            onPress={() => router.back()}
          >
            <FontAwesome5 name="arrow-left" size={16} color="#374151" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-lg font-bold text-gray-900 font-serif text-center">
              {name || "Chốt số liệu"}
            </Text>
            <Text className="text-xs text-gray-500 text-center font-medium uppercase tracking-wider">
              {dayjs(selectedMonth, "MM-YYYY").format("Tháng MM, YYYY")}
            </Text>
          </View>
          <TouchableOpacity
            className={`w-10 h-10 rounded-full items-center justify-center shadow-md ${
              bulkCreateMutation.isPending ||
              Object.keys(inputValues).length === 0
                ? "bg-gray-300"
                : "bg-[#DA7756] shadow-orange-200"
            }`}
            onPress={handleSave}
            disabled={
              bulkCreateMutation.isPending ||
              Object.keys(inputValues).length === 0
            }
          >
            {bulkCreateMutation.isPending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <FontAwesome5 name="check" size={16} color="white" />
            )}
          </TouchableOpacity>
        </View>

        {/* Month Selector */}
        <View className="flex-row justify-center items-center pb-4 gap-6">
          <TouchableOpacity
            onPress={() => changeMonth(-1)}
            className="p-2 w-10 h-10 items-center justify-center rounded-full active:bg-gray-100"
          >
            <Feather name="chevron-left" size={24} color="#6B7280" />
          </TouchableOpacity>
          <View className="bg-white border border-gray-200 px-6 py-2 rounded-full shadow-sm">
            <Text className="font-bold text-gray-800 text-base">
              {selectedMonth}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => changeMonth(1)}
            className="p-2 w-10 h-10 items-center justify-center rounded-full active:bg-gray-100"
          >
            <Feather name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#DA7756" className="mt-10" />
          ) : rooms?.length === 0 ? (
            <View className="items-center justify-center py-10">
              <FontAwesome5 name="clipboard-check" size={48} color="#D1D5DB" />
              <Text className="text-center text-gray-500 mt-4">
                Không có phòng nào cần chốt số trong tháng này, hoặc chưa có hợp
                đồng.
              </Text>
            </View>
          ) : (
            <View className="pb-24">
              {rooms?.map((room: any) => {
                const isFullyEntered = room.services.every(
                  (s: any) => inputValues[`${room.contractId}_${s.serviceId}`],
                );

                return (
                  <View
                    key={room.roomId}
                    className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 mb-4"
                  >
                    {/* Room Header */}
                    <View className="flex-row items-center justify-between mb-2 pb-3 border-b border-gray-50">
                      <View className="flex-row items-center gap-3">
                        <View
                          className={`w-10 h-10 rounded-full items-center justify-center ${
                            isFullyEntered ? "bg-green-50" : "bg-blue-50"
                          }`}
                        >
                          <FontAwesome5
                            name={isFullyEntered ? "check" : "door-open"}
                            size={14}
                            color={isFullyEntered ? "#10B981" : "#3B82F6"}
                          />
                        </View>
                        <View>
                          <Text className="text-base font-bold text-gray-900">
                            {room.roomName}
                          </Text>
                          <Text className="text-[10px] text-gray-400 font-medium">
                            {room.services.length} Dịch vụ
                          </Text>
                        </View>
                      </View>

                      <View
                        className={`px-3 py-1 rounded-full ${
                          isFullyEntered ? "bg-green-100" : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${
                            isFullyEntered ? "text-green-700" : "text-gray-500"
                          }`}
                        >
                          {isFullyEntered ? "HOÀN TẤT" : "CHƯA ĐỦ"}
                        </Text>
                      </View>
                    </View>

                    {/* Services List - Direct Mapping */}
                    {room.services.map((service: any, index: number) => {
                      const key = `${room.contractId}_${service.serviceId}`;
                      const val = inputValues[key] || "";
                      const old = service.oldIndex;
                      const current = parseInt(val) || 0;
                      const usage = val ? current - old : 0;
                      const isValid = !val || current >= old;

                      const isElectric = service.serviceName
                        .toLowerCase()
                        .includes("điện");
                      const iconName = isElectric ? "bolt" : "tint";
                      const iconColor = isElectric ? "#F59E0B" : "#3B82F6";
                      const unit =
                        service.serviceUnit || (isElectric ? "kWh" : "m3");

                      return (
                        <View
                          key={service.serviceId}
                          className={`flex-row items-start gap-3 ${
                            index > 0
                              ? "mt-4 pt-4 border-t border-dashed border-gray-100"
                              : "mt-2"
                          }`}
                        >
                          {/* Icon */}
                          <View className="w-10 items-center justify-center pt-2">
                            <View
                              className="w-8 h-8 rounded-full items-center justify-center"
                              style={{ backgroundColor: `${iconColor}15` }}
                            >
                              <FontAwesome5
                                name={iconName}
                                size={12}
                                color={iconColor}
                              />
                            </View>
                          </View>

                          {/* Inputs */}
                          <View className="flex-1">
                            <View className="flex-row justify-between mb-1">
                              <Text className="text-[10px] text-gray-400 font-medium uppercase">
                                {service.serviceName}
                              </Text>
                              <Text className="text-[10px] text-gray-400">
                                Cũ:{" "}
                                <Text className="font-bold text-gray-600">
                                  {old}
                                </Text>
                                {" / "}
                                <Text className="font-bold text-gray-600">
                                  Mới (Chỉ số)
                                </Text>
                              </Text>
                            </View>

                            <View
                              className={`flex-row items-center bg-gray-50 border ${
                                isValid ? "border-gray-200" : "border-red-300"
                              } rounded-xl px-3 h-12`}
                            >
                              <TextInput
                                className="flex-1 font-bold text-gray-900 text-lg text-center"
                                keyboardType="numeric"
                                placeholder="0"
                                value={val}
                                onChangeText={(text) =>
                                  setInputValues((prev) => ({
                                    ...prev,
                                    [key]: text,
                                  }))
                                }
                                selectTextOnFocus
                              />
                              <Text className="text-gray-400 text-xs font-medium ml-2 w-8 text-right">
                                {unit}
                              </Text>
                            </View>
                            {!isValid && val ? (
                              <Text className="text-red-500 text-[10px] mt-1 font-medium bg-red-50 self-start px-2 py-0.5 rounded">
                                Chỉ số mới phải {">="} chỉ số cũ ({old})
                              </Text>
                            ) : null}
                          </View>

                          {/* Usage */}
                          <View className="w-14 items-end justify-center pt-4">
                            <Text className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                              Dùng
                            </Text>
                            <View
                              className={`px-2 py-1 rounded-lg ${
                                usage > 0 ? "bg-gray-100" : "bg-gray-50"
                              }`}
                            >
                              <Text
                                className={`font-black text-sm ${
                                  usage > 0 ? "text-gray-900" : "text-gray-300"
                                }`}
                              >
                                {usage > 0 ? usage : "-"}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
