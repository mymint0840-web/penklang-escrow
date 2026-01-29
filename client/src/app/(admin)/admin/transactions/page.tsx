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
  buyer: {
    fullName: string;
    email: string;
  };
  seller: {
    fullName: string;
    email: string;
  };
  amount: number;
  fee: number;
  status:
    | 'pending_payment'
    | 'payment_uploaded'
    | 'payment_verified'
    | 'completed'
    | 'disputed'
    | 'cancelled'
    | 'refunded';
  paymentSlip?: string;
  description: string;
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
    const matchesSearch =
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.buyer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.seller.fullName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Badge variant="warning">รอชำระเงิน</Badge>;
      case 'payment_uploaded':
        return <Badge variant="info">รอตรวจสอบ</Badge>;
      case 'payment_verified':
        return <Badge variant="success">ชำระแล้ว</Badge>;
      case 'completed':
        return <Badge variant="success">สำเร็จ</Badge>;
      case 'disputed':
        return <Badge variant="destructive">มีข้อพิพาท</Badge>;
      case 'cancelled':
        return <Badge variant="outline">ยกเลิก</Badge>;
      case 'refunded':
        return <Badge variant="secondary">คืนเงิน</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending_payment':
        return 'รอชำระเงิน';
      case 'payment_uploaded':
        return 'รอตรวจสอบ';
      case 'payment_verified':
        return 'ชำระแล้ว';
      case 'completed':
        return 'สำเร็จ';
      case 'disputed':
        return 'มีข้อพิพาท';
      case 'cancelled':
        return 'ยกเลิก';
      case 'refunded':
        return 'คืนเงิน';
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
                {transactions.filter((tx) => tx.status === 'payment_uploaded').length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-gray-500">สำเร็จ</p>
              <p className="text-2xl font-bold text-green-600">
                {transactions.filter((tx) => tx.status === 'completed').length}
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
                <SelectItem value="pending_payment">รอชำระเงิน</SelectItem>
                <SelectItem value="payment_uploaded">รอตรวจสอบ</SelectItem>
                <SelectItem value="payment_verified">ชำระแล้ว</SelectItem>
                <SelectItem value="completed">สำเร็จ</SelectItem>
                <SelectItem value="disputed">มีข้อพิพาท</SelectItem>
                <SelectItem value="cancelled">ยกเลิก</SelectItem>
                <SelectItem value="refunded">คืนเงิน</SelectItem>
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
                          <p className="font-medium">{tx.buyer.fullName}</p>
                          <p className="text-sm text-gray-500">{tx.buyer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tx.seller.fullName}</p>
                          <p className="text-sm text-gray-500">{tx.seller.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {tx.description}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ฿{tx.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-gray-500">
                        ฿{tx.fee.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell>
                        {new Date(tx.createdAt).toLocaleDateString('th-TH')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {tx.status === 'payment_uploaded' && (
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
