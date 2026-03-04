import { Stack } from "expo-router";

export default function TenantsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#FBF9F6" },
        headerTitleStyle: {
          fontFamily: "Merriweather_700Bold",
          color: "#383838",
        },
        headerTintColor: "#DA7756",
        contentStyle: { backgroundColor: "#FBF9F6" },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Cư dân",
          headerLargeTitle: true,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: "Chi tiết cư dân", headerShown: false }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: "Thêm cư dân",
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: "Sửa hồ sơ",
          presentation: "modal",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
