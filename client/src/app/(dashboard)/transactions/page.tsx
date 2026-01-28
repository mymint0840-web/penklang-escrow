"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Filter, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTransactionStore } from "@/stores/transaction.store"
import { useAuthStore } from "@/stores/auth.store"

const statusConfig: Record<string, { label: string; variant: "pending" | "warning" | "secondary" | "success" | "destructive" | "outline" | "default" }> = {
  ALL: { label: "ทั้งหมด", variant: "outline" },
  WAITING_PAYMENT: { label: "รอชำระเงิน", variant: "pending" },
  PAYMENT_VERIFYING: { label: "รอตรวจสอบการชำระ", variant: "warning" },
  PAID_HOLDING: { label: "ชำระแล้ว (กำลังถือเงิน)", variant: "secondary" },
  DELIVERED_PENDING: { label: "ส่งมอบแล้ว (รอยืนยัน)", variant: "warning" },
  COMPLETED: { label: "เสร็จสิ้น", variant: "success" },
  DISPUTE_OPEN: { label: "มีข้อพิพาท", variant: "destructive" },
  CANCELLED: { label: "ยกเลิก", variant: "outline" },
  REFUNDED: { label: "คืนเงินแล้ว", variant: "outline" },
  EXPIRED: { label: "หมดอายุ", variant: "outline" },
  // Legacy statuses for backward compatibility
  PENDING: { label: "รอดำเนินการ", variant: "pending" },
  FUNDED: { label: "ได้รับเงินแล้ว", variant: "warning" },
  DELIVERED: { label: "ส่งมอบแล้ว", variant: "secondary" },
  DISPUTED: { label: "มีข้อพิพาท", variant: "destructive" },
}

export default function TransactionsPage() {
  const { transactions, fetchTransactions, loading } = useTransactionStore()
  const { user } = useAuthStore()
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesStatus =
      statusFilter === "ALL" || transaction.status === statusFilter
    const matchesSearch =
      !searchQuery ||
      transaction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Sort by date (newest first)
  const sortedTransactions = filteredTransactions
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ธุรกรรมของฉัน</h1>
          <p className="text-muted-foreground">
            จัดการและติดตามธุรกรรมทั้งหมดของคุณ
          </p>
        </div>
        <Button asChild>
          <Link href="/transactions/new">
            <Plus className="mr-2 h-4 w-4" />
            สร้างธุรกรรมใหม่
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาธุรกรรม..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions table */}
      <Card>
        <CardHeader>
          <CardTitle>
            รายการธุรกรรม ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : sortedTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "ALL"
                  ? "ไม่พบธุรกรรมที่ตรงกับเงื่อนไข"
                  : "ยังไม่มีธุรกรรม"}
              </p>
              {!searchQuery && statusFilter === "ALL" && (
                <Button asChild>
                  <Link href="/transactions/new">สร้างธุรกรรมแรกของคุณ</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อธุรกรรม</TableHead>
                    <TableHead>บทบาท</TableHead>
                    <TableHead>คู่ค้า</TableHead>
                    <TableHead>จำนวนเงิน</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>วันที่สร้าง</TableHead>
                    <TableHead className="text-right">การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTransactions.map((transaction) => {
                    const isCreator = transaction.creator?.id === user?.id
                    const isBuyer = transaction.buyer?.id === user?.id
                    const isSeller = transaction.seller?.id === user?.id

                    let role = "ผู้สร้าง"
                    let partner = "ยังไม่ระบุ"

                    if (isBuyer) {
                      role = "ผู้ซื้อ"
                      partner = transaction.seller?.name || "ยังไม่ระบุ"
                    } else if (isSeller) {
                      role = "ผู้ขาย"
                      partner = transaction.buyer?.name || "ยังไม่ระบุ"
                    } else if (isCreator) {
                      role = "ผู้สร้าง"
                      partner =
                        transaction.seller?.name ||
                        transaction.buyer?.name ||
                        "ยังไม่ระบุ"
                    }

                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/transactions/${transaction.id}`}
                            className="hover:underline"
                          >
                            {transaction.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{role}</Badge>
                        </TableCell>
                        <TableCell>{partner}</TableCell>
                        <TableCell>
                          ฿{transaction.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusConfig[transaction.status]?.variant || "default"}
                          >
                            {statusConfig[transaction.status]?.label || transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.createdAt).toLocaleDateString(
                            "th-TH",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
