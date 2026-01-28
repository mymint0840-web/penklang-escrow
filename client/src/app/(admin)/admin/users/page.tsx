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
import { Search, Ban, CheckCircle, Shield } from 'lucide-react';
import api from '@/lib/api';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'buyer' | 'seller' | 'admin';
  status: 'active' | 'banned' | 'suspended';
  kycStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string, currentStatus: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะเปลี่ยนสถานะผู้ใช้นี้?')) return;

    try {
      const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });

      setUsers(users.map(user =>
        user.id === userId ? { ...user, status: newStatus as any } : user
      ));

      alert('อัปเดตสถานะผู้ใช้สำเร็จ');
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">ใช้งานปกติ</Badge>;
      case 'banned':
        return <Badge variant="destructive">ถูกแบน</Badge>;
      case 'suspended':
        return <Badge variant="warning">ถูกระงับ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default">ผู้ดูแลระบบ</Badge>;
      case 'seller':
        return <Badge variant="info">ผู้ขาย</Badge>;
      case 'buyer':
        return <Badge variant="secondary">ผู้ซื้อ</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getKYCBadge = (kycStatus: string) => {
    switch (kycStatus) {
      case 'approved':
        return <Badge variant="success">ผ่านการตรวจสอบ</Badge>;
      case 'pending':
        return <Badge variant="warning">รอตรวจสอบ</Badge>;
      case 'rejected':
        return <Badge variant="destructive">ไม่ผ่าน</Badge>;
      case 'not_submitted':
        return <Badge variant="outline">ยังไม่ส่ง</Badge>;
      default:
        return <Badge variant="outline">{kycStatus}</Badge>;
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
        <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ใช้</h1>
        <p className="text-gray-500 mt-1">
          จัดการและตรวจสอบผู้ใช้ทั้งหมดในระบบ
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="ค้นหาด้วยชื่อ, อีเมล หรือเบอร์โทร..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                <SelectItem value="active">ใช้งานปกติ</SelectItem>
                <SelectItem value="banned">ถูกแบน</SelectItem>
                <SelectItem value="suspended">ถูกระงับ</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="บทบาท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">บทบาททั้งหมด</SelectItem>
                <SelectItem value="buyer">ผู้ซื้อ</SelectItem>
                <SelectItem value="seller">ผู้ขาย</SelectItem>
                <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <span>
              พบ <span className="font-semibold">{filteredUsers.length}</span> รายการ
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อผู้ใช้</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>เบอร์โทร</TableHead>
                  <TableHead>บทบาท</TableHead>
                  <TableHead>สถานะ KYC</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่สมัคร</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {user.fullName.charAt(0).toUpperCase()}
                          </div>
                          <span>{user.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getKYCBadge(user.kycStatus)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString('th-TH')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant={
                                user.status === 'banned' ? 'default' : 'destructive'
                              }
                              onClick={() => handleBanUser(user.id, user.status)}
                            >
                              {user.status === 'banned' ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  ปลดแบน
                                </>
                              ) : (
                                <>
                                  <Ban className="w-4 h-4 mr-1" />
                                  แบน
                                </>
                              )}
                            </Button>
                          )}
                          {user.role === 'admin' && (
                            <Badge variant="outline">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-gray-500">ไม่พบข้อมูลผู้ใช้</p>
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
