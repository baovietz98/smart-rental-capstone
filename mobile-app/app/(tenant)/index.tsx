import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

export default function TenantHome() {
  return (
    <View className="flex-1 bg-claude-bg p-6 pt-12">
      <Text className="text-gray-500 font-sans mb-1">Welcome home,</Text>
      <Text className="text-claude-text font-serif text-3xl font-bold mb-8">
        Nguyen Van A
      </Text>

      <View className="bg-white p-6 rounded-3xl shadow-sm border border-claude-border mb-6">
        <View className="flex-row items-center mb-4">
          <View className="bg-claude-accent p-2 rounded-lg mr-3">
            <FontAwesome5 name="key" size={16} color="white" />
          </View>
          <Text className="text-xl font-serif text-claude-text">Room 101</Text>
        </View>
        <Text className="text-gray-500 font-sans mb-4">
          Contract active until Dec 2024
        </Text>

        <View className="bg-green-50 p-4 rounded-xl border border-green-100 flex-row items-center">
          <FontAwesome5 name="check-circle" size={18} color="#15803D" />
          <Text className="text-green-800 font-bold font-sans ml-3">
            All Bills Paid
          </Text>
        </View>
      </View>

      <Text className="text-claude-text font-serif text-xl mb-4">Actions</Text>
      <TouchableOpacity className="bg-white p-4 rounded-xl border border-claude-border flex-row items-center shadow-sm">
        <View className="bg-red-50 p-3 rounded-lg mr-4">
          <FontAwesome5 name="tools" size={20} color="#DC2626" />
        </View>
        <View>
          <Text className="text-claude-text font-serif text-lg">
            Report Issue
          </Text>
          <Text className="text-gray-400 font-sans text-xs">
            Broken AC, Water leak...
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
