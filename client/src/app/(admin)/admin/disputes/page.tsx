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
import { AlertCircle, Eye, CheckCircle, Users, DollarSign } from 'lucide-react';
import api from '@/lib/api';

interface Dispute {
  id: string;
  transactionId: string;
  transaction: {
    amount: number;
    description: string;
    buyer: {
      fullName: string;
      email: string;
    };
    seller: {
      fullName: string;
      email: string;
    };
  };
  initiatedBy: 'buyer' | 'seller';
  reason: string;
  status: 'open' | 'investigating' | 'resolved';
  resolution?: 'refund_buyer' | 'release_seller' | 'split_50_50';
  resolutionNote?: string;
  createdAt: string;
  resolvedAt?: string;
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState<string>('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const response = await api.get('/admin/disputes');
      setDisputes(response.data);
    } catch (error) {
      console.error('Error fetching disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!resolution) {
      alert('กรุณาเลือกวิธีการแก้ไขข้อพิพาท');
      return;
    }

    if (!confirm('คุณแน่ใจหรือไม่ที่จะดำเนินการแก้ไขข้อพิพาทนี้?')) {
      return;
    }

    setProcessing(true);
    try {
      await api.post(`/admin/disputes/${selectedDispute?.id}/resolve`, {
        resolution,
        note: resolutionNote,
      });

      setDisputes(
        disputes.map((dispute) =>
          dispute.id === selectedDispute?.id
            ? {
                ...dispute,
                status: 'resolved',
                resolution: resolution as any,
                resolutionNote,
                resolvedAt: new Date().toISOString(),
              }
            : dispute
        )
      );

      setSelectedDispute(null);
      setResolution('');
      setResolutionNote('');
      alert('แก้ไขข้อพิพาทสำเร็จ');
    } catch (error) {
      console.error('Error resolving dispute:', error);
      alert('เกิดข้อผิดพลาดในการแก้ไขข้อพิพาท');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive">เปิดอยู่</Badge>;
      case 'investigating':
        return <Badge variant="warning">กำลังตรวจสอบ</Badge>;
      case 'resolved':
        return <Badge variant="success">แก้ไขแล้ว</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getResolutionText = (resolution?: string) => {
    switch (resolution) {
      case 'refund_buyer':
        return 'คืนเงินให้ผู้ซื้อ';
      case 'release_seller':
        return 'โอนเงินให้ผู้ขาย';
      case 'split_50_50':
        return 'แบ่งครึ่ง';
      default:
        return '-';
    }
  };

  const openDisputesCount = disputes.filter((d) => d.status !== 'resolved').length;

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
          <h1 className="text-3xl font-bold text-gray-900">จัดการข้อพิพาท</h1>
          <p className="text-gray-500 mt-1">
            ตรวจสอบและแก้ไขข้อพิพาทระหว่างผู้ใช้
          </p>
        </div>
        {openDisputesCount > 0 && (
          <Badge variant="destructive" className="text-lg px-4 py-2">
            {openDisputesCount} รายการที่ต้องจัดการ
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">เปิดอยู่</p>
                <p className="text-2xl font-bold text-gray-900">
                  {disputes.filter((d) => d.status === 'open').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">กำลังตรวจสอบ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {disputes.filter((d) => d.status === 'investigating').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">แก้ไขแล้ว</p>
                <p className="text-2xl font-bold text-gray-900">
                  {disputes.filter((d) => d.status === 'resolved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disputes Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>ธุรกรรม</TableHead>
                  <TableHead>ผู้ซื้อ</TableHead>
                  <TableHead>ผู้ขาย</TableHead>
                  <TableHead className="text-right">จำนวนเงิน</TableHead>
                  <TableHead>เริ่มโดย</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่สร้าง</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.length > 0 ? (
                  disputes
                    .sort((a, b) => {
                      if (a.status !== 'resolved' && b.status === 'resolved')
                        return -1;
                      if (a.status === 'resolved' && b.status !== 'resolved')
                        return 1;
                      return (
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                      );
                    })
                    .map((dispute) => (
                      <TableRow key={dispute.id}>
                        <TableCell className="font-mono text-sm">
                          {dispute.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="font-medium truncate">
                            {dispute.transaction.description}
                          </p>
                          <p className="text-sm text-gray-500">
                            {dispute.transactionId.slice(0, 8)}...
                          </p>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {dispute.transaction.buyer.fullName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {dispute.transaction.buyer.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {dispute.transaction.seller.fullName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {dispute.transaction.seller.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ฿{dispute.transaction.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {dispute.initiatedBy === 'buyer'
                              ? 'ผู้ซื้อ'
                              : 'ผู้ขาย'}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                        <TableCell>
                          {new Date(dispute.createdAt).toLocaleDateString('th-TH')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedDispute(dispute)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            รายละเอียด
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <p className="text-gray-500">ไม่มีข้อพิพาท</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dispute Detail Modal */}
      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดข้อพิพาท</DialogTitle>
            <DialogDescription>
              ตรวจสอบข้อมูลและเลือกวิธีการแก้ไขข้อพิพาท
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-6">
              {/* Transaction Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <DollarSign className="w-5 h-5" />
                    ข้อมูลธุรกรรม
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">รายละเอียด</p>
                      <p className="font-medium">
                        {selectedDispute.transaction.description}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">จำนวนเงิน</p>
                      <p className="font-medium text-lg">
                        ฿{selectedDispute.transaction.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Parties Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="w-5 h-5" />
                    คู่กรณี
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">ผู้ซื้อ</p>
                      <p className="font-medium">
                        {selectedDispute.transaction.buyer.fullName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedDispute.transaction.buyer.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">ผู้ขาย</p>
                      <p className="font-medium">
                        {selectedDispute.transaction.seller.fullName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedDispute.transaction.seller.email}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dispute Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เริ่มโดย
                </label>
                <Badge variant="outline">
                  {selectedDispute.initiatedBy === 'buyer' ? 'ผู้ซื้อ' : 'ผู้ขาย'}
                </Badge>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เหตุผล
                </label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-900">{selectedDispute.reason}</p>
                </div>
              </div>

              {selectedDispute.status === 'resolved' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      การแก้ไข
                    </label>
                    <Badge variant="success">
                      {getResolutionText(selectedDispute.resolution)}
                    </Badge>
                  </div>

                  {selectedDispute.resolutionNote && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        หมายเหตุ
                      </label>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-900">
                          {selectedDispute.resolutionNote}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedDispute.status !== 'resolved' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เลือกวิธีการแก้ไข
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="resolution"
                          value="refund_buyer"
                          checked={resolution === 'refund_buyer'}
                          onChange={(e) => setResolution(e.target.value)}
                          className="mr-3"
                        />
                        <div>
                          <p className="font-medium">คืนเงินให้ผู้ซื้อ</p>
                          <p className="text-sm text-gray-500">
                            คืนเงินเต็มจำนวนให้กับผู้ซื้อ
                          </p>
                        </div>
                      </label>

                      <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="resolution"
                          value="release_seller"
                          checked={resolution === 'release_seller'}
                          onChange={(e) => setResolution(e.target.value)}
                          className="mr-3"
                        />
                        <div>
                          <p className="font-medium">โอนเงินให้ผู้ขาย</p>
                          <p className="text-sm text-gray-500">
                            ปล่อยเงินให้กับผู้ขายตามปกติ
                          </p>
                        </div>
                      </label>

                      <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="resolution"
                          value="split_50_50"
                          checked={resolution === 'split_50_50'}
                          onChange={(e) => setResolution(e.target.value)}
                          className="mr-3"
                        />
                        <div>
                          <p className="font-medium">แบ่งครึ่ง</p>
                          <p className="text-sm text-gray-500">
                            แบ่งเงินให้ทั้งสองฝ่ายฝ่ายละครึ่ง
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      หมายเหตุการแก้ไข
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="เพิ่มหมายเหตุเกี่ยวกับการแก้ไขข้อพิพาท..."
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedDispute?.status !== 'resolved' && (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setSelectedDispute(null)}
                  className="flex-1 sm:flex-none"
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleResolve}
                  disabled={!resolution || processing}
                  className="flex-1 sm:flex-none"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  แก้ไขข้อพิพาท
                </Button>
              </div>
            )}
            {selectedDispute?.status === 'resolved' && (
              <Button variant="outline" onClick={() => setSelectedDispute(null)}>
                ปิด
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
