"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  MessageSquare,
  Send,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useTransactionStore } from "@/stores/transaction.store"
import { useAuthStore } from "@/stores/auth.store"
import { useSocket } from "@/hooks/useSocket"

const statusConfig = {
  PENDING: {
    label: "รอดำเนินการ",
    variant: "pending" as const,
    icon: Clock,
    description: "รอผู้เกี่ยวข้องตอบรับ",
  },
  FUNDED: {
    label: "ได้รับเงินแล้ว",
    variant: "warning" as const,
    icon: DollarSign,
    description: "เงินถูกฝากไว้ในระบบแล้ว",
  },
  DELIVERED: {
    label: "ส่งมอบแล้ว",
    variant: "secondary" as const,
    icon: CheckCircle,
    description: "ผู้ขายยืนยันการส่งมอบแล้ว",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    variant: "success" as const,
    icon: CheckCircle,
    description: "ธุรกรรมเสร็จสมบูรณ์",
  },
  DISPUTED: {
    label: "มีข้อพิพาท",
    variant: "destructive" as const,
    icon: AlertCircle,
    description: "กำลังดำเนินการแก้ไขข้อพิพาท",
  },
  CANCELLED: {
    label: "ยกเลิก",
    variant: "outline" as const,
    icon: AlertCircle,
    description: "ธุรกรรมถูกยกเลิก",
  },
}

export default function TransactionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const {
    currentTransaction,
    fetchTransaction,
    updateTransactionStatus,
    addMessage,
    loading,
  } = useTransactionStore()

  const [message, setMessage] = useState("")
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    action: string
    status: string
  }>({ open: false, action: "", status: "" })

  const transactionId = params.id as string

  // Socket for real-time updates
  useSocket(transactionId)

  useEffect(() => {
    if (transactionId) {
      fetchTransaction(transactionId)
    }
  }, [transactionId, fetchTransaction])

  if (!currentTransaction) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const transaction = currentTransaction
  const isCreator = transaction.creator?.id === user?.id
  const isBuyer = transaction.buyer?.id === user?.id
  const isSeller = transaction.seller?.id === user?.id

  const statusInfo = statusConfig[transaction.status]
  const StatusIcon = statusInfo.icon

  // Calculate amounts
  const amount = transaction.amount
  const fee = transaction.fee
  const buyerPays = transaction.buyerPays
  const sellerReceives = transaction.sellerReceives

  // Handle status updates
  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await updateTransactionStatus(transactionId, newStatus)
      toast({
        title: "อัปเดตสถานะสำเร็จ",
        description: "สถานะธุรกรรมถูกอัปเดตเรียบร้อยแล้ว",
      })
      setConfirmDialog({ open: false, action: "", status: "" })
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.response?.data?.message || "ไม่สามารถอัปเดตสถานะได้",
        variant: "destructive",
      })
    }
  }

  // Handle sending message
  const handleSendMessage = async () => {
    if (!message.trim()) return

    try {
      await addMessage(transactionId, message)
      setMessage("")
      toast({
        title: "ส่งข้อความสำเร็จ",
      })
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.response?.data?.message || "ไม่สามารถส่งข้อความได้",
        variant: "destructive",
      })
    }
  }

  // Determine available actions based on role and status
  const getAvailableActions = () => {
    const actions = []

    if (transaction.status === "PENDING") {
      if (isBuyer || (isCreator && !transaction.buyer)) {
        actions.push({
          label: "ฝากเงิน",
          action: "fund",
          status: "FUNDED",
          variant: "default" as const,
        })
      }
      actions.push({
        label: "ยกเลิก",
        action: "cancel",
        status: "CANCELLED",
        variant: "destructive" as const,
      })
    }

    if (transaction.status === "FUNDED" && isSeller) {
      actions.push({
        label: "ยืนยันการส่งมอบ",
        action: "deliver",
        status: "DELIVERED",
        variant: "default" as const,
      })
    }

    if (transaction.status === "DELIVERED" && isBuyer) {
      actions.push({
        label: "ยืนยันการรับสินค้า",
        action: "complete",
        status: "COMPLETED",
        variant: "default" as const,
      })
      actions.push({
        label: "รายงานปัญหา",
        action: "dispute",
        status: "DISPUTED",
        variant: "destructive" as const,
      })
    }

    return actions
  }

  const actions = getAvailableActions()

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/transactions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับ
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {transaction.title}
            </h1>
            <p className="text-muted-foreground mt-1">
              รหัสธุรกรรม: {transaction.id}
            </p>
          </div>
          <Badge variant={statusInfo.variant} className="text-base px-4 py-2">
            <StatusIcon className="mr-2 h-4 w-4" />
            {statusInfo.label}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction info */}
          <Card>
            <CardHeader>
              <CardTitle>รายละเอียดธุรกรรม</CardTitle>
              <CardDescription>{statusInfo.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {transaction.description && (
                <div>
                  <h3 className="font-medium mb-2">คำอธิบาย</h3>
                  <p className="text-muted-foreground">
                    {transaction.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">ผู้ซื้อ</h3>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={transaction.buyer?.avatar} />
                      <AvatarFallback>
                        {transaction.buyer?.name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {transaction.buyer?.name || "ยังไม่ระบุ"}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">ผู้ขาย</h3>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={transaction.seller?.avatar} />
                      <AvatarFallback>
                        {transaction.seller?.name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {transaction.seller?.name || "ยังไม่ระบุ"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">มูลค่าธุรกรรม</span>
                  <span className="font-medium">฿{amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ค่าธรรมเนียม</span>
                  <span className="font-medium">฿{fee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
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

          {/* Timeline and Chat */}
          <Card>
            <Tabs defaultValue="timeline">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="timeline">
                    <Clock className="mr-2 h-4 w-4" />
                    ไทม์ไลน์
                  </TabsTrigger>
                  <TabsTrigger value="chat">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    แชท
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="timeline" className="space-y-4">
                  {transaction.timeline?.map((event: any, index: number) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-primary p-2">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        {index < transaction.timeline.length - 1 && (
                          <div className="w-px h-full bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium">{event.status}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString("th-TH")}
                        </p>
                        {event.note && (
                          <p className="text-sm mt-1">{event.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="chat" className="space-y-4">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {transaction.messages?.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        ยังไม่มีข้อความ
                      </p>
                    ) : (
                      transaction.messages?.map((msg: any) => {
                        const isOwn = msg.sender?.id === user?.id
                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-2 ${
                              isOwn ? "flex-row-reverse" : ""
                            }`}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={msg.sender?.avatar} />
                              <AvatarFallback>
                                {msg.sender?.name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={`flex-1 ${
                                isOwn ? "text-right" : ""
                              }`}
                            >
                              <div
                                className={`inline-block rounded-lg px-4 py-2 ${
                                  isOwn
                                    ? "bg-primary text-white"
                                    : "bg-muted"
                                }`}
                              >
                                <p className="text-sm">{msg.content}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(msg.createdAt).toLocaleString("th-TH")}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      placeholder="พิมพ์ข้อความ..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      rows={2}
                    />
                    <Button
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          {actions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>การดำเนินการ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {actions.map((action) => (
                  <Button
                    key={action.action}
                    variant={action.variant}
                    className="w-full"
                    onClick={() =>
                      setConfirmDialog({
                        open: true,
                        action: action.label,
                        status: action.status,
                      })
                    }
                  >
                    {action.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลเพิ่มเติม</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">วันที่สร้าง</span>
                <p className="font-medium">
                  {new Date(transaction.createdAt).toLocaleString("th-TH")}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">อัปเดตล่าสุด</span>
                <p className="font-medium">
                  {new Date(transaction.updatedAt).toLocaleString("th-TH")}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">ผู้รับผิดชอบค่าธรรมเนียม</span>
                <p className="font-medium">
                  {transaction.feePayer === "BUYER"
                    ? "ผู้ซื้อ"
                    : transaction.feePayer === "SELLER"
                    ? "ผู้ขาย"
                    : "แบ่งกันครึ่งหนึ่ง"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog({ ...confirmDialog, open })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการดำเนินการ</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ที่จะ{confirmDialog.action}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog({ open: false, action: "", status: "" })
              }
            >
              ยกเลิก
            </Button>
            <Button
              onClick={() => handleStatusUpdate(confirmDialog.status)}
              disabled={loading}
            >
              {loading ? "กำลังดำเนินการ..." : "ยืนยัน"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
