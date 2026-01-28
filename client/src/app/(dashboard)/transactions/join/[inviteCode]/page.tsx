"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTransactionStore } from "@/stores/transaction.store"
import { useAuthStore } from "@/stores/auth.store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertCircle, ShieldCheck, ArrowRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function JoinTransactionPage() {
  const params = useParams()
  const router = useRouter()
  const inviteCode = params.inviteCode as string

  const { joinTransaction, loading, error } = useTransactionStore()
  const { user, isAuthenticated } = useAuthStore()

  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [joinedTransaction, setJoinedTransaction] = useState<any>(null)
  const [joinError, setJoinError] = useState<string | null>(null)

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      // Store invite code and redirect to login
      localStorage.setItem("pendingInviteCode", inviteCode)
      router.push(`/login?redirect=/transactions/join/${inviteCode}`)
    }
  }, [isAuthenticated, inviteCode, router])

  const handleJoin = async () => {
    if (!inviteCode) return

    setJoining(true)
    setJoinError(null)

    try {
      const transaction = await joinTransaction(inviteCode)
      setJoined(true)
      setJoinedTransaction(transaction)

      // Redirect to transaction detail after 2 seconds
      setTimeout(() => {
        router.push(`/transactions/${transaction.id}`)
      }, 2000)
    } catch (err: any) {
      setJoinError(err.response?.data?.message || err.message || "ไม่สามารถเข้าร่วมธุรกรรมได้")
    } finally {
      setJoining(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-lg mx-auto py-12">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">กำลังตรวจสอบการเข้าสู่ระบบ...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (joined && joinedTransaction) {
    return (
      <div className="container max-w-lg mx-auto py-12">
        <Card className="border-green-500">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">เข้าร่วมสำเร็จ!</h2>
            <p className="text-muted-foreground text-center mb-4">
              คุณได้เข้าร่วมธุรกรรม "{joinedTransaction.title}" เรียบร้อยแล้ว
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              กำลังนำคุณไปยังหน้ารายละเอียดธุรกรรม...
            </p>
            <Button onClick={() => router.push(`/transactions/${joinedTransaction.id}`)}>
              ไปที่ธุรกรรม <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-lg mx-auto py-12">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto rounded-full bg-primary/10 p-4 mb-4">
            <ShieldCheck className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">เข้าร่วมธุรกรรม Escrow</CardTitle>
          <CardDescription>
            คุณได้รับเชิญให้เข้าร่วมธุรกรรมกลางที่ปลอดภัย
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invite Code Display */}
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">รหัสเชิญ</p>
            <code className="text-2xl font-mono font-bold tracking-wider">
              {inviteCode}
            </code>
          </div>

          {/* User Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">เข้าร่วมในฐานะ</p>
            <p className="font-medium">{user?.name || user?.email}</p>
            <Badge variant="outline" className="mt-2">ผู้ซื้อ</Badge>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">สิ่งที่คุณจะได้รับ:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                เงินถูกเก็บรักษาอย่างปลอดภัยจนกว่าจะได้รับสินค้า
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                ป้องกันการโกงจากทั้งสองฝ่าย
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                ทีมสนับสนุนช่วยเหลือหากมีปัญหา
              </li>
            </ul>
          </div>

          {/* Error Display */}
          {(joinError || error) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-700">เกิดข้อผิดพลาด</p>
                <p className="text-sm text-red-600">{joinError || error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full"
              onClick={handleJoin}
              disabled={joining || loading}
            >
              {joining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังเข้าร่วม...
                </>
              ) : (
                <>
                  เข้าร่วมธุรกรรม
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/transactions")}
            >
              ยกเลิก
            </Button>
          </div>

          {/* Terms */}
          <p className="text-xs text-muted-foreground text-center">
            การเข้าร่วมธุรกรรมหมายความว่าคุณยอมรับ{" "}
            <a href="/terms" className="text-primary hover:underline">ข้อกำหนดการใช้งาน</a>
            {" "}และ{" "}
            <a href="/privacy" className="text-primary hover:underline">นโยบายความเป็นส่วนตัว</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
