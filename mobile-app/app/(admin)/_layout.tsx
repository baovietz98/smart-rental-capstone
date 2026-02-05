import { Tabs } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#FBF9F6",
          borderTopColor: "#E5E0D8",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#DA7756",
        tabBarInactiveTintColor: "#9ca3af",
        headerShown: false,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Tổng quan",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="home" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: "Phòng",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="door-open" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tenants"
        options={{
          title: "Cư dân",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="users" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="readings"
        options={{
          title: "Chốt điện",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="bolt" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          title: "Tài chính",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="file-invoice-dollar" size={18} color={color} />
          ),
        }}
      />
      {/* Hidden Tabs */}
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="issues"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
