"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowUpRight, Clock, DollarSign, CheckCircle, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useTransactionStore } from "@/stores/transaction.store"
import { useAuthStore } from "@/stores/auth.store"

const statusConfig = {
  PENDING: { label: "รอดำเนินการ", variant: "pending" as const },
  FUNDED: { label: "ได้รับเงินแล้ว", variant: "warning" as const },
  DELIVERED: { label: "ส่งมอบแล้ว", variant: "secondary" as const },
  COMPLETED: { label: "เสร็จสิ้น", variant: "success" as const },
  DISPUTED: { label: "มีข้อพิพาท", variant: "destructive" as const },
  CANCELLED: { label: "ยกเลิก", variant: "outline" as const },
}

export default function DashboardPage() {
  const { transactions, fetchTransactions, loading } = useTransactionStore()
  const { user } = useAuthStore()

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Calculate stats
  const stats = {
    pending: transactions.filter((t) => t.status === "PENDING").length,
    funded: transactions.filter((t) => t.status === "FUNDED").length,
    completed: transactions.filter((t) => t.status === "COMPLETED").length,
    revenue: transactions
      .filter((t) => t.status === "COMPLETED" && t.seller?.id === user?.id)
      .reduce((sum, t) => sum + t.amount, 0),
  }

  // Get recent transactions
  const recentTransactions = transactions
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">หน้าหลัก</h1>
          <p className="text-muted-foreground">
            ภาพรวมธุรกรรมและกิจกรรมของคุณ
          </p>
        </div>
        <Button asChild>
          <Link href="/transactions/new">
            สร้างธุรกรรมใหม่
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รอดำเนินการ</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              ธุรกรรมที่รอการตอบรับ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ถือเงินอยู่</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.funded}</div>
            <p className="text-xs text-muted-foreground">
              ธุรกรรมที่กำลังดำเนินการ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เสร็จสิ้น</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              ธุรกรรมที่เสร็จสมบูรณ์
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายได้</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿{stats.revenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              รายได้ทั้งหมดจากการขาย
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>ธุรกรรมล่าสุด</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              รายการธุรกรรมที่อัปเดตล่าสุด
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/transactions">
              ดูทั้งหมด
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              ยังไม่มีธุรกรรม
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อธุรกรรม</TableHead>
                  <TableHead>คู่ค้า</TableHead>
                  <TableHead>จำนวนเงิน</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => {
                  const isCreator = transaction.creator?.id === user?.id
                  const partner = isCreator
                    ? transaction.seller?.name || transaction.buyer?.name || "ยังไม่ระบุ"
                    : transaction.creator?.name || "ไม่ทราบ"

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transaction.title}
                      </TableCell>
                      <TableCell>{partner}</TableCell>
                      <TableCell>฿{transaction.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[transaction.status].variant}>
                          {statusConfig[transaction.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/transactions/${transaction.id}`}>
                            ดูรายละเอียด
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
