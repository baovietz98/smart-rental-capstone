"use client";

import React, { useState } from "react";
import { Form, Input, Checkbox, message } from "antd";
import { User, Lock, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axiosClient from "@/lib/axios-client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      const isEmail = values.identifier.includes("@");
      const payload = {
        ...values,
        email: isEmail ? values.identifier : undefined,
        phoneNumber: !isEmail ? values.identifier : undefined,
      };
      delete payload.identifier; // Clean up

      const res = await axiosClient.post("/auth/login", payload);

      const { accessToken, user } = res.data;

      // 1. Lưu token vào localStorage (Client usage)
      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(user));

      // 2. Lưu token vào Cookie Logic
      // Nếu remember = true -> 30 ngày (2592000s)
      // Nếu false (default) -> 1 ngày (86400s) hoặc Session
      const maxAge = values.remember ? 2592000 : 86400;

      document.cookie = `token=${accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`;

      messageApi.success("Đăng nhập thành công!");

      // 3. Redirect based on Role
      if (user.role === "TENANT") {
        router.push("/tenant");
      } else {
        router.push("/");
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      const msg =
        error.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại.";
      messageApi.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="claude-card p-8 md:p-10 bg-white">
      <h2 className="text-2xl font-bold text-[#2D2D2C] mb-6 font-serif">
        Welcome Back
      </h2>
      {contextHolder}

      <Form
        name="login_form"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="identifier"
          rules={[
            {
              required: true,
              message: "Please input your Email or Phone Number!",
            },
          ]}
        >
          <Input
            prefix={<User size={18} className="text-gray-400" />}
            placeholder="Email or Phone Number"
            className="font-sans"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: "Please input your Password!" }]}
        >
          <Input.Password
            prefix={<Lock size={18} className="text-gray-400" />}
            placeholder="Password"
            className="font-sans"
          />
        </Form.Item>

        <div className="flex justify-between items-center mb-6">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox className="text-gray-500">Remember me</Checkbox>
          </Form.Item>
          <Link
            className="text-[#D97757] hover:underline text-sm font-medium"
            href="/forgot-password"
          >
            Forgot Password?
          </Link>
        </div>

        <Form.Item>
          <button
            type="submit"
            disabled={loading}
            className="w-full claude-btn-primary py-3 flex justify-center items-center gap-2 text-base font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Signing In..." : "Sign In"} <ArrowRight size={18} />
          </button>
        </Form.Item>
      </Form>

      <div className="mt-6 text-center text-gray-500 border-t border-gray-100 pt-6">
        Do not have an account?{" "}
        <Link
          href="/register"
          className="text-[#D97757] font-semibold hover:underline"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
