import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  SectionList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Controller, useForm } from "react-hook-form";
import { useState, useMemo } from "react";

export default function CreateIssueScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { roomId } = useLocalSearchParams();
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(
    roomId ? Number(roomId) : null,
  );

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | number>(
    "ALL",
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      priority: "NORMAL",
    },
  });

  const { data: rooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await api.get("/rooms?"); // Fetch all rooms
      return res.data;
    },
  });

  // Unique Buildings for Filter Tabs
  const uniqueBuildings = useMemo(() => {
    if (!rooms) return [];
    const map = new Map();
    rooms.forEach((r: any) => {
      if (r.building) {
        map.set(r.building.id, r.building.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rooms]);

  // Group rooms by Building
  const groupedRooms = useMemo(() => {
    if (!rooms) return [];

    let filtered = rooms;

    // 1. Filter by Building ID
    if (selectedBuildingId !== "ALL") {
      filtered = filtered.filter(
        (r: any) => r.building?.id === selectedBuildingId,
      );
    }

    // 2. Filter by search text
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (r: any) =>
          r.name.toLowerCase().includes(search) ||
          r.building?.name.toLowerCase().includes(search),
      );
    }

    // 3. Group by Building ID
    const groups: Record<string, any[]> = {};
    filtered.forEach((r: any) => {
      const buildingName = r.building?.name || "Khác";
      if (!groups[buildingName]) {
        groups[buildingName] = [];
      }
      groups[buildingName].push(r);
    });

    // 4. Convert to SectionList format
    return Object.keys(groups).map((buildingName) => ({
      title: buildingName,
      data: groups[buildingName],
    }));
  }, [rooms, searchText, selectedBuildingId]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post("/issues", {
        ...data,
        roomId: selectedRoomId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      Alert.alert("Thành công", "Đã gửi báo cáo sự cố", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      console.error(error);
      Alert.alert("Lỗi", "Không thể tạo sự cố");
    },
  });

  const onSubmit = (data: any) => {
    if (!selectedRoomId) {
      Alert.alert("Lỗi", "Vui lòng chọn phòng");
      return;
    }
    createMutation.mutate(data);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      {/* HEADER */}
      <View className="px-6 py-4 bg-white border-b border-gray-100 flex-row items-center gap-4">
        <TouchableOpacity
          className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
          onPress={() => router.back()}
        >
          <FontAwesome5 name="arrow-left" size={16} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 font-serif">
          Báo cáo sự cố
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 space-y-4">
          {/* Room Selection */}

          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Phòng
            </Text>

            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              className={`flex-row items-center justify-between p-4 rounded-xl border ${
                selectedRoomId
                  ? "bg-white border-[#DA7756]"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <View className="flex-1 mr-2">
                {selectedRoomId ? (
                  <View>
                    <Text className="text-sm font-bold text-[#DA7756] uppercase mb-1">
                      {
                        rooms?.find((r: any) => r.id === selectedRoomId)
                          ?.building?.name
                      }
                    </Text>
                    <Text className="text-lg font-bold text-gray-900">
                      {rooms?.find((r: any) => r.id === selectedRoomId)?.name}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-gray-400 font-medium">
                    Chọn phòng gặp sự cố...
                  </Text>
                )}
              </View>
              <FontAwesome5
                name="chevron-down"
                size={14}
                color={selectedRoomId ? "#DA7756" : "#9CA3AF"}
              />
            </TouchableOpacity>

            {!selectedRoomId && !roomId && (
              <Text className="text-red-500 text-xs mt-1 ml-1">
                Vui lòng chọn phòng
              </Text>
            )}
          </View>

          {/* Room Selection Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-white rounded-t-[32px] h-[85%]">
                <View className="p-6 border-b border-gray-100 flex-row justify-between items-center">
                  <Text className="text-xl font-bold text-gray-900">
                    Chọn phòng
                  </Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                  >
                    <FontAwesome5 name="times" size={14} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Search & Filters Container */}
                <View className="bg-white border-b border-gray-50 pb-2">
                  {/* Search */}
                  <View className="px-6 py-4">
                    <View className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center">
                      <FontAwesome5
                        name="search"
                        size={14}
                        color="#9CA3AF"
                        className="mr-3"
                      />
                      <TextInput
                        placeholder="Tìm kiếm phòng..."
                        className="flex-1 font-medium text-gray-900 ml-2"
                        value={searchText}
                        onChangeText={setSearchText}
                      />
                    </View>
                  </View>

                  {/* Building Tabs */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="px-6 mb-2"
                    contentContainerStyle={{ paddingRight: 24 }}
                  >
                    <TouchableOpacity
                      onPress={() => setSelectedBuildingId("ALL")}
                      className={`mr-3 px-4 py-2 rounded-xl border ${
                        selectedBuildingId === "ALL"
                          ? "bg-[#383838] border-[#383838]"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <Text
                        className={`font-bold text-xs ${
                          selectedBuildingId === "ALL"
                            ? "text-white"
                            : "text-gray-600"
                        }`}
                      >
                        Tất cả
                      </Text>
                    </TouchableOpacity>

                    {uniqueBuildings.map((b: any) => (
                      <TouchableOpacity
                        key={b.id}
                        onPress={() => setSelectedBuildingId(b.id)}
                        className={`mr-3 px-4 py-2 rounded-xl border ${
                          selectedBuildingId === b.id
                            ? "bg-[#383838] border-[#383838]"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <Text
                          className={`font-bold text-xs ${
                            selectedBuildingId === b.id
                              ? "text-white"
                              : "text-gray-600"
                          }`}
                        >
                          {b.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <SectionList
                  sections={groupedRooms}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={{ padding: 24, paddingBottom: 50 }}
                  stickySectionHeadersEnabled={false}
                  renderSectionHeader={({ section: { title } }) => (
                    <View className="mt-4 mb-3">
                      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {title}
                      </Text>
                    </View>
                  )}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedRoomId(item.id);
                        setModalVisible(false);
                      }}
                      className={`p-4 mb-3 rounded-xl border flex-row justify-between items-center ${
                        selectedRoomId === item.id
                          ? "bg-[#DA7756] border-[#DA7756]"
                          : "bg-white border-gray-100"
                      }`}
                    >
                      <View>
                        <Text
                          className={`font-bold text-base ${
                            selectedRoomId === item.id
                              ? "text-white"
                              : "text-gray-900"
                          }`}
                        >
                          {item.name}
                        </Text>
                        <Text
                          className={`text-xs mt-0.5 ${
                            selectedRoomId === item.id
                              ? "text-white/80"
                              : "text-gray-400"
                          }`}
                        >
                          {item.floor
                            ? `Tầng ${item.floor}`
                            : "Chưa cập nhật tầng"}
                        </Text>
                      </View>
                      {selectedRoomId === item.id && (
                        <FontAwesome5 name="check" size={14} color="white" />
                      )}
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View className="items-center py-10">
                      <Text className="text-gray-400">
                        Không tìm thấy phòng nào phù hợp.
                      </Text>
                    </View>
                  }
                />
              </View>
            </View>
          </Modal>

          {/* Title */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Tiêu đề
            </Text>
            <Controller
              control={control}
              name="title"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                  placeholder="VD: Hỏng bóng đèn..."
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.title && (
              <Text className="text-red-500 text-xs mt-1">
                Vui lòng nhập tiêu đề
              </Text>
            )}
          </View>

          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Chi tiết
            </Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900"
                  placeholder="Mô tả cụ thể vấn đề..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={{ minHeight: 100 }}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
          </View>

          {/* Priority */}
          <View>
            <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
              Mức độ ưu tiên
            </Text>
            <Controller
              control={control}
              name="priority"
              defaultValue="NORMAL"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row gap-2">
                  {[
                    {
                      id: "LOW",
                      label: "Thấp",
                      bg: "bg-gray-100",
                      text: "text-gray-600",
                    },
                    {
                      id: "NORMAL",
                      label: "Bình thường",
                      bg: "bg-blue-50",
                      text: "text-blue-600",
                    },
                    {
                      id: "HIGH",
                      label: "Cao",
                      bg: "bg-orange-50",
                      text: "text-orange-600",
                    },
                    {
                      id: "URGENT",
                      label: "Khẩn cấp",
                      bg: "bg-red-50",
                      text: "text-red-600",
                    },
                  ].map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => onChange(p.id)}
                      className={`flex-1 py-3 rounded-xl items-center border ${
                        value === p.id
                          ? `border-${p.text.split("-")[1]}-500 ${p.bg}`
                          : "border-gray-100 bg-white"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          value === p.id ? p.text : "text-gray-400"
                        }`}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>
        </View>

        <TouchableOpacity
          className="bg-[#DA7756] p-4 rounded-xl mt-6 items-center shadow-lg shadow-orange-200"
          onPress={handleSubmit(onSubmit)}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Gửi báo cáo</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
