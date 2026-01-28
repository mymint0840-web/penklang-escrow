"use client";

import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm fixed w-full z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Escrow Platform</span>
          </Link>
          <Link href="/register">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับไปสมัครสมาชิก
            </Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">นโยบายความเป็นส่วนตัว</h1>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. บทนำ</h2>
            <p className="text-gray-600 leading-relaxed">
              Escrow Platform ("เรา", "ของเรา") ให้ความสำคัญกับความเป็นส่วนตัวของผู้ใช้งาน ("ท่าน", "ของท่าน")
              นโยบายความเป็นส่วนตัวนี้อธิบายวิธีการที่เราเก็บรวบรวม ใช้ และปกป้องข้อมูลส่วนบุคคลของท่าน
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. ข้อมูลที่เราเก็บรวบรวม</h2>
            <p className="text-gray-600 leading-relaxed mb-3">เราอาจเก็บรวบรวมข้อมูลต่อไปนี้:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>ข้อมูลส่วนบุคคล:</strong> ชื่อ-นามสกุล, อีเมล, เบอร์โทรศัพท์, ที่อยู่</li>
              <li><strong>ข้อมูลการยืนยันตัวตน (KYC):</strong> บัตรประชาชน, ภาพถ่ายใบหน้า</li>
              <li><strong>ข้อมูลการเงิน:</strong> หมายเลขบัญชีธนาคาร, ประวัติการทำธุรกรรม</li>
              <li><strong>ข้อมูลทางเทคนิค:</strong> IP address, ประเภทเบราว์เซอร์, อุปกรณ์ที่ใช้</li>
              <li><strong>ข้อมูลการใช้งาน:</strong> หน้าที่เข้าชม, เวลาที่ใช้งาน, การคลิก</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. วัตถุประสงค์ในการใช้ข้อมูล</h2>
            <p className="text-gray-600 leading-relaxed mb-3">เราใช้ข้อมูลของท่านเพื่อ:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>ให้บริการและดำเนินการธุรกรรม Escrow</li>
              <li>ยืนยันตัวตนและป้องกันการฉ้อโกง</li>
              <li>ติดต่อสื่อสารเกี่ยวกับบริการ</li>
              <li>ปรับปรุงและพัฒนาบริการ</li>
              <li>ปฏิบัติตามข้อกำหนดทางกฎหมาย</li>
              <li>แก้ไขข้อพิพาทและให้การสนับสนุนลูกค้า</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. การเปิดเผยข้อมูล</h2>
            <p className="text-gray-600 leading-relaxed mb-3">เราอาจเปิดเผยข้อมูลของท่านให้กับ:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>คู่สัญญาในธุรกรรม (ผู้ซื้อ/ผู้ขาย) เฉพาะข้อมูลที่จำเป็น</li>
              <li>ผู้ให้บริการภายนอก (เช่น ระบบชำระเงิน, Cloud hosting)</li>
              <li>หน่วยงานราชการตามที่กฎหมายกำหนด</li>
              <li>ที่ปรึกษาทางกฎหมายเมื่อมีข้อพิพาท</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. การรักษาความปลอดภัย</h2>
            <p className="text-gray-600 leading-relaxed">
              เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสมเพื่อปกป้องข้อมูลของท่าน รวมถึง:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
              <li>การเข้ารหัสข้อมูล SSL/TLS</li>
              <li>การจัดเก็บรหัสผ่านแบบ hash</li>
              <li>การควบคุมการเข้าถึงข้อมูล</li>
              <li>การตรวจสอบความปลอดภัยเป็นประจำ</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. การเก็บรักษาข้อมูล</h2>
            <p className="text-gray-600 leading-relaxed">
              เราจะเก็บรักษาข้อมูลส่วนบุคคลของท่านตราบเท่าที่จำเป็นสำหรับวัตถุประสงค์ที่ระบุไว้ในนโยบายนี้
              หรือตามที่กฎหมายกำหนด โดยทั่วไปข้อมูลธุรกรรมจะถูกเก็บไว้อย่างน้อย 5 ปีหลังจากธุรกรรมเสร็จสิ้น
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. สิทธิของท่าน</h2>
            <p className="text-gray-600 leading-relaxed mb-3">ท่านมีสิทธิ:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>เข้าถึงและขอสำเนาข้อมูลส่วนบุคคลของท่าน</li>
              <li>แก้ไขข้อมูลที่ไม่ถูกต้อง</li>
              <li>ขอให้ลบข้อมูล (ภายใต้เงื่อนไขที่กฎหมายกำหนด)</li>
              <li>คัดค้านการประมวลผลข้อมูล</li>
              <li>ขอให้จำกัดการประมวลผลข้อมูล</li>
              <li>ขอให้โอนย้ายข้อมูล</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. คุกกี้และเทคโนโลยีติดตาม</h2>
            <p className="text-gray-600 leading-relaxed">
              เราใช้คุกกี้และเทคโนโลยีที่คล้ายกันเพื่อปรับปรุงประสบการณ์การใช้งานของท่าน
              ท่านสามารถจัดการการตั้งค่าคุกกี้ได้ผ่านเบราว์เซอร์ของท่าน
              แต่การปิดใช้งานคุกกี้บางประเภทอาจส่งผลต่อการทำงานของเว็บไซต์
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. การเปลี่ยนแปลงนโยบาย</h2>
            <p className="text-gray-600 leading-relaxed">
              เราอาจปรับปรุงนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว
              การเปลี่ยนแปลงจะมีผลบังคับใช้ทันทีหลังจากประกาศบนแพลตฟอร์ม
              เราแนะนำให้ท่านตรวจสอบนโยบายนี้เป็นประจำ
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. การติดต่อเรา</h2>
            <p className="text-gray-600 leading-relaxed">
              หากท่านมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ หรือต้องการใช้สิทธิของท่าน
              กรุณาติดต่อเราผ่านระบบ Support ในแพลตฟอร์ม
            </p>
          </section>

          <div className="pt-6 border-t">
            <p className="text-sm text-gray-500 text-center">
              อัปเดตล่าสุด: มกราคม 2024
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/register">
            <Button size="lg">
              กลับไปสมัครสมาชิก
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
