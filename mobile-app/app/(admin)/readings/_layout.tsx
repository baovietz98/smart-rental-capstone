import { Stack } from "expo-router";

export default function ReadingsLayout() {
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
        options={{ title: "Select Zone", headerLargeTitle: true }}
      />
      <Stack.Screen name="patrol/[roomId]" options={{ headerShown: false }} />
    </Stack>
  );
}
