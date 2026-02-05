import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";

export default function Register() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setLoading(true);
      // Assuming standard register endpoint
      await api.post("/auth/register", {
        fullName,
        email,
        password,
      });

      Alert.alert(
        "Đăng ký thành công",
        "Tài khoản của bạn đã được tạo. Vui lòng đăng nhập.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error: any) {
      console.error("Register Error:", error);
      const message =
        error.response?.data?.message || "Không thể đăng ký. Vui lòng thử lại.";
      Alert.alert("Đăng ký thất bại", message);
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
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 32,
          }}
        >
          <View className="items-center mb-8">
            <View className="bg-[#DA7756] w-16 h-16 rounded-[20px] items-center justify-center mb-4 shadow-xl shadow-orange-500/20">
              <FontAwesome5 name="user-plus" size={24} color="white" />
            </View>
            <Text className="font-serif text-3xl text-gray-900 font-bold">
              Tạo tài khoản
            </Text>
            <Text className="font-sans text-gray-400 mt-2 tracking-[2px] uppercase text-[10px] font-black">
              Tham gia hệ thống quản lý
            </Text>
          </View>

          <View className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 mb-6">
            <View className="space-y-4">
              <View>
                <Text className="font-sans text-gray-400 text-[10px] font-black uppercase tracking-wider mb-2 ml-1">
                  Họ và tên
                </Text>
                <TextInput
                  className="bg-gray-50 p-4 rounded-xl border border-gray-100 font-sans text-gray-900"
                  placeholder="Nguyễn Văn A"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View>
                <Text className="font-sans text-gray-400 text-[10px] font-black uppercase tracking-wider mb-2 ml-1">
                  Email
                </Text>
                <TextInput
                  className="bg-gray-50 p-4 rounded-xl border border-gray-100 font-sans text-gray-900"
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
                  Mật khẩu
                </Text>
                <TextInput
                  className="bg-gray-50 p-4 rounded-xl border border-gray-100 font-sans text-gray-900"
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <View>
                <Text className="font-sans text-gray-400 text-[10px] font-black uppercase tracking-wider mb-2 ml-1">
                  Xác nhận mật khẩu
                </Text>
                <TextInput
                  className="bg-gray-50 p-4 rounded-xl border border-gray-100 font-sans text-gray-900"
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <TouchableOpacity
                className="bg-gray-900 p-5 rounded-2xl items-center mt-4 shadow-xl shadow-black/20 active:opacity-90"
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-sans font-black uppercase tracking-widest text-xs">
                    Đăng ký ngay
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row justify-center items-center">
            <Text className="text-gray-500 text-xs font-medium">
              Đã có tài khoản?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-[#DA7756] text-xs font-bold">
                Đăng nhập
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
