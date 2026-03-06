import { Tabs, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";
import { Platform, View, TouchableOpacity, Text, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import dayjs from "dayjs";

function CustomTabBar({ state, descriptors, navigation }: any) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadReadingsCount, setUnreadReadingsCount] = useState(0);

  const currentMonth = dayjs().format("MM-YYYY");

  useEffect(() => {
    api
      .get("/readings/unread", { params: { month: currentMonth } })
      .then((res) => setUnreadReadingsCount(res.data?.length ?? 0))
      .catch(() => {});
  }, [currentMonth]);

  // Get current active route from the state object
  const currentRouteName = state.routes[state.index].name;

  // 1. Primary Tabs (Visible on Bar) - Using Ionicons (Sharp/Solid for "Harder" look)
  const leftTabs = [
    { name: "dashboard", icon: "grid", label: "Tổng quan" },
    { name: "rooms", icon: "key", label: "Phòng" },
  ];
  const rightTabs = [
    { name: "tenants", icon: "people", label: "Cư dân" },
    { name: "bills", icon: "receipt", label: "Tài chính" },
  ];

  // 2. Menu Items (Inside the Center Modal)
  const menuGridItems = [
    {
      label: "Quản lý tòa nhà",
      icon: "business",
      route: "buildings",
      color: "#0D9488",
      bgColor: "#CCFBF1",
    },
    {
      label: "Hợp đồng",
      icon: "document-text",
      route: "contracts",
      color: "#059669",
      bgColor: "#D1FAE5",
    },
    {
      label: "Dịch vụ",
      icon: "settings",
      route: "services",
      color: "#0891B2",
      bgColor: "#CFFAFE",
    },
    {
      label: "Tài chính",
      icon: "stats-chart",
      route: "finance",
      color: "#16A34A",
      bgColor: "#F0FDF4",
    },
    {
      label: "Chốt điện nước",
      icon: "flash",
      route: "readings",
      color: "#F59E0B",
      bgColor: "#FEF3C7",
      badge: unreadReadingsCount > 0 ? unreadReadingsCount : null,
    },
    {
      label: "Quản lý sự cố",
      icon: "construct",
      route: "issues",
      color: "#EF4444",
      bgColor: "#FEE2E2",
    },
    {
      label: "Thông báo",
      icon: "notifications",
      route: "notifications",
      color: "#3B82F6",
      bgColor: "#DBEAFE",
    },
    {
      label: "Tài khoản",
      icon: "person-circle",
      route: "profile",
      color: "#64748B",
      bgColor: "#F1F5F9",
    },
  ];

  const onNavigate = async (routeName: string) => {
    setMenuOpen(false);

    // Avoid Raw React Navigation APIs to prevent Context Orphan bugs on re-renders.
    // Strictly dispatch navigation through expo-router.
    const route = state.routes.find((r: any) => r.name === routeName);

    if (route) {
      const isFocused = state.index === state.routes.indexOf(route);
      if (!isFocused) {
        router.push(`/(admin)/${routeName}` as any);
      }
    } else {
      router.push(`/(admin)/${routeName}` as any);
    }
  };

  return (
    <>
      {/* --- Main Tab Bar --- */}
      <View
        style={{
          position: "absolute",
          bottom: Platform.OS === "ios" ? insets.bottom + 10 : 20,
          left: 16,
          right: 16,
          height: 72,
          backgroundColor: "white",
          borderRadius: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 8,
          // Light shadow
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        {/* Left Group */}
        {leftTabs.map((tab) => (
          <TabItem
            key={tab.name}
            tab={tab}
            isActive={currentRouteName === tab.name}
            onPress={() => onNavigate(tab.name)}
          />
        ))}

        {/* Center Space for Floating Button */}
        <View style={{ width: 60 }} />

        {/* Right Group */}
        {rightTabs.map((tab) => (
          <TabItem
            key={tab.name}
            tab={tab}
            isActive={currentRouteName === tab.name}
            onPress={() => onNavigate(tab.name)}
          />
        ))}

        {/* --- Center Floating Button --- */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setMenuOpen(true)}
          style={{
            position: "absolute",
            top: -20, // Float upwards
            left: "50%",
            marginLeft: -28, // Half of width (56/2)
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: "#DA7756", // Brand Orange
            alignItems: "center",
            justifyContent: "center",
            // Shadow
            shadowColor: "#DA7756",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 10,
            elevation: 8,
            borderWidth: 4,
            borderColor: "#F3F4F6", // Neutral border
          }}
        >
          <Ionicons name={menuOpen ? "close" : "add"} size={32} color="white" />
        </TouchableOpacity>
      </View>

      {/* --- Command Grid Modal --- */}
      <Modal
        visible={menuOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)", // Darker overlay
            justifyContent: "flex-end",
          }}
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
        >
          <View
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              padding: 24,
              paddingBottom: insets.bottom + 40,
              // Shadow for the panel itself
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 20,
            }}
          >
            {/* Handle Bar */}
            <View
              style={{
                width: 48,
                height: 5,
                backgroundColor: "#E5E7EB",
                borderRadius: 100,
                alignSelf: "center",
                marginBottom: 24,
              }}
            />

            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: "#111827",
                marginBottom: 24,
                letterSpacing: -0.5,
              }}
            >
              Chức năng khác
            </Text>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              {menuGridItems.map((item, index) => {
                return (
                  <TouchableOpacity
                    key={item.route}
                    onPress={() => onNavigate(item.route)}
                    activeOpacity={0.9}
                    style={{
                      width: "47%", // 2-column grid
                      aspectRatio: 1.3,
                      backgroundColor: item.bgColor,
                      borderRadius: 24,
                      padding: 16,
                      justifyContent: "space-between",
                      // Subtle inner shadow effect (simulated with border)
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.5)",
                      // Card Shadow
                      shadowColor: item.color,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 14,
                        backgroundColor: "white",
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: item.color,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                      }}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color={item.color}
                      />
                      {/* Badge */}
                      {(item as any).badge && (
                        <View
                          style={{
                            position: "absolute",
                            top: -5,
                            right: -5,
                            backgroundColor: "#EF4444",
                            borderRadius: 10,
                            minWidth: 18,
                            height: 18,
                            alignItems: "center",
                            justifyContent: "center",
                            paddingHorizontal: 3,
                            borderWidth: 1.5,
                            borderColor: "white",
                          }}
                        >
                          <Text
                            style={{
                              color: "white",
                              fontSize: 9,
                              fontWeight: "800",
                              lineHeight: 12,
                            }}
                          >
                            {(item as any).badge}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: "#1F2937",
                          marginBottom: 2,
                        }}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "600",
                          color: item.color, // Colored subtitle
                          opacity: 0.8,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Truy cập
                      </Text>
                    </View>

                    {/* Decorative Blob */}
                    <View
                      style={{
                        position: "absolute",
                        right: -10,
                        bottom: -10,
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: item.color,
                        opacity: 0.05,
                      }}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// Sub-component
function TabItem({ tab, isActive, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 4,
      }}
    >
      <Ionicons
        name={tab.icon}
        size={22}
        color={isActive ? "#DA7756" : "#9CA3AF"}
      />
      {isActive && (
        <Text style={{ fontSize: 10, fontWeight: "600", color: "#DA7756" }}>
          {tab.label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function AdminLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Tổng quan" }} />
      <Tabs.Screen name="rooms" options={{ title: "Phòng" }} />
      <Tabs.Screen name="tenants" options={{ title: "Cư dân" }} />
      <Tabs.Screen name="readings" options={{ title: "Điện nước" }} />
      <Tabs.Screen name="bills" options={{ title: "Tài chính" }} />

      {/* Hidden Routes but available in Menu */}
      <Tabs.Screen name="buildings" options={{ title: "Tòa nhà" }} />
      <Tabs.Screen name="contracts" options={{ title: "Hợp đồng" }} />
      <Tabs.Screen name="services" options={{ title: "Dịch vụ" }} />
      <Tabs.Screen
        name="notifications"
        options={{ href: null, title: "Thông báo" }}
      />
      <Tabs.Screen name="issues" options={{ href: null, title: "Sự cố" }} />
      <Tabs.Screen
        name="finance"
        options={{ href: null, title: "Tài chính" }}
      />
    </Tabs>
  );
}
