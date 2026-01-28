'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import StatusBadge from '@/components/StatusBadge';

interface UserProfile {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfile(response.data);
      setFormData({
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        phone: response.data.phone || '',
        bankName: response.data.bankAccount?.bankName || '',
        accountNumber: response.data.bankAccount?.accountNumber || '',
        accountName: response.data.bankAccount?.accountName || '',
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          bankAccount: {
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            accountName: formData.accountName,
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('อัปเดตข้อมูลโปรไฟล์สำเร็จ');
      setEditing(false);
      fetchProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถอัปเดตข้อมูลได้');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setChangingPassword(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600">ไม่พบข้อมูลโปรไฟล์</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">โปรไฟล์ของฉัน</h1>

      {/* ข้อมูลส่วนตัว */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">ข้อมูลส่วนตัว</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              แก้ไข
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleUpdateProfile}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อ
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  นามสกุล
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                อีเมล
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0812345678"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                บันทึก
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    phone: profile.phone || '',
                    bankName: profile.bankAccount?.bankName || '',
                    accountNumber: profile.bankAccount?.accountNumber || '',
                    accountName: profile.bankAccount?.accountName || '',
                  });
                }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex">
              <span className="text-gray-600 w-32">ชื่อ-นามสกุล:</span>
              <span className="text-gray-900 font-medium">
                {profile.firstName} {profile.lastName}
              </span>
            </div>
            <div className="flex">
              <span className="text-gray-600 w-32">อีเมล:</span>
              <span className="text-gray-900">{profile.email}</span>
            </div>
            <div className="flex">
              <span className="text-gray-600 w-32">เบอร์โทรศัพท์:</span>
              <span className="text-gray-900">{profile.phone || '-'}</span>
            </div>
            <div className="flex">
              <span className="text-gray-600 w-32">สมาชิกเมื่อ:</span>
              <span className="text-gray-900">
                {new Date(profile.createdAt).toLocaleDateString('th-TH')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ข้อมูลบัญชีธนาคาร */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">ข้อมูลบัญชีธนาคาร</h2>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อธนาคาร
              </label>
              <select
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">เลือกธนาคาร</option>
                <option value="กสิกรไทย">ธนาคารกสิกรไทย</option>
                <option value="กรุงเทพ">ธนาคารกรุงเทพ</option>
                <option value="กรุงไทย">ธนาคารกรุงไทย</option>
                <option value="ไทยพาณิชย์">ธนาคารไทยพาณิชย์</option>
                <option value="กรุงศรีอยุธยา">ธนาคารกรุงศรีอยุธยา</option>
                <option value="ทหารไทยธนชาต">ธนาคารทหารไทยธนชาต</option>
                <option value="ออมสิน">ธนาคารออมสิน</option>
                <option value="อาคารสงเคราะห์">ธนาคารอาคารสงเคราะห์</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลขที่บัญชี
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อบัญชี
              </label>
              <input
                type="text"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="นาย/นาง/นางสาว ..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex">
              <span className="text-gray-600 w-32">ธนาคาร:</span>
              <span className="text-gray-900">{profile.bankAccount?.bankName || '-'}</span>
            </div>
            <div className="flex">
              <span className="text-gray-600 w-32">เลขที่บัญชี:</span>
              <span className="text-gray-900">{profile.bankAccount?.accountNumber || '-'}</span>
            </div>
            <div className="flex">
              <span className="text-gray-600 w-32">ชื่อบัญชี:</span>
              <span className="text-gray-900">{profile.bankAccount?.accountName || '-'}</span>
            </div>
          </div>
        )}
      </div>

      {/* สถานะ KYC */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">สถานะการยืนยันตัวตน (KYC)</h2>
            <div className="flex items-center gap-3">
              <StatusBadge status={profile.kycStatus} type="kyc" />
              {profile.kycStatus === 'none' && (
                <p className="text-sm text-gray-600">คุณยังไม่ได้ยืนยันตัวตน</p>
              )}
              {profile.kycStatus === 'pending' && (
                <p className="text-sm text-gray-600">กำลังรอการตรวจสอบ</p>
              )}
              {profile.kycStatus === 'approved' && (
                <p className="text-sm text-green-600">ยืนยันตัวตนสำเร็จ</p>
              )}
              {profile.kycStatus === 'rejected' && (
                <p className="text-sm text-red-600">การยืนยันตัวตนไม่ผ่าน กรุณายืนยันใหม่</p>
              )}
            </div>
          </div>
          {(profile.kycStatus === 'none' || profile.kycStatus === 'rejected') && (
            <button
              onClick={() => router.push('/kyc')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              ยืนยันตัวตนเลย
            </button>
          )}
        </div>
      </div>

      {/* เปลี่ยนรหัสผ่าน */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">เปลี่ยนรหัสผ่าน</h2>

        <form onSubmit={handleChangePassword}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รหัสผ่านปัจจุบัน
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รหัสผ่านใหม่
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ยืนยันรหัสผ่านใหม่
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {changingPassword ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'เปลี่ยนรหัสผ่าน'}
          </button>
        </form>
      </div>
    </div>
  );
}
