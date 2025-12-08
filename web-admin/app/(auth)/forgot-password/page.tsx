"use client";

import React, { useState } from 'react';
import { Form, Input, message } from 'antd';
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import axiosClient from '@/lib/axios-client';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      message.loading({ content: 'Đang xử lý...', key: 'process' });
      
      console.log('Submitting email:', values.email);
      // Gọi API thực tế
      await axiosClient.post('/auth/forgot-password', { email: values.email });

      setShowSuccessModal(true);
      message.success({ content: 'Link đặt lại mật khẩu đã được gửi!', key: 'process', duration: 3 });
    } catch (error: any) {
      console.error('Forgot password failed:', error);
      const msg = error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      message.error({ content: msg, key: 'process', duration: 3 });
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = () => {
      message.error("Vui lòng nhập địa chỉ Email!");
  };

  return (
    <div className="relative min-h-[400px]">
        {/* SUCCESS MODAL OVERLAY */}
        {showSuccessModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_black] max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-[#E6F4EA] border-2 border-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-[2px_2px_0px_0px_black]">
                        <CheckCircle size={32} className="text-[#137333]" />
                    </div>
                    <h2 className="text-2xl font-black uppercase mb-4 tracking-tight">Email Sent!</h2>
                    <p className="text-gray-600 font-medium mb-8">
                        Chúng tôi đã gửi link đặt lại mật khẩu vào email của bạn. Vui lòng kiểm tra hộp thư đến (và cả spam).
                    </p>
                    <Link 
                        href="/login"
                        className="w-full block bg-[#FFC900] text-black border-2 border-black font-bold py-3 hover:shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 transition-all"
                    >
                        Quay lại Đăng nhập
                    </Link>
                </div>
            </div>
        )}

      <div className={`claude-card p-8 md:p-10 bg-white transition-opacity duration-300 ${showSuccessModal ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
         <Link href="/login" className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-6 text-sm group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Login
         </Link>

         <h2 className="text-2xl font-bold text-[#2D2D2C] mb-2 font-serif">Reset Password</h2>
         <p className="text-gray-500 mb-6 font-sans">Enter your email to receive reset instructions.</p>
         
         <Form
            name="forgot_password_form"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            layout="vertical"
            size="large"
            requiredMark={false}
         >
            <Form.Item
               name="email"
               rules={[
                 { required: true, message: '' }, // Tắt message mặc định để dùng message.error
                 { type: 'email', message: 'Email không hợp lệ!' }
               ]}
            >
               <Input 
                  prefix={<Mail size={18} className="text-gray-400" />} 
                  placeholder="Email Address" 
                  className="font-sans"
               />
            </Form.Item>

            <Form.Item>
               <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full claude-btn-primary py-3 flex justify-center items-center gap-2 text-base font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
               >
                  {loading ? 'Sending Link...' : 'Send Reset Link'} <ArrowRight size={18} />
               </button>
            </Form.Item>
         </Form>
      </div>
    </div>
  );
}
