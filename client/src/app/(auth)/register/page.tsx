'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, User, Mail, Phone, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, { message: 'ชื่อ-นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร' })
      .max(100, { message: 'ชื่อ-นามสกุลต้องไม่เกิน 100 ตัวอักษร' }),
    email: z
      .string()
      .min(1, { message: 'กรุณากรอกอีเมล' })
      .email({ message: 'รูปแบบอีเมลไม่ถูกต้อง' }),
    phone: z
      .string()
      .min(10, { message: 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 10 หลัก' })
      .regex(/^[0-9]+$/, { message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น' }),
    password: z
      .string()
      .min(6, { message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
      .regex(/[A-Z]/, { message: 'รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว' })
      .regex(/[a-z]/, { message: 'รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว' })
      .regex(/[0-9]/, { message: 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว' })
      .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: 'รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว เช่น !@#$%' }),
    confirmPassword: z
      .string()
      .min(1, { message: 'กรุณายืนยันรหัสผ่าน' }),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, {
        message: 'กรุณายอมรับข้อกำหนดและเงื่อนไข',
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'รหัสผ่านไม่ตรงกัน',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register, isLoading, error, clearError } = useAuth();
  const [submitError, setSubmitError] = useState<string>('');

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setSubmitError('');
      clearError();
      await register(data);
    } catch (err: any) {
      setSubmitError(err.message || 'สมัครสมาชิกไม่สำเร็จ');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          สมัครสมาชิก
        </CardTitle>
        <CardDescription className="text-center">
          กรอกข้อมูลเพื่อสร้างบัญชีใหม่
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {(submitError || error) && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {submitError || error}
              </div>
            )}

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อ-นามสกุล</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="สมชาย ใจดี"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>อีเมล</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="example@email.com"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>เบอร์โทรศัพท์</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="tel"
                        placeholder="0812345678"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รหัสผ่าน</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร ประกอบด้วยตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ (!@#$%)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ยืนยันรหัสผ่าน</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      ฉันยอมรับ{' '}
                      <Link
                        href="/terms"
                        className="text-primary hover:underline"
                        target="_blank"
                      >
                        ข้อกำหนดและเงื่อนไข
                      </Link>{' '}
                      และ{' '}
                      <Link
                        href="/privacy"
                        className="text-primary hover:underline"
                        target="_blank"
                      >
                        นโยบายความเป็นส่วนตัว
                      </Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังสมัครสมาชิก...
                </>
              ) : (
                'สมัครสมาชิก'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center text-gray-600">
          มีบัญชีอยู่แล้ว?{' '}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
