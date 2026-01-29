'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import FileUpload from '@/components/FileUpload';
import StatusBadge from '@/components/StatusBadge';

interface KYCData {
  status: 'none' | 'pending' | 'approved' | 'rejected';
  idCardNumber?: string;
  dateOfBirth?: string;
  idCardFront?: string;
  idCardBack?: string;
  selfieWithId?: string;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export default function KYCPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [formData, setFormData] = useState({
    idCardNumber: '',
    dateOfBirth: '',
    idCardFront: null as File | null,
    idCardBack: null as File | null,
    selfieWithId: null as File | null,
  });

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setKycData(response.data);
    } catch (error: any) {
      console.error('Error fetching KYC status:', error);
      if (error.response?.status === 404) {
        setKycData({ status: 'none' });
      } else if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.idCardFront || !formData.idCardBack || !formData.selfieWithId) {
      toast.error('กรุณาอัปโหลดรูปภาพให้ครบถ้วน');
      return;
    }

    if (formData.idCardNumber.length !== 13) {
      toast.error('เลขบัตรประชาชนต้องมี 13 หลัก');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const submitFormData = new FormData();

      submitFormData.append('idCardNumber', formData.idCardNumber);
      submitFormData.append('dateOfBirth', formData.dateOfBirth);
      submitFormData.append('idCardFront', formData.idCardFront);
      submitFormData.append('idCardBack', formData.idCardBack);
      submitFormData.append('selfieWithId', formData.selfieWithId);

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/kyc/submit`,
        submitFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      toast.success('ส่งข้อมูลการยืนยันตัวตนสำเร็จ');
      fetchKYCStatus();
    } catch (error: any) {
      console.error('Error submitting KYC:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถส่งข้อมูลได้');
    } finally {
      setSubmitting(false);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ยืนยันตัวตน (KYC)</h1>
        <p className="text-gray-600">
          กรุณาอัปโหลดเอกสารและข้อมูลเพื่อยืนยันตัวตนของคุณ เพื่อความปลอดภัยในการทำธุรกรรม
        </p>
      </div>

      {kycData && kycData.status !== 'none' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">สถานะการยืนยันตัวตน</h2>
            <StatusBadge status={kycData.status} type="kyc" />
          </div>

          <div className="space-y-3">
            {kycData.submittedAt && (
              <div className="flex">
                <span className="text-gray-600 w-40">วันที่ส่ง:</span>
                <span className="text-gray-900">
                  {new Date(kycData.submittedAt).toLocaleString('th-TH')}
                </span>
              </div>
            )}
            {kycData.reviewedAt && (
              <div className="flex">
                <span className="text-gray-600 w-40">วันที่ตรวจสอบ:</span>
                <span className="text-gray-900">
                  {new Date(kycData.reviewedAt).toLocaleString('th-TH')}
                </span>
              </div>
            )}
            {kycData.status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-yellow-800">
                  ข้อมูลของคุณอยู่ระหว่างการตรวจสอบ โปรดรอการอนุมัติจากทีมงาน (ประมาณ 1-3 วันทำการ)
                </p>
              </div>
            )}
            {kycData.status === 'approved' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <p className="text-green-800 font-medium">
                  ยืนยันตัวตนสำเร็จ! คุณสามารถใช้งานระบบได้เต็มรูปแบบแล้ว
                </p>
              </div>
            )}
            {kycData.status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <p className="text-red-800 font-medium mb-2">
                  การยืนยันตัวตนไม่ผ่านการตรวจสอบ
                </p>
                {kycData.rejectionReason && (
                  <p className="text-red-700 text-sm">
                    เหตุผล: {kycData.rejectionReason}
                  </p>
                )}
                <p className="text-red-700 text-sm mt-2">
                  กรุณาส่งเอกสารใหม่อีกครั้ง
                </p>
              </div>
            )}
          </div>

          {kycData.status === 'approved' && (
            <button
              onClick={() => router.push('/profile')}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              กลับไปหน้าโปรไฟล์
            </button>
          )}
        </div>
      )}

      {(!kycData || kycData.status === 'none' || kycData.status === 'rejected') && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* เลขบัตรประชาชน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลขบัตรประชาชน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.idCardNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 13);
                  setFormData({ ...formData, idCardNumber: value });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1234567890123"
                required
                maxLength={13}
              />
              <p className="text-sm text-gray-500 mt-1">กรุณากรอกเลขบัตรประชาชน 13 หลัก</p>
            </div>

            {/* วันเกิด */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันเกิด <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* อัปโหลดรูปบัตรประชาชนด้านหน้า */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                บัตรประชาชนด้านหน้า <span className="text-red-500">*</span>
              </label>
              <FileUpload
                onFileSelect={(file) => setFormData({ ...formData, idCardFront: file })}
                accept="image/*"
                maxSize={5}
                preview={formData.idCardFront instanceof File ? URL.createObjectURL(formData.idCardFront) : undefined}
              />
              <p className="text-sm text-gray-500 mt-1">
                กรุณาถ่ายภาพบัตรประชาชนด้านหน้าให้ชัดเจน ขนาดไม่เกิน 5 MB
              </p>
            </div>

            {/* อัปโหลดรูปบัตรประชาชนด้านหลัง */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                บัตรประชาชนด้านหลัง <span className="text-red-500">*</span>
              </label>
              <FileUpload
                onFileSelect={(file) => setFormData({ ...formData, idCardBack: file })}
                accept="image/*"
                maxSize={5}
                preview={formData.idCardBack instanceof File ? URL.createObjectURL(formData.idCardBack) : undefined}
              />
              <p className="text-sm text-gray-500 mt-1">
                กรุณาถ่ายภาพบัตรประชาชนด้านหลังให้ชัดเจน ขนาดไม่เกิน 5 MB
              </p>
            </div>

            {/* อัปโหลดรูปถ่ายคู่กับบัตรประชาชน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รูปถ่ายคู่กับบัตรประชาชน <span className="text-red-500">*</span>
              </label>
              <FileUpload
                onFileSelect={(file) => setFormData({ ...formData, selfieWithId: file })}
                accept="image/*"
                maxSize={5}
                preview={formData.selfieWithId instanceof File ? URL.createObjectURL(formData.selfieWithId) : undefined}
              />
              <p className="text-sm text-gray-500 mt-1">
                กรุณาถ่ายภาพตัวคุณถือบัตรประชาชนให้เห็นหน้าชัดเจน ขนาดไม่เกิน 5 MB
              </p>
            </div>

            {/* ข้อกำหนด */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">ข้อกำหนดในการอัปโหลดรูปภาพ:</h3>
              <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                <li>รูปภาพต้องชัดเจน ไม่มัว ไม่สะท้อนแสง</li>
                <li>ข้อมูลในบัตรต้องอ่านได้ทั้งหมด</li>
                <li>บัตรประชาชนต้องยังไม่หมดอายุ</li>
                <li>ใบหน้าในรูปถ่ายต้องตรงกับบัตรประชาชน</li>
                <li>ไม่ใช้รูปถ่ายเก่าหรือรูปถ่ายจากหน้าจอ</li>
              </ul>
            </div>

            {/* ปุ่มส่ง */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูลเพื่อยืนยันตัวตน'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/profile')}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
