import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function ReadingsList() {
  const router = useRouter();

  const {
    data: buildings,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["buildings-with-rooms"],
    queryFn: async () => {
      const res = await api.get("/buildings");
      // Structure: [{ id, name, address, rooms: [...] }]
      return res.data;
    },
  });

  const sections =
    buildings?.map((b: any) => ({
      title: b.name,
      data: b.rooms || [],
    })) || [];

  return (
    <View className="flex-1 bg-claude-bg">
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#DA7756" />
          <Text className="text-gray-400 font-sans mt-2">
            Loading buildings...
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
          renderSectionHeader={({ section: { title } }) => (
            <View className="bg-claude-bg px-6 py-3 border-b border-gray-100">
              <Text className="font-serif text-lg text-claude-text font-bold">
                {title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white px-6 py-4 flex-row justify-between items-center border-b border-gray-50 active:bg-gray-50"
              onPress={() =>
                router.push({
                  pathname: "/(admin)/readings/patrol/[roomId]",
                  params: { roomId: item.id },
                })
              }
            >
              <View className="flex-row items-center">
                <View
                  className={`w-2 h-2 rounded-full mr-3 ${
                    item.status === "RENTED" ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <Text className="text-lg font-sans text-claude-text">
                  Room {item.name}
                </Text>
              </View>

              <FontAwesome5 name="chevron-right" size={14} color="#D1D5DB" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View className="p-6 items-center">
              <Text className="text-gray-400 font-sans">No rooms found.</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
