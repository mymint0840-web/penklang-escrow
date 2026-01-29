'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Percent,
  DollarSign,
  Building2,
  Power,
  Save,
  RefreshCw,
} from 'lucide-react';
import api from '@/lib/api';

interface SystemSettings {
  transactionFeePercent: number;
  minTransactionAmount: number;
  maxTransactionAmount: number;
  platformBankName: string;
  platformBankAccountNumber: string;
  platformBankAccountName: string;
  maintenanceMode: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    transactionFeePercent: 2.5,
    minTransactionAmount: 100,
    maxTransactionAmount: 1000000,
    platformBankName: '',
    platformBankAccountNumber: '',
    platformBankAccountName: '',
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      // Extract data from API response structure { success: true, data: ... }
      const settingsData = response.data.data || response.data;

      // Map backend field names to frontend expected names
      setSettings({
        transactionFeePercent: settingsData.feePercent ?? 2.5,
        minTransactionAmount: settingsData.minTransactionAmount ?? 100,
        maxTransactionAmount: settingsData.maxTransactionAmount ?? 1000000,
        platformBankName: settingsData.platformBankName ?? '',
        platformBankAccountNumber: settingsData.platformBankAccountNo ?? '',
        platformBankAccountName: settingsData.platformBankAccountName ?? '',
        maintenanceMode: settingsData.maintenanceMode ?? false,
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SystemSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะบันทึกการตั้งค่าใหม่?')) return;

    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      setHasChanges(false);
      alert('บันทึกการตั้งค่าสำเร็จ');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะยกเลิกการเปลี่ยนแปลง?')) return;
    fetchSettings();
    setHasChanges(false);
  };

  const toggleMaintenanceMode = async () => {
    const newMode = !settings.maintenanceMode;
    const message = newMode
      ? 'เปิดโหมดปิดปรับปรุงจะทำให้ผู้ใช้ไม่สามารถใช้งานระบบได้ คุณแน่ใจหรือไม่?'
      : 'ปิดโหมดปิดปรับปรุงจะเปิดให้ผู้ใช้เข้าใช้งานได้ตามปกติ คุณแน่ใจหรือไม่?';

    if (!confirm(message)) return;

    try {
      await api.post('/admin/settings/maintenance-mode', {
        enabled: newMode,
      });

      setSettings((prev) => ({
        ...prev,
        maintenanceMode: newMode,
      }));

      alert(`${newMode ? 'เปิด' : 'ปิด'}โหมดปิดปรับปรุงสำเร็จ`);
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      alert('เกิดข้อผิดพลาดในการเปลี่ยนโหมดปิดปรับปรุง');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ตั้งค่าระบบ</h1>
          <p className="text-gray-500 mt-1">
            จัดการการตั้งค่าและกำหนดค่าต่างๆ ของระบบ
          </p>
        </div>

        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        )}
      </div>

      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Power className="w-5 h-5" />
              โหมดปิดปรับปรุง
            </div>
            <Badge
              variant={settings.maintenanceMode ? 'destructive' : 'success'}
            >
              {settings.maintenanceMode ? 'เปิดอยู่' : 'ปิดอยู่'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 mb-1">
                {settings.maintenanceMode
                  ? 'ระบบอยู่ในโหมดปิดปรับปรุง ผู้ใช้ไม่สามารถเข้าใช้งานได้'
                  : 'ระบบเปิดให้บริการตามปกติ'}
              </p>
              <p className="text-sm text-gray-500">
                เปิดโหมดนี้เมื่อต้องการปิดปรับปรุงระบบหรือแก้ไขปัญหา
              </p>
            </div>
            <Button
              variant={settings.maintenanceMode ? 'default' : 'destructive'}
              onClick={toggleMaintenanceMode}
            >
              {settings.maintenanceMode ? 'ปิดโหมด' : 'เปิดโหมด'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Fees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            ค่าธรรมเนียมและขั้นต่ำ/สูงสุด
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="feePercent">ค่าธรรมเนียม (%)</Label>
              <div className="relative mt-2">
                <Input
                  id="feePercent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={settings.transactionFeePercent}
                  onChange={(e) =>
                    handleInputChange(
                      'transactionFeePercent',
                      parseFloat(e.target.value)
                    )
                  }
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  %
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                ค่าธรรมเนียมต่อธุรกรรม
              </p>
            </div>

            <div>
              <Label htmlFor="minAmount">จำนวนเงินขั้นต่ำ</Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ฿
                </span>
                <Input
                  id="minAmount"
                  type="number"
                  min="0"
                  value={settings.minTransactionAmount}
                  onChange={(e) =>
                    handleInputChange(
                      'minTransactionAmount',
                      parseInt(e.target.value)
                    )
                  }
                  className="pl-8"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                ยอดต่ำสุดต่อธุรกรรม
              </p>
            </div>

            <div>
              <Label htmlFor="maxAmount">จำนวนเงินสูงสุด</Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ฿
                </span>
                <Input
                  id="maxAmount"
                  type="number"
                  min="0"
                  value={settings.maxTransactionAmount}
                  onChange={(e) =>
                    handleInputChange(
                      'maxTransactionAmount',
                      parseInt(e.target.value)
                    )
                  }
                  className="pl-8"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                ยอดสูงสุดต่อธุรกรรม
              </p>
            </div>
          </div>

          {/* Fee Example */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">
              ตัวอย่างการคำนวณ
            </p>
            <div className="space-y-1 text-sm text-blue-800">
              <p>
                ธุรกรรม ฿10,000 → ค่าธรรมเนียม ฿
                {((10000 * settings.transactionFeePercent) / 100).toFixed(2)}
              </p>
              <p>
                ยอดรวมที่ผู้ซื้อต้องจ่าย ฿
                {(10000 + (10000 * settings.transactionFeePercent) / 100).toFixed(
                  2
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Bank Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            ข้อมูลบัญชีธนาคารของแพลตฟอร์ม
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bankName">ชื่อธนาคาร</Label>
            <Input
              id="bankName"
              value={settings.platformBankName}
              onChange={(e) =>
                handleInputChange('platformBankName', e.target.value)
              }
              placeholder="เช่น ธนาคารกสิกรไทย"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="accountNumber">เลขที่บัญชี</Label>
            <Input
              id="accountNumber"
              value={settings.platformBankAccountNumber}
              onChange={(e) =>
                handleInputChange('platformBankAccountNumber', e.target.value)
              }
              placeholder="เช่น 123-4-56789-0"
              className="mt-2 font-mono"
            />
          </div>

          <div>
            <Label htmlFor="accountName">ชื่อบัญชี</Label>
            <Input
              id="accountName"
              value={settings.platformBankAccountName}
              onChange={(e) =>
                handleInputChange('platformBankAccountName', e.target.value)
              }
              placeholder="เช่น บริษัท เอสโครว์ จำกัด"
              className="mt-2"
            />
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>หมายเหตุ:</strong> บัญชีธนาคารนี้จะแสดงให้ผู้ใช้เห็นเมื่อทำธุรกรรม
              กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนบันทึก
            </p>
          </div>
        </CardContent>
      </Card>

      {/* System Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            สถิติระบบ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">รายได้จากค่าธรรมเนียม</p>
              <p className="text-2xl font-bold text-gray-900">฿0.00</p>
              <p className="text-xs text-gray-500 mt-1">เดือนนี้</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">ธุรกรรมที่สำเร็จ</p>
              <p className="text-2xl font-bold text-green-600">0</p>
              <p className="text-xs text-gray-500 mt-1">เดือนนี้</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">มูลค่าธุรกรรมรวม</p>
              <p className="text-2xl font-bold text-blue-600">฿0.00</p>
              <p className="text-xs text-gray-500 mt-1">เดือนนี้</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Power className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                เกี่ยวกับการตั้งค่า
              </h3>
              <p className="text-sm text-gray-600">
                การเปลี่ยนแปลงการตั้งค่าบางอย่างอาจส่งผลกระทบต่อผู้ใช้ทั้งหมดในระบบ
                กรุณาพิจารณาอย่างรอบคอบก่อนทำการเปลี่ยนแปลง
                และควรแจ้งให้ผู้ใช้ทราบล่วงหน้าหากมีการเปลี่ยนแปลงที่สำคัญ
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
