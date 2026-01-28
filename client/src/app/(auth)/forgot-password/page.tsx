'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'กรุณากรอกอีเมล' })
    .email({ message: 'รูปแบบอีเมลไม่ถูกต้อง' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true);
      setSubmitError('');

      await api.post('/auth/forgot-password', data);

      setIsSuccess(true);
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            ส่งอีเมลสำเร็จ
          </CardTitle>
          <CardDescription className="text-center">
            เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              กรุณาตรวจสอบอีเมลของคุณและคลิกที่ลิงก์เพื่อรีเซ็ตรหัสผ่าน
              ลิงก์จะหมดอายุภายใน 1 ชั่วโมง
            </p>
          </div>
          <p className="text-sm text-center text-gray-600">
            ไม่ได้รับอีเมล?{' '}
            <button
              onClick={() => {
                setIsSuccess(false);
                form.reset();
              }}
              className="text-primary font-medium hover:underline"
            >
              ส่งอีกครั้ง
            </button>
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับไปหน้าเข้าสู่ระบบ
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          ลืมรหัสผ่าน?
        </CardTitle>
        <CardDescription className="text-center">
          กรอกอีเมลที่คุณใช้สมัครสมาชิก เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านให้คุณ
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {submitError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {submitError}
              </div>
            )}

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

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังส่งอีเมล...
                </>
              ) : (
                'ส่งลิงก์รีเซ็ตรหัสผ่าน'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Link href="/login" className="w-full">
          <Button variant="ghost" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับไปหน้าเข้าสู่ระบบ
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
