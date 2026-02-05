import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    loadSavedEmail();
  }, []);

  const loadSavedEmail = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem("remembered_email");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (e) {
      console.error("Error loading saved email", e);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập email và mật khẩu");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/login", { email, password });

      const token = response.data.accessToken;

      if (!token) {
        throw new Error("Không nhận được token từ máy chủ");
      }

      await SecureStore.setItemAsync("access_token", token);

      if (rememberMe) {
        await AsyncStorage.setItem("remembered_email", email);
      } else {
        await AsyncStorage.removeItem("remembered_email");
      }

      router.replace("/(admin)/dashboard");
    } catch (error: any) {
      console.error("Login Error:", error.message);

      let message = "Có lỗi xảy ra. Vui lòng thử lại.";

      if (error.code === "ECONNABORTED") {
        message =
          "Kết nối quá hạn. Vui lòng kiểm tra lại mạng Wi-Fi và Backend.";
      } else if (!error.response) {
        message =
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra Backend đang chạy.";
      } else {
        message =
          error.response?.data?.message ||
          error.message ||
          "Lỗi không xác định";
      }

      Alert.alert("Đăng nhập thất bại", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center p-8">
          <View className="items-center mb-12">
            <View className="bg-claude-accent w-20 h-20 rounded-[24px] items-center justify-center mb-6 shadow-xl shadow-orange-500/20">
              <FontAwesome5 name="home" size={32} color="white" />
            </View>
            <Text className="font-serif text-4xl text-gray-900 font-bold">
              Smart Rental
            </Text>
            <Text className="font-sans text-gray-400 mt-2 tracking-[4px] uppercase text-[10px] font-black">
              Management System
            </Text>
          </View>

          <View className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
            <View className="space-y-5">
              <View>
                <Text className="font-sans text-gray-400 text-[10px] font-black uppercase tracking-wider mb-2 ml-1">
                  Email Address
                </Text>
                <TextInput
                  className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-sans text-gray-900"
                  placeholder="name@example.com"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View>
                <Text className="font-sans text-gray-400 text-[10px] font-black uppercase tracking-wider mb-2 ml-1">
                  Password
                </Text>
                <TextInput
                  className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-sans text-gray-900"
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <View className="flex-row justify-between items-center py-2">
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View
                    className={`w-5 h-5 rounded-md border items-center justify-center mr-2 ${
                      rememberMe
                        ? "bg-claude-accent border-claude-accent"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {rememberMe && (
                      <Ionicons name="checkmark" size={12} color="white" />
                    )}
                  </View>
                  <Text className="text-gray-500 text-xs font-bold">
                    Ghi nhớ đăng nhập
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "Quên mật khẩu",
                      "Vui lòng liên hệ quản trị viên hệ thống để đặt lại mật khẩu của bạn."
                    )
                  }
                >
                  <Text className="text-claude-accent text-xs font-bold">
                    Quên mật khẩu?
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                className="bg-gray-900 p-5 rounded-2xl items-center mt-4 shadow-xl shadow-black/20 active:opacity-90"
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-sans font-black uppercase tracking-widest text-sm">
                    Đăng nhập hệ thống
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            </View>
          </View>

          <View className="mt-8 flex-row justify-center items-center">
            <Text className="text-gray-500 text-xs font-medium">
              Chưa có tài khoản?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text className="text-claude-accent text-xs font-bold">
                Đăng ký ngay
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mt-8 flex-row justify-center items-center">
            <View className="h-[1px] w-8 bg-gray-200" />
            <Text className="mx-4 text-gray-300 text-[10px] font-bold uppercase tracking-widest">
              Powered by Antigravity
            </Text>
            <View className="h-[1px] w-8 bg-gray-200" />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
