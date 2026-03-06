import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { api } from "@/lib/api";

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit states
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/auth/profile");
      setProfile(res.data);
      setEditName(res.data.name || "");
      setEditPhone(res.data.phoneNumber || "");
    } catch (error) {
      console.error("Lỗi lấy thông tin profile:", error);
      Alert.alert("Lỗi", "Không thể lấy thông tin người dùng.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            // 1. Send logout to backend (optional, if supported)
            try {
              await api.post("/auth/logout");
            } catch (e) {
              // Ignore if the backend endpoint is not strictly necessary or fails
            }

            // 2. Clear token securely
            await SecureStore.deleteItemAsync("access_token");

            // 3. Navigate out
            router.replace("/(auth)/login");
          } catch (err) {
            console.error("Lỗi đăng xuất:", err);
            Alert.alert("Lỗi", "Có lỗi xảy ra khi đăng xuất.");
          }
        },
      },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ và tên.");
      return;
    }

    try {
      setIsSaving(true);
      const res = await api.patch("/auth/profile", {
        name: editName,
        phoneNumber: editPhone,
      });

      // Update local state and close modal
      setProfile({ ...profile, ...res.data });
      setIsEditModalVisible(false);
      Alert.alert("Thành công", "Đã cập nhật thông tin thành công!");
    } catch (error: any) {
      console.error("Lỗi cập nhật profile:", error);
      const backendMsg = error.response?.data?.message;
      const displayMsg =
        typeof backendMsg === "string"
          ? backendMsg
          : Array.isArray(backendMsg)
            ? backendMsg[0]
            : "Không thể cập nhật thông tin người dùng.";
      Alert.alert("Lỗi", displayMsg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#DA7756" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* Header */}
      <View className="bg-white px-5 pt-3 pb-4 border-b border-slate-100 flex-row items-center relative z-10 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.05)]">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center mr-3"
        >
          <Ionicons name="arrow-back" size={20} color="#64748B" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-slate-800 tracking-tight flex-1">
          Hồ sơ của tôi
        </Text>
        <TouchableOpacity
          onPress={() => setIsEditModalVisible(true)}
          className="w-10 h-10 bg-indigo-50 rounded-full items-center justify-center"
        >
          <Ionicons name="pencil" size={18} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-8 pb-32"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View
          className="bg-white p-6 rounded-3xl items-center mb-8 border border-slate-100"
          style={{
            shadowColor: "#94a3b8",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          <View className="w-24 h-24 bg-indigo-100 rounded-full items-center justify-center mb-4 border-4 border-white shadow-sm">
            <Text className="text-4xl font-serif font-black text-indigo-600">
              {profile?.name?.charAt(0)?.toUpperCase() || "A"}
            </Text>
          </View>
          <Text className="text-2xl font-black text-slate-800 mb-1 tracking-tight">
            {profile?.name || "Quản trị viên"}
          </Text>
          <Text className="text-sm font-medium text-slate-500 mb-2">
            {profile?.role === "ADMIN" ? "Quản trị Hệ thống" : "Khách thuê"}
          </Text>
          <View className="bg-emerald-50 px-3 py-1 rounded-full">
            <Text className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">
              Đang hoạt động
            </Text>
          </View>
        </View>

        {/* Information List */}
        <View className="mb-8">
          <Text className="text-sm font-bold text-slate-800 mb-4 tracking-wider uppercase">
            Thông tin liên hệ
          </Text>

          <View className="bg-white rounded-2xl overflow-hidden border border-slate-100">
            {/* Email */}
            <View className="flex-row items-center p-4 border-b border-slate-50">
              <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center mr-4">
                <Ionicons name="mail" size={18} color="#64748B" />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Email
                </Text>
                <Text className="text-sm font-semibold text-slate-700">
                  {profile?.email || "Chưa cập nhật"}
                </Text>
              </View>
            </View>

            {/* Phone */}
            <View className="flex-row items-center p-4">
              <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center mr-4">
                <Ionicons name="call" size={18} color="#64748B" />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Số điện thoại
                </Text>
                <Text className="text-sm font-semibold text-slate-700">
                  {profile?.phoneNumber || "Chưa cập nhật"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          className="flex-row items-center justify-center p-4 rounded-2xl border-2 border-rose-100 bg-rose-50"
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color="#E11D48"
            className="mr-2"
          />
          <Text className="text-rose-600 font-bold ml-2">
            Đăng xuất khỏi thiết bị
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/50 justify-end"
        >
          <View
            className="bg-white rounded-t-3xl pt-6 pb-10 px-5 relative"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 20,
            }}
          >
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-black text-slate-800">
                Chỉnh sửa Hồ sơ
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                className="w-8 h-8 bg-slate-100 rounded-full items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View className="space-y-4 mb-8">
              <View>
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Họ và Tên
                </Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Nhập họ và tên"
                  className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 font-semibold"
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Số điện thoại
                </Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Nhập số điện thoại"
                  keyboardType="phone-pad"
                  className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 font-semibold"
                />
              </View>
            </View>

            {/* Actions */}
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={isSaving}
              className={`py-4 rounded-xl items-center ${isSaving ? "bg-indigo-400" : "bg-indigo-600"}`}
              style={{
                shadowColor: "#4F46E5",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
              }}
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Lưu thay đổi
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
