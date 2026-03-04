import { Stack } from "expo-router";

export default function ContractsLayout() {
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
        options={{ title: "Hợp đồng", headerShown: false }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: "Chi tiết hợp đồng", headerShown: false }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: "Tạo hợp đồng",
          presentation: "modal",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
