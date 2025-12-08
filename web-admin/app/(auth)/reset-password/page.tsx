"use client";

import React, { useState, Suspense } from 'react';
import { Form, Input, message } from 'antd';
import { Lock, ArrowRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/lib/axios-client';
import Link from 'next/link';

function ResetPasswordForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold text-red-500 mb-2">Invalid Request</h2>
        <p className="text-gray-500 mb-4">Missing reset token.</p>
        <Link href="/login" className="claude-btn-primary">Back to Login</Link>
      </div>
    );
  }

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      if (values.password !== values.confirmPassword) {
        message.error('Mật khẩu không khớp!');
        return;
      }

      await axiosClient.post('/auth/reset-password', {
        token,
        newPassword: values.password,
      });

      message.success('Đổi mật khẩu thành công! Vui lòng đăng nhập.');
      router.push('/login');
      
    } catch (error: any) {
      console.error('Reset password failed:', error);
      const msg = error.response?.data?.message || 'Đổi mật khẩu thất bại. Token có thể đã hết hạn.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
       <h2 className="text-2xl font-bold text-[#2D2D2C] mb-2 font-serif">Set New Password</h2>
       <p className="text-gray-500 mb-6 font-sans">Enter your new password below.</p>
       
       <Form
          name="reset_password_form"
          onFinish={onFinish}
          layout="vertical"
          size="large"
       >
          <Form.Item
             name="password"
             rules={[
                 { required: true, message: 'Please input your new Password!' },
                 { min: 6, message: 'Password must be at least 6 characters!' }
             ]}
          >
             <Input.Password 
                prefix={<Lock size={18} className="text-gray-400" />} 
                placeholder="New Password"
                className="font-sans" 
             />
          </Form.Item>

          <Form.Item
             name="confirmPassword"
             dependencies={['password']}
             rules={[
               { required: true, message: 'Please confirm your password!' },
               ({ getFieldValue }) => ({
                 validator(_, value) {
                   if (!value || getFieldValue('password') === value) {
                     return Promise.resolve();
                   }
                   return Promise.reject(new Error('Passwords do not match!'));
                 },
               }),
             ]}
          >
             <Input.Password 
                prefix={<Lock size={18} className="text-gray-400" />} 
                placeholder="Confirm New Password"
                className="font-sans" 
             />
          </Form.Item>

          <Form.Item>
             <button 
                type="submit" 
                disabled={loading}
                className="w-full claude-btn-primary py-3 flex justify-center items-center gap-2 text-base font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {loading ? 'Resetting...' : 'Reset Password'} <ArrowRight size={18} />
             </button>
          </Form.Item>
       </Form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="claude-card p-8 md:p-10 bg-white">
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
