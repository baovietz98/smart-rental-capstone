import { Stack } from "expo-router";

export default function BillsLayout() {
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
        options={{ title: "Invoices", headerLargeTitle: true }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: "Bill Details", presentation: "modal" }}
      />
    </Stack>
  );
}
