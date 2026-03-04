import { Stack } from "expo-router";

export default function RoomsLayout() {
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
          title: "Danh sách phòng",
          headerLargeTitle: true,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: "Chi tiết phòng", headerShown: false }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: "Thêm phòng mới",
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: "Chỉnh sửa phòng",
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="move-room"
        options={{
          title: "Chuyển phòng",
          presentation: "modal",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
