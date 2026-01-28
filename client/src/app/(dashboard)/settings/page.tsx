'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface UserSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    transactionUpdates: boolean;
    messageAlerts: boolean;
    marketingEmails: boolean;
  };
  language: 'th' | 'en';
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      sms: false,
      transactionUpdates: true,
      messageAlerts: true,
      marketingEmails: false,
    },
    language: 'th',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSettings(response.data);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/settings`,
        settings,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('บันทึกการตั้งค่าสำเร็จ');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('กรุณากรอกรหัสผ่านเพื่อยืนยัน');
      return;
    }

    setDeleting(true);

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/users/account`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { password: deletePassword },
      });

      toast.success('ลบบัญชีสำเร็จ');
      localStorage.removeItem('token');
      router.push('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถลบบัญชีได้');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">การตั้งค่า</h1>

      {/* การแจ้งเตือน */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">การแจ้งเตือน</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">แจ้งเตือนทางอีเมล</h3>
              <p className="text-sm text-gray-600">รับการแจ้งเตือนผ่านทางอีเมล</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      email: e.target.checked,
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">แจ้งเตือนทาง SMS</h3>
              <p className="text-sm text-gray-600">รับการแจ้งเตือนผ่านข้อความ SMS</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.sms}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      sms: e.target.checked,
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">อัปเดตธุรกรรม</h3>
              <p className="text-sm text-gray-600">รับการแจ้งเตือนเมื่อมีการอัปเดตธุรกรรม</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.transactionUpdates}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      transactionUpdates: e.target.checked,
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">แจ้งเตือนข้อความ</h3>
              <p className="text-sm text-gray-600">รับการแจ้งเตือนเมื่อมีข้อความใหม่</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.messageAlerts}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      messageAlerts: e.target.checked,
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">อีเมลการตลาด</h3>
              <p className="text-sm text-gray-600">รับข่าวสารและโปรโมชั่นทางอีเมล</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.marketingEmails}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      marketingEmails: e.target.checked,
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* ภาษา */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">ภาษา</h2>

        <div className="space-y-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="language"
              value="th"
              checked={settings.language === 'th'}
              onChange={(e) => setSettings({ ...settings, language: e.target.value as 'th' | 'en' })}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-3 text-gray-900">ไทย</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="language"
              value="en"
              checked={settings.language === 'en'}
              onChange={(e) => setSettings({ ...settings, language: e.target.value as 'th' | 'en' })}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-3 text-gray-900">English</span>
          </label>
        </div>
      </div>

      {/* บันทึกการตั้งค่า */}
      <div className="flex justify-end mb-6">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>

      {/* ลบบัญชี */}
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200">
        <h2 className="text-xl font-semibold text-red-600 mb-4">ลบบัญชี</h2>
        <p className="text-gray-700 mb-4">
          การลบบัญชีเป็นการกระทำที่ไม่สามารถย้อนกลับได้ ข้อมูลทั้งหมดของคุณจะถูกลบอย่างถาวร
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            ลบบัญชีของฉัน
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium mb-2">คำเตือน!</p>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                <li>ข้อมูลส่วนตัวทั้งหมดจะถูกลบ</li>
                <li>ธุรกรรมที่กำลังดำเนินการจะถูกยกเลิก</li>
                <li>ไม่สามารถกู้คืนบัญชีได้</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                กรอกรหัสผ่านเพื่อยืนยัน
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="รหัสผ่านของคุณ"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePassword}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {deleting ? 'กำลังลบ...' : 'ยืนยันการลบบัญชี'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
