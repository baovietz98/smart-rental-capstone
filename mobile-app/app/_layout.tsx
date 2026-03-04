import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Merriweather_700Bold,
} from "@expo-google-fonts/merriweather";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { useEffect } from "react";
import "../global.css";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, persister } from "@/lib/query-client";

import { mutationQueue } from "@/lib/mutation-queue";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Merriweather_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    mutationQueue.init();
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#FBF9F6" },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(tenant)" />
      </Stack>
    </PersistQueryClientProvider>
  );
}
