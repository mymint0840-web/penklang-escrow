'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, CheckCircle, Eye, Download } from 'lucide-react';
import api from '@/lib/api';

interface Transaction {
  id: string;
  buyerId: string;
  sellerId: string;
  buyer?: {
    fullName?: string;
    displayName?: string;
    email?: string;
  } | null;
  seller?: {
    fullName?: string;
    displayName?: string;
    email?: string;
  } | null;
  amount: number;
  feeAmount?: number;
  fee?: number;
  status: string;
  paymentSlip?: string;
  title?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/admin/transactions');
      // Extract data from API response structure { success: true, data: ... }
      const txData = response.data.data || response.data;
      setTransactions(Array.isArray(txData) ? txData : []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (transactionId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะยืนยันการชำระเงินนี้?')) return;

    try {
      await api.post(`/admin/transactions/${transactionId}/verify-payment`);

      setTransactions(
        transactions.map((tx) =>
          tx.id === transactionId ? { ...tx, status: 'payment_verified' } : tx
        )
      );

      alert('ยืนยันการชำระเงินสำเร็จ');
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('เกิดข้อผิดพลาดในการยืนยันการชำระเงิน');
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const buyerName = tx.buyer?.fullName || tx.buyer?.displayName || '';
    const sellerName = tx.seller?.fullName || tx.seller?.displayName || '';
    const txTitle = tx.title || tx.description || '';

    const matchesSearch =
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING_PAYMENT':
        return <Badge variant="warning">รอชำระเงิน</Badge>;
      case 'PAYMENT_VERIFYING':
        return <Badge variant="info">รอตรวจสอบ</Badge>;
      case 'PAID_HOLDING':
        return <Badge variant="success">ชำระแล้ว (รอส่งของ)</Badge>;
      case 'DELIVERED_PENDING':
        return <Badge variant="info">ส่งของแล้ว (รอยืนยัน)</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">สำเร็จ</Badge>;
      case 'DISPUTE_OPEN':
        return <Badge variant="destructive">มีข้อพิพาท</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">ยกเลิก</Badge>;
      case 'REFUNDED':
        return <Badge variant="secondary">คืนเงิน</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline">หมดอายุ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'WAITING_PAYMENT':
        return 'รอชำระเงิน';
      case 'PAYMENT_VERIFYING':
        return 'รอตรวจสอบ';
      case 'PAID_HOLDING':
        return 'ชำระแล้ว';
      case 'DELIVERED_PENDING':
        return 'ส่งของแล้ว';
      case 'COMPLETED':
        return 'สำเร็จ';
      case 'DISPUTE_OPEN':
        return 'มีข้อพิพาท';
      case 'CANCELLED':
        return 'ยกเลิก';
      case 'REFUNDED':
        return 'คืนเงิน';
      case 'EXPIRED':
        return 'หมดอายุ';
      default:
        return status;
    }
  };

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ธุรกรรมทั้งหมด</h1>
        <p className="text-gray-500 mt-1">
          ตรวจสอบและจัดการธุรกรรมในระบบ
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-gray-500">ทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">
                {transactions.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-gray-500">รอตรวจสอบ</p>
              <p className="text-2xl font-bold text-yellow-600">
                {transactions.filter((tx) => tx.status === 'PAYMENT_VERIFYING').length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-gray-500">สำเร็จ</p>
              <p className="text-2xl font-bold text-green-600">
                {transactions.filter((tx) => tx.status === 'COMPLETED').length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-gray-500">ยอดรวม</p>
              <p className="text-2xl font-bold text-blue-600">
                ฿
                {transactions
                  .reduce((sum, tx) => sum + tx.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="ค้นหาด้วย ID, ชื่อผู้ซื้อ หรือผู้ขาย..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                <SelectItem value="WAITING_PAYMENT">รอชำระเงิน</SelectItem>
                <SelectItem value="PAYMENT_VERIFYING">รอตรวจสอบ</SelectItem>
                <SelectItem value="PAID_HOLDING">ชำระแล้ว</SelectItem>
                <SelectItem value="DELIVERED_PENDING">ส่งของแล้ว</SelectItem>
                <SelectItem value="COMPLETED">สำเร็จ</SelectItem>
                <SelectItem value="DISPUTE_OPEN">มีข้อพิพาท</SelectItem>
                <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
                <SelectItem value="REFUNDED">คืนเงิน</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              ส่งออก
            </Button>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            พบ <span className="font-semibold">{filteredTransactions.length}</span>{' '}
            รายการ
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>ผู้ซื้อ</TableHead>
                  <TableHead>ผู้ขาย</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead className="text-right">จำนวนเงิน</TableHead>
                  <TableHead className="text-right">ค่าธรรมเนียม</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่สร้าง</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-sm">
                        {tx.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tx.buyer?.fullName || tx.buyer?.displayName || '-'}</p>
                          <p className="text-sm text-gray-500">{tx.buyer?.email || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tx.seller?.fullName || tx.seller?.displayName || '-'}</p>
                          <p className="text-sm text-gray-500">{tx.seller?.email || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {tx.title || tx.description || '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ฿{(tx.amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-gray-500">
                        ฿{(tx.feeAmount || tx.fee || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell>
                        {new Date(tx.createdAt).toLocaleDateString('th-TH')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {tx.status === 'PAYMENT_VERIFYING' && (
                            <Button
                              size="sm"
                              onClick={() => handleVerifyPayment(tx.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              ยืนยัน
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <p className="text-gray-500">ไม่พบข้อมูลธุรกรรม</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
