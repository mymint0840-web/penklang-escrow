'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileCheck, X, Check, Eye, User, CreditCard, FileText } from 'lucide-react';
import api from '@/lib/api';

interface KYCSubmission {
  id: string;
  userId: string;
  user: {
    fullName: string;
    email: string;
    phone: string;
  };
  idCardNumber: string;
  idCardImage: string;
  selfieImage: string;
  bankAccountNumber: string;
  bankAccountImage: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export default function KYCPage() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKYC, setSelectedKYC] = useState<KYCSubmission | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchKYCSubmissions();
  }, []);

  const fetchKYCSubmissions = async () => {
    try {
      const response = await api.get('/admin/kyc');
      // Extract data from API response structure { success: true, data: ... }
      const kycData = response.data.data || response.data;
      setSubmissions(Array.isArray(kycData) ? kycData : []);
    } catch (error) {
      console.error('Error fetching KYC submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (kycId: string, status: 'approved' | 'rejected') => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะ${status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}คำขอนี้?`)) {
      return;
    }

    setProcessing(true);
    try {
      await api.post(`/admin/kyc/${kycId}/review`, {
        status,
        note: reviewNote,
      });

      setSubmissions(submissions.map(sub =>
        sub.id === kycId
          ? { ...sub, status, reviewedAt: new Date().toISOString(), reviewNote }
          : sub
      ));

      setSelectedKYC(null);
      setReviewNote('');
      alert(`${status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}คำขอสำเร็จ`);
    } catch (error) {
      console.error('Error reviewing KYC:', error);
      alert('เกิดข้อผิดพลาดในการดำเนินการ');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">อนุมัติแล้ว</Badge>;
      case 'rejected':
        return <Badge variant="destructive">ปฏิเสธ</Badge>;
      case 'pending':
        return <Badge variant="warning">รอตรวจสอบ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ตรวจสอบ KYC</h1>
          <p className="text-gray-500 mt-1">
            ตรวจสอบและอนุมัติเอกสารยืนยันตัวตนของผู้ใช้
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="warning" className="text-lg px-4 py-2">
            {pendingCount} รายการรอตรวจสอบ
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <FileCheck className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">รอตรวจสอบ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {submissions.filter(s => s.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">อนุมัติแล้ว</p>
                <p className="text-2xl font-bold text-gray-900">
                  {submissions.filter(s => s.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">ปฏิเสธ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {submissions.filter(s => s.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KYC Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ผู้ใช้</TableHead>
                  <TableHead>เลขบัตรประชาชน</TableHead>
                  <TableHead>เลขบัญชี</TableHead>
                  <TableHead>วันที่ส่ง</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.length > 0 ? (
                  submissions
                    .sort((a, b) => {
                      if (a.status === 'pending' && b.status !== 'pending') return -1;
                      if (a.status !== 'pending' && b.status === 'pending') return 1;
                      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
                    })
                    .map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{submission.user.fullName}</p>
                            <p className="text-sm text-gray-500">{submission.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {submission.idCardNumber}
                        </TableCell>
                        <TableCell className="font-mono">
                          {submission.bankAccountNumber}
                        </TableCell>
                        <TableCell>
                          {new Date(submission.submittedAt).toLocaleDateString('th-TH')}
                        </TableCell>
                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedKYC(submission)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            ตรวจสอบ
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-gray-500">ไม่มีคำขอ KYC</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog open={!!selectedKYC} onOpenChange={() => setSelectedKYC(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ตรวจสอบเอกสาร KYC</DialogTitle>
            <DialogDescription>
              ตรวจสอบความถูกต้องของเอกสารก่อนอนุมัติ
            </DialogDescription>
          </DialogHeader>

          {selectedKYC && (
            <div className="space-y-6">
              {/* User Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="w-5 h-5" />
                    ข้อมูลผู้ใช้
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">ชื่อ-นามสกุล</p>
                      <p className="font-medium">{selectedKYC.user.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">อีเมล</p>
                      <p className="font-medium">{selectedKYC.user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">เบอร์โทร</p>
                      <p className="font-medium">{selectedKYC.user.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">เลขบัตรประชาชน</p>
                      <p className="font-medium font-mono">{selectedKYC.idCardNumber}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ID Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="w-5 h-5" />
                    บัตรประชาชน
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[200px]">
                    <img
                      src={selectedKYC.idCardImage || '/placeholder-id.png'}
                      alt="ID Card"
                      className="max-w-full max-h-[400px] object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-id.png';
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Selfie */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="w-5 h-5" />
                    รูปถ่ายคู่บัตร
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[200px]">
                    <img
                      src={selectedKYC.selfieImage || '/placeholder-selfie.png'}
                      alt="Selfie"
                      className="max-w-full max-h-[400px] object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-selfie.png';
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Bank Account */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="w-5 h-5" />
                    บัญชีธนาคาร
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">เลขที่บัญชี</p>
                    <p className="font-medium font-mono">{selectedKYC.bankAccountNumber}</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[200px]">
                    <img
                      src={selectedKYC.bankAccountImage || '/placeholder-bank.png'}
                      alt="Bank Account"
                      className="max-w-full max-h-[400px] object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-bank.png';
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Review Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเหตุ (ถ้ามี)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="เพิ่มหมายเหตุเกี่ยวกับการตรวจสอบ..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedKYC?.status === 'pending' && (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="destructive"
                  onClick={() => handleReview(selectedKYC.id, 'rejected')}
                  disabled={processing}
                  className="flex-1 sm:flex-none"
                >
                  <X className="w-4 h-4 mr-2" />
                  ปฏิเสธ
                </Button>
                <Button
                  onClick={() => handleReview(selectedKYC.id, 'approved')}
                  disabled={processing}
                  className="flex-1 sm:flex-none"
                >
                  <Check className="w-4 h-4 mr-2" />
                  อนุมัติ
                </Button>
              </div>
            )}
            {selectedKYC?.status !== 'pending' && (
              <Button variant="outline" onClick={() => setSelectedKYC(null)}>
                ปิด
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
