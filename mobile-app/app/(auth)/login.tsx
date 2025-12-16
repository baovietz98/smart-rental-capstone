import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { FontAwesome5 } from "@expo/vector-icons";
import { api } from "@/lib/api";
import * as SecureStore from "expo-secure-store";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/login", { email, password });

      // Backend returns 'accessToken', not 'access_token'
      const token = response.data.accessToken;

      if (!token) {
        throw new Error("No access token received from server");
      }

      await SecureStore.setItemAsync("access_token", token);

      router.replace("/(admin)/dashboard");
    } catch (error: any) {
      console.error("Login Error:", error.message);

      const message =
        error.response?.data?.message || error.message || "Unknown error";

      Alert.alert("Login Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-claude-bg justify-center p-8">
      <View className="items-center mb-12">
        <View className="bg-claude-accent p-4 rounded-2xl mb-4 shadow-sm">
          <FontAwesome5 name="home" size={40} color="white" />
        </View>
        <Text className="font-serif text-3xl text-claude-text font-bold">
          Smart Rental
        </Text>
        <Text className="font-sans text-gray-400 mt-2 tracking-widest uppercase text-xs">
          Management System
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="bg-white p-6 rounded-3xl shadow-sm border border-claude-border space-y-4">
          <View>
            <Text className="font-sans text-gray-500 mb-2 ml-1">Email</Text>
            <TextInput
              className="bg-gray-50 p-4 rounded-xl border border-gray-100 font-sans text-claude-text"
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View>
            <Text className="font-sans text-gray-500 mb-2 ml-1">Password</Text>
            <TextInput
              className="bg-gray-50 p-4 rounded-xl border border-gray-100 font-sans text-claude-text"
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            className="bg-claude-accent p-4 rounded-xl items-center mt-4 shadow-md active:opacity-90"
            onPress={handleLogin}
            disabled={loading}
          >
            <Text className="text-white font-sans font-bold text-lg">
              {loading ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <View className="mt-8 flex-row justify-center">
        <Text className="text-gray-400 font-sans">Powered by </Text>
        <Text className="text-claude-text font-serif font-bold">
          Antigravity
        </Text>
      </View>
    </View>
  );
}
