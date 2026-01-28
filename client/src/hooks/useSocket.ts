import { useEffect } from "react"
import { io, Socket } from "socket.io-client"
import { useTransactionStore } from "@/stores/transaction.store"
import { useAuthStore } from "@/stores/auth.store"

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000"

let socket: Socket | null = null

export const useSocket = (transactionId?: string) => {
  const { user } = useAuthStore()
  const { updateTransaction } = useTransactionStore()

  useEffect(() => {
    if (!user) return

    // Initialize socket connection
    if (!socket) {
      socket = io(SOCKET_URL, {
        auth: {
          token: localStorage.getItem("token"),
        },
        transports: ["websocket", "polling"],
      })

      socket.on("connect", () => {
        console.log("Socket connected")
      })

      socket.on("disconnect", () => {
        console.log("Socket disconnected")
      })

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error)
      })
    }

    // Join transaction room if transactionId is provided
    if (transactionId && socket) {
      socket.emit("join-transaction", transactionId)

      // Listen for transaction updates
      socket.on("transaction-updated", (transaction) => {
        console.log("Transaction updated:", transaction)
        updateTransaction(transaction)
      })

      // Listen for new messages
      socket.on("message-received", (message) => {
        console.log("New message:", message)
        // Update will be handled by transaction-updated event
      })

      // Listen for status changes
      socket.on("status-changed", ({ status, transaction }) => {
        console.log("Status changed:", status)
        updateTransaction(transaction)
      })
    }

    // Cleanup
    return () => {
      if (transactionId && socket) {
        socket.emit("leave-transaction", transactionId)
        socket.off("transaction-updated")
        socket.off("message-received")
        socket.off("status-changed")
      }
    }
  }, [user, transactionId, updateTransaction])

  return socket
}

// Helper function to emit events
export const emitSocketEvent = (event: string, data: any) => {
  if (socket && socket.connected) {
    socket.emit(event, data)
  }
}

// Helper function to disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
