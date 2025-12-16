import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { FontAwesome5 } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { mutationQueue } from "@/lib/mutation-queue";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function PatrolScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);

  const [reading, setReading] = useState({ electric: "", water: "" });
  const electricInputRef = useRef<TextInput>(null);

  // Fetch Old Index from Backend
  const currentMonth = "12-2023"; // Should be dynamic
  const { data: oldIndex, isLoading } = useQuery({
    queryKey: ["prepare-reading", roomId, currentMonth],
    queryFn: async () => {
      // In real app, we need contractId + serviceId.
      // For demo, we might need a simpler endpoint or logic to find active contract first.
      // Assuming backend has a helper or we fetch room details first.

      // Workaround for demo: Fetch Room Detail -> Get Active Contract -> Get Prepare Data
      const roomRes = await api.get(`/rooms/${roomId}`);
      const contract = roomRes.data.activeContract;

      if (!contract) return { electric: 0, water: 0 }; // No contract

      // Fetch prepare data for Electric (Service Type INDEX)
      // Simplified: Just returning mock from this function for safety if backend is complex
      // But trying to hit real API:
      // const res = await api.get('/readings/prepare', { params: { contractId: contract.id, serviceId: ..., month: currentMonth } })

      // Fallback to mock for stability during demo if IDs missing
      return { electric: 1250, water: 45 };
    },
  });

  // Auto-focus on mount
  useEffect(() => {
    setTimeout(() => {
      electricInputRef.current?.focus();
    }, 500);
  }, []);

  const toggleTorch = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Permission Required",
          "Camera permission is needed for flashlight"
        );
        return;
      }
    }
    setTorch(!torch);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNext = async () => {
    if (!reading.electric || !reading.water) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Missing Data", "Please enter both readings.");
      return;
    }

    if (Number(reading.electric) < oldIndex.electric) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Anomaly Detected",
        "New Electric Index is lower than Old Index. Is the meter reset?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Confirm Reset",
            style: "destructive",
            onPress: () => processSave(),
          },
        ]
      );
      return;
    }
    processSave();
  };

  const processSave = async () => {
    await mutationQueue.addMutation({
      type: "SUBMIT_READING",
      payload: {
        roomId,
        electric: Number(reading.electric),
        water: Number(reading.water),
        date: new Date().toISOString(),
      },
    });

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Simulate navigation to next room (Mock logic)
    const nextRoomId = String(Number(roomId) + 1);

    // In real app: router.replace or push next
    Alert.alert("Saved to Queue", `Room ${roomId} readings saved locally.`, [
      { text: "Next Room", onPress: () => router.back() },
    ]);
  };

  return (
    <View className="flex-1 bg-claude-bg">
      {torch && (
        <CameraView
          style={{ height: 1, width: 1, position: "absolute" }}
          enableTorch={true}
          facing="back"
        />
      )}

      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-claude-accent font-sans text-lg">Close</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleTorch}
            className={`p-3 rounded-full ${
              torch ? "bg-amber-400" : "bg-gray-200"
            }`}
          >
            <FontAwesome5
              name="lightbulb"
              size={20}
              color={torch ? "white" : "gray"}
            />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView className="px-6">
            <Text className="text-4xl font-serif text-claude-text text-center mt-4">
              Room {roomId?.slice(-4) || "101"}
            </Text>
            <Text className="text-center text-gray-400 font-sans mb-10">
              S Home - Cau Giay
            </Text>

            {/* Electric Card */}
            <View className="bg-white p-6 rounded-3xl shadow-sm border border-claude-border mb-6">
              <View className="flex-row items-center mb-4">
                <View className="bg-yellow-100 p-2 rounded-lg mr-3">
                  <FontAwesome5 name="bolt" size={20} color="#DA7756" />
                </View>
                <Text className="text-xl font-serif text-claude-text">
                  Electricity
                </Text>
              </View>
              <View className="flex-row justify-between items-end">
                <View>
                  <Text className="text-gray-400 font-sans text-sm">
                    Old Index
                  </Text>
                  <Text className="text-2xl font-sans text-gray-600 font-medium">
                    {oldIndex.electric}
                  </Text>
                </View>
                <View className="flex-1 ml-6">
                  <Text className="text-claude-accent font-sans text-sm mb-1 font-bold">
                    New Index
                  </Text>
                  <TextInput
                    ref={electricInputRef}
                    className="bg-gray-50 text-3xl font-sans p-3 rounded-xl border border-claude-border text-right text-claude-text"
                    keyboardType="numeric"
                    placeholder="0"
                    value={reading.electric}
                    onChangeText={(t) =>
                      setReading({ ...reading, electric: t })
                    }
                  />
                </View>
              </View>
            </View>

            {/* Water Card */}
            <View className="bg-white p-6 rounded-3xl shadow-sm border border-claude-border mb-8">
              <View className="flex-row items-center mb-4">
                <View className="bg-blue-100 p-2 rounded-lg mr-3">
                  <FontAwesome5 name="tint" size={20} color="#3B82F6" />
                </View>
                <Text className="text-xl font-serif text-claude-text">
                  Water
                </Text>
              </View>
              <View className="flex-row justify-between items-end">
                <View>
                  <Text className="text-gray-400 font-sans text-sm">
                    Old Index
                  </Text>
                  <Text className="text-2xl font-sans text-gray-600 font-medium">
                    {oldIndex.water}
                  </Text>
                </View>
                <View className="flex-1 ml-6">
                  <Text className="text-claude-accent font-sans text-sm mb-1 font-bold">
                    New Index
                  </Text>
                  <TextInput
                    className="bg-gray-50 text-3xl font-sans p-3 rounded-xl border border-claude-border text-right text-claude-text"
                    keyboardType="numeric"
                    placeholder="0"
                    value={reading.water}
                    onChangeText={(t) => setReading({ ...reading, water: t })}
                  />
                </View>
              </View>
            </View>

            {/* Next Button */}
            <TouchableOpacity
              className="bg-claude-accent p-5 rounded-2xl shadow-lg active:opacity-90 flex-row justify-center items-center mb-10"
              onPress={handleNext}
            >
              <Text className="text-white font-sans font-bold text-xl mr-2">
                Save & Next Room
              </Text>
              <FontAwesome5 name="arrow-right" size={18} color="white" />
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
