import { Tabs } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  Platform,
  View,
  TouchableOpacity,
  Text,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  // Filter out hidden routes (notifications, issues)
  const visibleRoutes = state.routes.filter((route: any) => {
    const { options } = descriptors[route.key];
    return options.href !== null;
  });

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "white",
        height: Platform.OS === "ios" ? 80 : 70,
        paddingBottom: Platform.OS === "ios" ? insets.bottom : 10,
        paddingTop: 10,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
      }}
    >
      {visibleRoutes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === state.routes.indexOf(route);

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const iconName =
          route.name === "dashboard"
            ? "home"
            : route.name === "rooms"
              ? "door-open"
              : route.name === "tenants"
                ? "users"
                : route.name === "readings"
                  ? "bolt"
                  : "file-invoice-dollar";

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isFocused ? (
              // Floating Active Button
              <View
                style={{
                  position: "absolute",
                  top: -30,
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: "#DA7756",
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#DA7756",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                  borderWidth: 4,
                  borderColor: "#F9FAFB", // Match page bg to fake the "curve"
                }}
              >
                <FontAwesome5 name={iconName} size={20} color="white" />
              </View>
            ) : (
              // Inactive Item
              <View style={{ alignItems: "center", paddingTop: 10 }}>
                <FontAwesome5 name={iconName} size={18} color="#9CA3AF" />
                <Text
                  style={{
                    fontSize: 10,
                    color: "#9CA3AF",
                    marginTop: 4,
                    fontFamily: "Inter_500Medium",
                  }}
                >
                  {label}
                </Text>
              </View>
            )}

            {/* Label for Active (Below the floating button) */}
            {isFocused && (
              <Text
                style={{
                  fontSize: 10,
                  color: "#DA7756",
                  marginTop: 24, // Push down below floating circle
                  fontFamily: "Inter_700Bold",
                }}
              >
                {label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
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
      {/* Hidden Tabs */}
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="issues" options={{ href: null }} />
    </Tabs>
  );
}
