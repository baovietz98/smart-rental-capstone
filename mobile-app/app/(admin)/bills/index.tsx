import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";

const INVOICES = [
  {
    id: "BIO-101-12",
    room: "101",
    amount: 3500000,
    status: "UNPAID",
    dueDate: "2023-12-05",
  },
  {
    id: "BIO-102-12",
    room: "102",
    amount: 4200000,
    status: "OVERDUE",
    dueDate: "2023-12-01",
  },
  {
    id: "BIO-201-12",
    room: "201",
    amount: 3100000,
    status: "PAID",
    dueDate: "2023-12-05",
  },
];

export default function BillList() {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-700";
      case "OVERDUE":
        return "bg-red-100 text-red-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <View className="flex-1 bg-claude-bg p-4">
      <FlatList
        data={INVOICES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white p-5 mb-4 rounded-2xl shadow-sm border border-claude-border flex-row justify-between items-center"
            onPress={() =>
              router.push({
                pathname: "/(admin)/bills/[id]",
                params: { id: item.id },
              })
            }
          >
            <View>
              <View className="flex-row items-center mb-2">
                <Text className="text-claude-text font-serif text-xl mr-3">
                  Room {item.room}
                </Text>
                <View
                  className={`px-2 py-1 rounded-md ${
                    getStatusColor(item.status).split(" ")[0]
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      getStatusColor(item.status).split(" ")[1]
                    }`}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text className="text-gray-400 font-sans text-sm">
                Due: {item.dueDate}
              </Text>
            </View>
            <View>
              <Text className="text-claude-text font-serif text-lg text-right">
                {formatCurrency(item.amount)}
              </Text>
              <Text className="text-claude-accent font-sans text-xs text-right mt-1">
                Tap to details
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
