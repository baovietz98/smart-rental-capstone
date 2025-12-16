import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";

export default function BillDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Hóa đơn phòng 101 tháng 12: 3.500.000đ. Đã bao gồm điện nước. Vui lòng thanh toán trước ngày 05/12. Chi tiết tại app.`,
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  return (
    <View className="flex-1 bg-claude-bg">
      <ScrollView className="flex-1 p-6">
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-claude-border mb-6">
          <Text className="text-center text-gray-400 font-sans mb-2">
            Total Amount
          </Text>
          <Text className="text-center text-4xl font-serif text-claude-text font-bold mb-6">
            3.500.000 ₫
          </Text>

          <View className="border-t border-gray-100 py-4 space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-claude-text font-sans">
                Room Charge (P.101)
              </Text>
              <Text className="text-claude-text font-sans font-medium">
                3.000.000 ₫
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-claude-text font-sans">
                Electricity (120kWh)
              </Text>
              <Text className="text-claude-text font-sans font-medium">
                420.000 ₫
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-claude-text font-sans">Water (4m3)</Text>
              <Text className="text-claude-text font-sans font-medium">
                80.000 ₫
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          className="bg-[#0068FF] p-4 rounded-xl flex-row justify-between items-center shadow-sm mb-4"
          onPress={handleShare}
        >
          <Text className="text-white font-bold font-sans text-lg">
            Send via Zalo
          </Text>
          <FontAwesome5 name="paper-plane" size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity className="bg-white border border-claude-border p-4 rounded-xl items-center mb-10">
          <Text className="text-claude-text font-sans font-medium">
            Mark as Paid
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
