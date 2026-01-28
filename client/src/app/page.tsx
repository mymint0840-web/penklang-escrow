import { Button } from "@/components/ui/button";
import { Shield, Lock, CheckCircle, Users } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm fixed w-full z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Escrow Platform</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">เข้าสู่ระบบ</Button>
            </Link>
            <Link href="/register">
              <Button>สมัครสมาชิก</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            แพลตฟอร์มเอสโครว์
            <br />
            <span className="text-primary">ที่คุณไว้วางใจได้</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            ทำธุรกรรมออนไลน์อย่างปลอดภัย ด้วยระบบคุ้มครองทั้งผู้ซื้อและผู้ขาย
            รับประกันความโปร่งใสในทุกขั้นตอน
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                เริ่มต้นใช้งาน
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="text-lg px-8">
                เรียนรู้เพิ่มเติม
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            ทำไมต้องเลือกเรา?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Shield className="h-10 w-10 text-primary" />}
              title="ปลอดภัย 100%"
              description="ระบบรักษาความปลอดภัยระดับสูง เงินของคุณได้รับการคุ้มครอง"
            />
            <FeatureCard
              icon={<Lock className="h-10 w-10 text-primary" />}
              title="เข้ารหัสข้อมูล"
              description="ข้อมูลทุกส่วนได้รับการเข้ารหัสด้วยมาตรฐานสากล"
            />
            <FeatureCard
              icon={<CheckCircle className="h-10 w-10 text-primary" />}
              title="ตรวจสอบได้"
              description="ติดตามสถานะธุรกรรมแบบเรียลไทม์ทุกขั้นตอน"
            />
            <FeatureCard
              icon={<Users className="h-10 w-10 text-primary" />}
              title="ซัพพอร์ต 24/7"
              description="ทีมงานพร้อมให้ความช่วยเหลือคุณตลอดเวลา"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            วิธีการใช้งาน
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard
              number="1"
              title="สร้างธุรกรรม"
              description="ผู้ซื้อและผู้ขายตกลงเงื่อนไข และสร้างธุรกรรมในระบบ"
            />
            <StepCard
              number="2"
              title="ฝากเงิน"
              description="ผู้ซื้อโอนเงินเข้าระบบเอสโครว์เพื่อความปลอดภัย"
            />
            <StepCard
              number="3"
              title="ปล่อยเงิน"
              description="เมื่อได้รับสินค้า/บริการ ระบบจะโอนเงินให้ผู้ขาย"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-6 w-6" />
            <span className="text-lg font-semibold">Escrow Platform</span>
          </div>
          <p className="text-slate-400 mb-4">
            แพลตฟอร์มเอสโครว์ที่ปลอดภัยและเชื่อถือได้
          </p>
          <p className="text-sm text-slate-500">
            &copy; 2024 Escrow Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-slate-50 hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  );
}
