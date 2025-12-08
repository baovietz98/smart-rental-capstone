"use client";

import React, { useState } from 'react';
import { Form, Input, message } from 'antd';
import { User, Lock, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axiosClient from '@/lib/axios-client';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      // Backend expects: { email, password, name } as per CreateUserDto/RegisterDto
      // Confirm password handling
      if (values.password !== values.confirmPassword) {
         message.error('Mật khẩu nhập lại không khớp!');
         setLoading(false);
         return;
      }

      await axiosClient.post('/auth/register', {
         email: values.email,
         password: values.password,
         name: values.fullName,
      });
      
      message.success('Đăng ký thành công! Vui lòng đăng nhập.');
      router.push('/login');
      
    } catch (error: any) {
      console.error('Register failed:', error);
      const msg = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="claude-card p-8 md:p-10 bg-white">
       <h2 className="text-2xl font-bold text-[#2D2D2C] mb-2 font-serif">Create Account</h2>
       <p className="text-gray-500 mb-6 font-sans">Join Smart Rental Manager today.</p>
       
       <Form
          name="register_form"
          onFinish={onFinish}
          layout="vertical"
          size="large"
       >
          <Form.Item
             name="fullName"
             rules={[{ required: true, message: 'Please input your full name!' }]}
          >
             <Input 
                prefix={<User size={18} className="text-gray-400" />} 
                placeholder="Full Name" 
                className="font-sans"
             />
          </Form.Item>

          <Form.Item
             name="email"
             rules={[
               { required: true, message: 'Please input your Email!' },
               { type: 'email', message: 'Invalid email format!' }
             ]}
          >
             <Input 
                prefix={<Mail size={18} className="text-gray-400" />} 
                placeholder="Email Address" 
                className="font-sans"
             />
          </Form.Item>

          <Form.Item
             name="password"
             rules={[
                 { required: true, message: 'Please input your Password!' },
                 { min: 6, message: 'Password must be at least 6 characters!' }
             ]}
          >
             <Input.Password 
                prefix={<Lock size={18} className="text-gray-400" />} 
                placeholder="Password"
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
                placeholder="Confirm Password"
                className="font-sans" 
             />
          </Form.Item>

          <Form.Item className="mt-2">
             <button 
                type="submit" 
                disabled={loading}
                className="w-full claude-btn-primary py-3 flex justify-center items-center gap-2 text-base font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {loading ? 'Creating Account...' : 'Sign Up'} <ArrowRight size={18} />
             </button>
          </Form.Item>
       </Form>
       
       <div className="mt-6 text-center text-gray-500 border-t border-gray-100 pt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#D97757] font-semibold hover:underline">
             Sign In
          </Link>
       </div>
    </div>
  );
}
