import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useForm } from "react-hook-form";

export default function NewBill() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Date selection
  const [date, setDate] = useState(new Date());

  // Modal visibility
  const [buildingModalVisible, setBuildingModalVisible] = useState(false);
  const [roomModalVisible, setRoomModalVisible] = useState(false);

  // Fetch Buildings
  const { data: buildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: async () => {
      const res = await api.get("/buildings");
      return res.data;
    },
  });

  // Fetch Rooms (when building is selected)
  const { data: rooms, isLoading: isLoadingRooms } = useQuery({
    queryKey: ["rooms", selectedBuilding?.id],
    queryFn: async () => {
      if (!selectedBuilding) return [];
      const res = await api.get(`/rooms/by-building/${selectedBuilding.id}`);
      return res.data;
    },
    enabled: !!selectedBuilding,
  });

  // Form handling
  const { handleSubmit, setValue } = useForm({
    defaultValues: {
      contractId: "",
      month: `${String(new Date().getMonth() + 1).padStart(2, "0")}-${new Date().getFullYear()}`,
    },
  });
  const [readingsInput, setReadingsInput] = useState<any>({});

  // Fetch Services (Index type)
  const { data: services } = useQuery({
    queryKey: ["services", "INDEX"],
    queryFn: async () => {
      const res = await api.get("/services");
      return res.data.filter((s: any) => s.type === "INDEX" && s.isActive);
    },
  });

  // Helper to get active contract
  const activeContract =
    selectedRoom?.contracts?.find((c: any) => c.isActive) ||
    selectedRoom?.contracts?.[0];

  // Fetch prepared readings when room/month changes
  useQuery({
    queryKey: ["readings-prepare", selectedRoom?.id, date],
    queryFn: async () => {
      if (!selectedRoom || !services || !activeContract) return null;

      const monthStr = getMonthString(date);
      const newInputs: any = {};

      await Promise.all(
        services.map(async (s: any) => {
          try {
            // Check if already has reading
            const res = await api.get("/readings/prepare", {
              params: {
                contractId: activeContract.id,
                serviceId: s.id,
                month: monthStr,
              },
            });

            if (res.data.existingReading) {
              newInputs[s.id] = {
                ...res.data,
                isLocked: true, // Already recorded
                isBilled: res.data.isBilled, // <--- Capture this
                newIndex: res.data.existingReading.newIndex,
              };
            } else {
              newInputs[s.id] = {
                ...res.data,
                isLocked: false,
                oldIndex: res.data.oldIndex,
                newIndex: "", // Empty for user input
              };
            }
          } catch (e) {
            console.log("Error preparing reading", e);
          }
        }),
      );
      setReadingsInput(newInputs);
      return newInputs;
    },
    enabled: !!selectedRoom && !!services && !!activeContract,
  });

  // Format month string MM-YYYY
  const getMonthString = (d: Date) => {
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setValue("month", getMonthString(selectedDate));
      // Reset preview when date changes
      setPreviewData(null);
    }
  };

  // Check for existing invoices
  const { data: existingInvoices } = useQuery({
    queryKey: ["invoices", "existing", activeContract?.id, date],
    queryFn: async () => {
      if (!activeContract?.id) return [];
      console.log("Checking existing invoices for:", {
        contractId: activeContract.id,
        month: getMonthString(date),
      });
      const res = await api.get("/invoices", {
        params: {
          contractId: activeContract.id,
          month: getMonthString(date),
        },
      });
      console.log("Found existing invoices:", res.data);
      return res.data;
    },
    enabled: !!activeContract?.id,
  });

  const existingInvoice =
    existingInvoices && existingInvoices.length > 0
      ? existingInvoices[0]
      : null;

  // Function to handle reading input change
  const handleReadingChange = (serviceId: number, value: string) => {
    setReadingsInput((prev: any) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        newIndex: value,
      },
    }));
    // Reset preview if readings change
    setPreviewData(null);
  };

  // Preview Invoice Mutation
  const previewMutation = useMutation({
    mutationFn: async (data: any) => {
      const activeContract =
        selectedRoom?.contracts?.find((c: any) => c.isActive) ||
        selectedRoom?.contracts?.[0];

      if (!activeContract?.id) {
        throw new Error(
          "Phòng này chưa có hợp đồng hoặc không tìm thấy hợp đồng.",
        );
      }

      return api.post("/invoices/preview", {
        contractId: activeContract.id,
        month: data.month,
      });
    },
    onSuccess: (res) => {
      setPreviewData(res.data);
    },
    onError: (err: any) => {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message ||
          err.message ||
          "Không thể xem trước hóa đơn",
      );
    },
  });

  // Create Invoice Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!previewData) return;
      const activeContract =
        selectedRoom?.contracts?.find((c: any) => c.isActive) ||
        selectedRoom?.contracts?.[0];

      return api.post("/invoices/generate", {
        contractId: activeContract.id,
        month: getMonthString(date),
        lineItems: previewData.lineItems, // Pass the previewed items
      });
    },
    onSuccess: () => {
      Alert.alert("Thành công", "Đã tạo hóa đơn nháp thành công", [
        {
          text: "OK",
          onPress: () => {
            queryClient.invalidateQueries({ queryKey: ["bills"] });
            router.back();
          },
        },
      ]);
    },
    onError: (err: any) => {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || err.message || "Không thể tạo hóa đơn",
      );
    },
  });

  const onPreview = async () => {
    // 1. Validation
    if (!selectedRoom) {
      Alert.alert("Lỗi", "Vui lòng chọn phòng");
      return;
    }
    const activeContract =
      selectedRoom?.contracts?.find((c: any) => c.isActive) ||
      selectedRoom?.contracts?.[0];
    if (!activeContract) {
      Alert.alert("Lỗi", "Phòng này chưa có hợp đồng");
      return;
    }

    // 2. Check if we need to save readings first
    const readingsToSave = [];
    for (const serviceId in readingsInput) {
      const input = readingsInput[serviceId];
      if (!input.isLocked && input.newIndex) {
        const newIdx = parseInt(input.newIndex);
        const oldIdx = input.oldIndex;

        if (isNaN(newIdx)) {
          Alert.alert(
            "Lỗi",
            `Chỉ số mới của ${input.serviceName} không hợp lệ`,
          );
          return;
        }
        if (newIdx < oldIdx) {
          Alert.alert(
            "Lỗi",
            `Chỉ số mới của ${input.serviceName} phải lớn hơn hoặc bằng chỉ số cũ (${oldIdx})`,
          );
          return;
        }

        readingsToSave.push({
          contractId: activeContract.id,
          serviceId: parseInt(serviceId),
          newIndex: newIdx,
          oldIndex: oldIdx,
          isMeterReset: false,
        });
      }
    }

    try {
      if (readingsToSave.length > 0) {
        // Call Bulk Create API
        await api.post(
          `/readings/bulk?month=${getMonthString(date)}`,
          readingsToSave,
        );
      }

      // 3. Proceed to Preview Invoice
      handleSubmit((data) => previewMutation.mutate(data))();
    } catch (err: any) {
      Alert.alert("Lỗi lưu chỉ số", err.response?.data?.message || err.message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount || 0) + " đ";
  };

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <SafeAreaView
        edges={["top"]}
        className="bg-white border-b border-gray-100"
      >
        <View className="px-4 py-3 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 bg-gray-50 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">
            Tạo hóa đơn mới
          </Text>
          <View className="w-10" />
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
      >
        {/* Step 1: Select Building */}
        <View className="mb-5">
          <Text className="text-gray-700 font-bold mb-2">1. Chọn Tòa nhà</Text>
          <TouchableOpacity
            onPress={() => setBuildingModalVisible(true)}
            className="bg-white p-4 rounded-xl border border-gray-200 flex-row justify-between items-center"
          >
            <Text
              className={
                selectedBuilding ? "text-gray-900 font-medium" : "text-gray-400"
              }
            >
              {selectedBuilding?.name || "Chọn tòa nhà..."}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Step 2: Select Room */}
        <View className="mb-5">
          <Text className="text-gray-700 font-bold mb-2">2. Chọn Phòng</Text>
          <TouchableOpacity
            onPress={() => {
              if (!selectedBuilding) {
                Alert.alert("Nhắc nhở", "Vui lòng chọn tòa nhà trước");
                return;
              }
              setRoomModalVisible(true);
            }}
            disabled={!selectedBuilding}
            className="bg-white p-4 rounded-xl border border-gray-200 flex-row justify-between items-center"
            style={!selectedBuilding ? { opacity: 0.5 } : undefined}
          >
            <Text
              className={
                selectedRoom ? "text-gray-900 font-medium" : "text-gray-400"
              }
            >
              {selectedRoom ? `Phòng ${selectedRoom.name}` : "Chọn phòng..."}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          {selectedRoom &&
            (!selectedRoom.contracts ||
              selectedRoom.contracts.length === 0) && (
              <Text className="text-red-500 text-xs mt-1 italic">
                * Phòng này hiện chưa có hợp đồng
              </Text>
            )}
        </View>

        {/* Step 3: Select Month */}
        <View className="mb-6">
          <Text className="text-gray-700 font-bold mb-2">3. Chọn Tháng</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="bg-white p-4 rounded-xl border border-gray-200 flex-row justify-between items-center"
          >
            <Text className="text-gray-900 font-medium">
              Tháng {getMonthString(date)}
            </Text>
            <MaterialCommunityIcons
              name="calendar-month"
              size={20}
              color="#DA7756"
            />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()} // Can generate for current or past
            />
          )}
        </View>

        {/* READINGS INPUT SECTION */}
        {/* 4. Nội dung chính (Hoặc cảnh báo nếu đã có hóa đơn) */}
        {existingInvoice ? (
          <View className="mx-4 mt-4 bg-orange-50 p-4 rounded-xl border border-orange-200">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="info-outline" size={24} color="#f97316" />
              <Text className="ml-2 font-bold text-orange-700 text-lg">
                Đã có hóa đơn
              </Text>
            </View>
            <Text className="text-gray-600 mb-4">
              Phòng {selectedRoom?.name} đã được lập hóa đơn cho tháng{" "}
              {getMonthString(date)}.
            </Text>

            <View className="bg-white p-3 rounded-lg mb-4 border border-orange-100">
              <Text className="font-semibold text-gray-800">
                Hóa đơn #{existingInvoice.id}
              </Text>
              <Text className="text-gray-600">
                Tổng tiền: {existingInvoice.totalAmount?.toLocaleString()} đ
              </Text>
              <Text className="text-gray-600">
                Trạng thái: {existingInvoice.status}
              </Text>
            </View>

            <TouchableOpacity
              className="bg-orange-500 py-3 rounded-lg items-center"
              onPress={() =>
                router.push(`/(admin)/bills/${existingInvoice.id}`)
              }
            >
              <Text className="text-white font-bold">Xem chi tiết hóa đơn</Text>
            </TouchableOpacity>
          </View>
        ) : (
          selectedRoom &&
          services &&
          services.length > 0 && (
            <View className="mb-6">
              <Text className="text-gray-700 font-bold mb-2">
                4. Chỉ số Điện / Nước
              </Text>
              <View className="bg-white p-4 rounded-xl border border-gray-200">
                {services.map((s: any) => {
                  const input = readingsInput[s.id];
                  if (!input)
                    return <ActivityIndicator key={s.id} size="small" />;

                  return (
                    <View key={s.id} className="mb-4 last:mb-0">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="font-semibold text-gray-800">
                          {s.name}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          Đơn giá: {formatCurrency(s.price)}/{s.unit}
                        </Text>
                      </View>

                      <View className="flex-row gap-3">
                        <View className="flex-1">
                          <Text className="text-[10px] text-gray-500 mb-1 font-bold uppercase">
                            Số cũ
                          </Text>
                          <View className="bg-gray-100 p-3 rounded-lg">
                            <Text className="text-gray-600 font-bold">
                              {input.oldIndex}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-1">
                          <Text className="text-[10px] text-[#DA7756] mb-1 font-bold uppercase">
                            Số mới
                          </Text>
                          <TouchableOpacity
                            disabled={input.isLocked}
                            className={`border rounded-lg p-2 ${input.isLocked ? "bg-gray-50 border-gray-200" : "bg-white border-[#DA7756]"}`}
                          >
                            {input.isLocked ? (
                              <Text className="text-gray-800 font-bold p-1">
                                {input.newIndex}
                              </Text>
                            ) : (
                              <TextInput
                                value={input.newIndex?.toString()}
                                onChangeText={(txt) =>
                                  handleReadingChange(s.id, txt)
                                }
                                keyboardType="numeric"
                                className="font-bold text-gray-900 text-base p-0"
                                placeholder="0"
                              />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                      {input.isLocked && (
                        <Text className="text-[10px] text-green-600 mt-1 font-bold italic">
                          * Đã chốt số
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )
        )}

        {/* PREVIEW BUTTON */}
        {!existingInvoice && !previewData && (
          <TouchableOpacity
            onPress={onPreview}
            disabled={
              !selectedRoom ||
              !selectedRoom.contracts?.length ||
              previewMutation.isPending
            }
            className={`py-4 rounded-xl items-center mb-10 ${
              !selectedRoom || !selectedRoom.contracts?.length
                ? "bg-gray-300"
                : "bg-[#383838]"
            }`}
          >
            {previewMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">
                Xem trước (Preview)
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* PREVIEW RESULT */}
        {previewData && (
          <View className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-10">
            <View className="flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <Text className="font-bold text-gray-900">Chi tiết hóa đơn</Text>
              <TouchableOpacity onPress={() => setPreviewData(null)}>
                <Text className="text-[#DA7756] text-xs font-bold">
                  Tính lại
                </Text>
              </TouchableOpacity>
            </View>

            {previewData.lineItems?.map((item: any, idx: number) => (
              <View key={idx} className="flex-row justify-between py-2">
                <View className="flex-1">
                  <Text className="text-gray-700 text-sm font-medium">
                    {item.name}
                  </Text>
                  <Text className="text-gray-400 text-xs">
                    {item.quantity > 1
                      ? `${item.quantity} x ${formatCurrency(item.unitPrice)}`
                      : ""}
                    {item.note ? ` (${item.note})` : ""}
                  </Text>
                </View>
                <Text className="text-gray-900 font-bold text-sm">
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            ))}

            <View className="mt-2 pt-2 border-t border-gray-100 flex-row justify-between items-center">
              <Text className="font-bold text-gray-900 text-base">
                Tổng cộng
              </Text>
              <Text className="font-bold text-[#DA7756] text-xl">
                {formatCurrency(previewData.totalAmount)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="mt-6 bg-[#DA7756] py-3 rounded-xl items-center"
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Xác nhận tạo hóa đơn
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Building Selection Modal */}
      <Modal visible={buildingModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 h-2/3">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Chọn tòa nhà
            </Text>
            <ScrollView>
              {buildings?.map((b: any) => (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => {
                    setSelectedBuilding(b);
                    setSelectedRoom(null); // Reset room
                    setBuildingModalVisible(false);
                  }}
                  className="p-4 border-b border-gray-100"
                >
                  <Text className="text-base text-gray-800 font-medium">
                    {b.name}
                  </Text>
                  <Text className="text-xs text-gray-500">{b.address}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setBuildingModalVisible(false)}
              className="mt-4 py-3 bg-gray-100 rounded-xl items-center"
            >
              <Text className="font-bold text-gray-600">Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Room Selection Modal */}
      <Modal visible={roomModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 h-2/3">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Chọn phòng
            </Text>
            {isLoadingRooms ? (
              <ActivityIndicator color="#DA7756" />
            ) : (
              <ScrollView>
                {rooms?.map((r: any) => (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => {
                      setSelectedRoom(r);
                      setRoomModalVisible(false);
                      // Reset preview
                      setPreviewData(null);
                    }}
                    className="p-4 border-b border-gray-100 flex-row justify-between items-center"
                  >
                    <View>
                      <Text className="text-base text-gray-800 font-medium">
                        Phòng {r.name}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Giá: {formatCurrency(r.price)}
                      </Text>
                    </View>
                    {r.contracts && r.contracts.length > 0 ? (
                      <View className="bg-green-100 px-2 py-1 rounded">
                        <Text className="text-green-700 text-[10px] font-bold">
                          ĐÃ THUÊ
                        </Text>
                      </View>
                    ) : (
                      <View className="bg-gray-100 px-2 py-1 rounded">
                        <Text className="text-gray-500 text-[10px] font-bold">
                          TRỐNG
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity
              onPress={() => setRoomModalVisible(false)}
              className="mt-4 py-3 bg-gray-100 rounded-xl items-center"
            >
              <Text className="font-bold text-gray-600">Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
