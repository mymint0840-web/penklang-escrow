"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useTransactionStore } from "@/stores/transaction.store"
import { useAuthStore } from "@/stores/auth.store"

export default function NewTransactionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { createTransaction, loading } = useTransactionStore()
  const { user } = useAuthStore()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    feePayer: "BUYER" as "BUYER" | "SELLER" | "SPLIT",
    buyerEmail: "",
    sellerEmail: "",
  })

  // Calculate fees
  const amount = parseFloat(formData.amount) || 0
  const feeRate = 0.03 // 3%
  const fee = amount * feeRate

  let buyerPays = amount
  let sellerReceives = amount

  if (formData.feePayer === "BUYER") {
    buyerPays = amount + fee
  } else if (formData.feePayer === "SELLER") {
    sellerReceives = amount - fee
  } else if (formData.feePayer === "SPLIT") {
    buyerPays = amount + fee / 2
    sellerReceives = amount - fee / 2
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.amount) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "ชื่อธุรกรรมและจำนวนเงินเป็นข้อมูลที่จำเป็น",
        variant: "destructive",
      })
      return
    }

    if (parseFloat(formData.amount) <= 0) {
      toast({
        title: "จำนวนเงินไม่ถูกต้อง",
        description: "กรุณาระบุจำนวนเงินที่มากกว่า 0",
        variant: "destructive",
      })
      return
    }

    try {
      const transaction = await createTransaction({
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        feePayer: formData.feePayer,
        buyerEmail: formData.buyerEmail || undefined,
        sellerEmail: formData.sellerEmail || undefined,
      })

      toast({
        title: "สร้างธุรกรรมสำเร็จ",
        description: "ธุรกรรมของคุณถูกสร้างเรียบร้อยแล้ว",
      })

      router.push(`/transactions/${transaction.id}`)
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.response?.data?.message || "ไม่สามารถสร้างธุรกรรมได้",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/transactions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับ
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">สร้างธุรกรรมใหม่</h1>
        <p className="text-muted-foreground">
          กรอกข้อมูลเพื่อสร้างธุรกรรม Escrow ใหม่
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction details */}
        <Card>
          <CardHeader>
            <CardTitle>รายละเอียดธุรกรรม</CardTitle>
            <CardDescription>
              ข้อมูลพื้นฐานเกี่ยวกับธุรกรรม
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                ชื่อธุรกรรม <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="เช่น ขายเว็บไซต์ E-commerce"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">คำอธิบาย</Label>
              <Textarea
                id="description"
                placeholder="อธิบายรายละเอียดเกี่ยวกับสินค้าหรือบริการ"
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                จำนวนเงิน (บาท) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feePayer">
                ผู้รับผิดชอบค่าธรรมเนียม <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.feePayer}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, feePayer: value })
                }
              >
                <SelectTrigger id="feePayer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUYER">ผู้ซื้อจ่ายทั้งหมด</SelectItem>
                  <SelectItem value="SELLER">ผู้ขายจ่ายทั้งหมด</SelectItem>
                  <SelectItem value="SPLIT">แบ่งกันครึ่งหนึ่ง</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle>ผู้เกี่ยวข้อง</CardTitle>
            <CardDescription>
              ระบุอีเมลของผู้ซื้อและผู้ขาย (ไม่บังคับ)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buyerEmail">อีเมลผู้ซื้อ</Label>
              <Input
                id="buyerEmail"
                type="email"
                placeholder="buyer@example.com"
                value={formData.buyerEmail}
                onChange={(e) =>
                  setFormData({ ...formData, buyerEmail: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                ถ้าคุณเป็นผู้ขาย ให้ระบุอีเมลผู้ซื้อ
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerEmail">อีเมลผู้ขาย</Label>
              <Input
                id="sellerEmail"
                type="email"
                placeholder="seller@example.com"
                value={formData.sellerEmail}
                onChange={(e) =>
                  setFormData({ ...formData, sellerEmail: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                ถ้าคุณเป็นผู้ซื้อ ให้ระบุอีเมลผู้ขาย
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Fee calculator */}
        {amount > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>สรุปค่าใช้จ่าย</CardTitle>
              <CardDescription>
                ค่าธรรมเนียมแพลตฟอร์ม 3% ของมูลค่าธุรกรรม
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">มูลค่าธุรกรรม</span>
                <span className="font-medium">฿{amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ค่าธรรมเนียม (3%)</span>
                <span className="font-medium">฿{fee.toLocaleString()}</span>
              </div>
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">ผู้ซื้อจ่าย</span>
                  <span className="font-bold text-lg">
                    ฿{buyerPays.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">ผู้ขายได้รับ</span>
                  <span className="font-bold text-lg">
                    ฿{sellerReceives.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            ยกเลิก
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? "กำลังสร้าง..." : "สร้างธุรกรรม"}
          </Button>
        </div>
      </form>
    </div>
  )
}
