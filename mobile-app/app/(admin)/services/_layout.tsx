import { Stack } from "expo-router";

export default function ServicesLayout() {
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
        options={{ title: "Dịch vụ", headerShown: false }}
      />
    </Stack>
  );
}
