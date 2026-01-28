'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Receipt,
  FileCheck,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import api from '@/lib/api';

interface DashboardStats {
  totalUsers: number;
  todayTransactions: number;
  pendingKYC: number;
  openDisputes: number;
  userGrowth: number;
  transactionGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'transaction' | 'kyc' | 'dispute';
  description: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    todayTransactions: 0,
    pendingKYC: 0,
    openDisputes: 0,
    userGrowth: 0,
    transactionGrowth: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/dashboard/activity'),
      ]);

      setStats(statsResponse.data);
      setRecentActivity(activityResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'ผู้ใช้ทั้งหมด',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      change: stats.userGrowth,
      changeLabel: 'จากเดือนที่แล้ว',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'ธุรกรรมวันนี้',
      value: stats.todayTransactions.toLocaleString(),
      icon: Receipt,
      change: stats.transactionGrowth,
      changeLabel: 'จากเมื่อวาน',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'รอตรวจ KYC',
      value: stats.pendingKYC.toLocaleString(),
      icon: FileCheck,
      change: 0,
      changeLabel: 'รายการรอดำเนินการ',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'ข้อพิพาทเปิดอยู่',
      value: stats.openDisputes.toLocaleString(),
      icon: AlertCircle,
      change: 0,
      changeLabel: 'รายการที่ต้องจัดการ',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="w-4 h-4" />;
      case 'transaction':
        return <Receipt className="w-4 h-4" />;
      case 'kyc':
        return <FileCheck className="w-4 h-4" />;
      case 'dispute':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-blue-100 text-blue-700';
      case 'transaction':
        return 'bg-green-100 text-green-700';
      case 'kyc':
        return 'bg-yellow-100 text-yellow-700';
      case 'dispute':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">ภาพรวมของระบบ Escrow Platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change >= 0;

          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  {stat.change !== 0 && (
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      <span>{Math.abs(stat.change)}%</span>
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  {stat.title}
                </h3>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">{stat.changeLabel}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>สถิติธุรกรรม 7 วันที่ผ่านมา</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">กราฟแสดงผลที่นี่</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>กิจกรรมล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.slice(0, 6).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                  >
                    <div
                      className={`p-2 rounded-lg ${getActivityBadgeColor(
                        activity.type
                      )}`}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString('th-TH')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">ยังไม่มีกิจกรรม</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ยอดธุรกรรมรวม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">฿0.00</p>
                <p className="text-sm text-gray-500 mt-1">เดือนนี้</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>อัตราความสำเร็จ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">0%</p>
                <p className="text-sm text-gray-500 mt-1">ธุรกรรมสำเร็จ</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>เวลาตอบสนองเฉลี่ย</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">0 นาที</p>
                <p className="text-sm text-gray-500 mt-1">การจัดการข้อพิพาท</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
