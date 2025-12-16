import { Tabs } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: "#FBF9F6", borderTopColor: "#E5E0D8" },
        tabBarActiveTintColor: "#DA7756",
        tabBarInactiveTintColor: "#9ca3af",
        headerShown: false,
        tabBarLabelStyle: { fontFamily: "Inter_500Medium" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Overview",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="home" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="readings"
        options={{
          title: "Patrol",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="bolt" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          title: "Bills",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="file-invoice-dollar" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
