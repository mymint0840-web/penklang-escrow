"use client";

import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold mb-8">เงื่อนไขและข้อตกลงการใช้บริการ</h1>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. ข้อตกลงทั่วไป</h2>
            <p className="text-gray-600 leading-relaxed">
              การใช้บริการแพลตฟอร์ม Escrow Platform ถือว่าท่านได้อ่านและยอมรับเงื่อนไขการใช้บริการทั้งหมดแล้ว
              หากท่านไม่ยอมรับเงื่อนไขใดๆ กรุณาหยุดการใช้บริการทันที
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. คำจำกัดความ</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>"แพลตฟอร์ม"</strong> หมายถึง Escrow Platform และบริการที่เกี่ยวข้อง</li>
              <li><strong>"ผู้ใช้"</strong> หมายถึง บุคคลที่ลงทะเบียนและใช้งานแพลตฟอร์ม</li>
              <li><strong>"ธุรกรรม"</strong> หมายถึง การซื้อขายสินค้าหรือบริการผ่านระบบ Escrow</li>
              <li><strong>"เอสโครว์"</strong> หมายถึง ระบบพักเงินที่ทำหน้าที่เป็นตัวกลางระหว่างผู้ซื้อและผู้ขาย</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. การลงทะเบียนและบัญชีผู้ใช้</h2>
            <p className="text-gray-600 leading-relaxed">
              ผู้ใช้ต้องให้ข้อมูลที่ถูกต้องและเป็นปัจจุบันในการลงทะเบียน ผู้ใช้มีหน้าที่รักษาความปลอดภัยของบัญชี
              และรหัสผ่าน หากพบการใช้งานที่ผิดปกติ กรุณาแจ้งทีมงานทันที
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. การทำธุรกรรม</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>ผู้ซื้อจะโอนเงินเข้าระบบเอสโครว์ก่อนที่ผู้ขายจะส่งมอบสินค้า/บริการ</li>
              <li>เมื่อผู้ซื้อยืนยันได้รับสินค้า/บริการแล้ว เงินจะถูกโอนให้ผู้ขาย</li>
              <li>หากมีข้อพิพาท ทีมงานจะเป็นผู้ตัดสินใจขั้นสุดท้าย</li>
              <li>แพลตฟอร์มอาจเรียกเก็บค่าธรรมเนียมตามที่กำหนด</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. ข้อห้ามในการใช้บริการ</h2>
            <p className="text-gray-600 leading-relaxed mb-2">ผู้ใช้ไม่สามารถใช้แพลตฟอร์มเพื่อ:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>ซื้อขายสินค้าหรือบริการที่ผิดกฎหมาย</li>
              <li>ฉ้อโกงหรือหลอกลวงผู้อื่น</li>
              <li>ฟอกเงินหรือกระทำการใดๆ ที่เกี่ยวข้องกับการเงินที่ผิดกฎหมาย</li>
              <li>ละเมิดทรัพย์สินทางปัญญาของผู้อื่น</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. ความเป็นส่วนตัว</h2>
            <p className="text-gray-600 leading-relaxed">
              เราเก็บรักษาข้อมูลส่วนบุคคลของท่านตามนโยบายความเป็นส่วนตัว
              ข้อมูลจะถูกใช้เพื่อการให้บริการและปรับปรุงแพลตฟอร์มเท่านั้น
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. การยกเลิกบัญชี</h2>
            <p className="text-gray-600 leading-relaxed">
              ผู้ใช้สามารถยกเลิกบัญชีได้ตลอดเวลา แต่ต้องไม่มีธุรกรรมที่ค้างอยู่ในระบบ
              แพลตฟอร์มขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีที่ละเมิดเงื่อนไขการใช้บริการ
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. ข้อจำกัดความรับผิดชอบ</h2>
            <p className="text-gray-600 leading-relaxed">
              แพลตฟอร์มทำหน้าที่เป็นตัวกลางเท่านั้น ไม่รับผิดชอบต่อคุณภาพสินค้าหรือบริการที่ซื้อขายกัน
              ความรับผิดชอบสูงสุดของแพลตฟอร์มจะไม่เกินค่าธรรมเนียมที่เรียกเก็บจากธุรกรรมนั้นๆ
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. การเปลี่ยนแปลงเงื่อนไข</h2>
            <p className="text-gray-600 leading-relaxed">
              แพลตฟอร์มขอสงวนสิทธิ์ในการเปลี่ยนแปลงเงื่อนไขการใช้บริการได้ตลอดเวลา
              การเปลี่ยนแปลงจะมีผลบังคับใช้ทันทีหลังจากประกาศบนแพลตฟอร์ม
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. การติดต่อ</h2>
            <p className="text-gray-600 leading-relaxed">
              หากมีคำถามเกี่ยวกับเงื่อนไขการใช้บริการ กรุณาติดต่อทีมงานผ่านระบบ Support ในแพลตฟอร์ม
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
