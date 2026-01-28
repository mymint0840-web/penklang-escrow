import { create } from "zustand"
import axios from "axios"

// API URL should include /v1 for versioned endpoints
const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
const API_URL = BASE_API_URL.endsWith('/v1') ? BASE_API_URL : `${BASE_API_URL}/v1`

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface Message {
  id: string
  sender: User
  content: string
  createdAt: string
}

interface TimelineEvent {
  status: string
  timestamp: string
  note?: string
}

interface Transaction {
  id: string
  title: string
  description?: string
  amount: number
  feePercent?: number
  feeAmount?: number
  netAmount?: number
  fee?: number
  buyerPays?: number
  sellerReceives?: number
  status: "WAITING_PAYMENT" | "PAYMENT_VERIFYING" | "PAID_HOLDING" | "DELIVERED_PENDING" | "COMPLETED" | "DISPUTED" | "CANCELLED" | "REFUNDED" | "PENDING" | "FUNDED" | "DELIVERED"
  feePayer: "BUYER" | "SELLER" | "SPLIT"
  inviteCode?: string
  inviteExpiry?: string
  creator?: User
  buyer?: User
  seller?: User
  messages?: Message[]
  timeline?: TimelineEvent[]
  paymentSlips?: any[]
  createdAt: string
  updatedAt: string
}

interface TransactionStore {
  transactions: Transaction[]
  currentTransaction: Transaction | null
  loading: boolean
  error: string | null

  fetchTransactions: () => Promise<void>
  fetchTransaction: (id: string) => Promise<void>
  createTransaction: (data: {
    title: string
    description?: string
    amount: number
    feePayer: "BUYER" | "SELLER" | "SPLIT"
    buyerEmail?: string
    sellerEmail?: string
  }) => Promise<Transaction>
  joinTransaction: (inviteCode: string) => Promise<Transaction>
  updateTransactionStatus: (id: string, status: string) => Promise<void>
  uploadSlip: (id: string, slipData: { imageUrl: string; amount: number; paymentMethod?: string }) => Promise<Transaction>
  confirmDelivery: (id: string) => Promise<Transaction>
  acceptDelivery: (id: string) => Promise<Transaction>
  cancelTransaction: (id: string, reason?: string) => Promise<Transaction>
  addMessage: (id: string, content: string) => Promise<void>
  updateTransaction: (transaction: Transaction) => void
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  currentTransaction: null,
  loading: false,
  error: null,

  fetchTransactions: async () => {
    set({ loading: true, error: null })
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`${API_URL}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      // Backend returns { success: true, data: [...], pagination: {...} }
      set({ transactions: response.data.data || response.data, loading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to fetch transactions",
        loading: false,
      })
    }
  },

  fetchTransaction: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`${API_URL}/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      // Backend returns { success: true, data: transaction }
      set({ currentTransaction: response.data.data || response.data, loading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to fetch transaction",
        loading: false,
      })
    }
  },

  createTransaction: async (data) => {
    set({ loading: true, error: null })
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(`${API_URL}/transactions`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      // Backend returns { success: true, message: '...', data: transaction }
      const transaction = response.data.data || response.data
      set((state) => ({
        transactions: [transaction, ...state.transactions],
        loading: false,
      }))
      return transaction
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to create transaction",
        loading: false,
      })
      throw error
    }
  },

  joinTransaction: async (inviteCode: string) => {
    set({ loading: true, error: null })
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `${API_URL}/transactions/join/${inviteCode}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const transaction = response.data.data || response.data
      set((state) => ({
        transactions: [transaction, ...state.transactions],
        currentTransaction: transaction,
        loading: false,
      }))
      return transaction
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to join transaction",
        loading: false,
      })
      throw error
    }
  },

  updateTransactionStatus: async (id: string, status: string) => {
    set({ loading: true, error: null })
    try {
      const token = localStorage.getItem("token")
      const response = await axios.patch(
        `${API_URL}/transactions/${id}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const transaction = response.data.data || response.data
      set((state) => ({
        transactions: state.transactions.map((t) =>
          t.id === id ? transaction : t
        ),
        currentTransaction:
          state.currentTransaction?.id === id
            ? transaction
            : state.currentTransaction,
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to update status",
        loading: false,
      })
      throw error
    }
  },

  uploadSlip: async (id: string, slipData: { imageUrl: string; amount: number; paymentMethod?: string }) => {
    set({ loading: true, error: null })
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `${API_URL}/transactions/${id}/slip`,
        slipData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const transaction = response.data.data || response.data
      set((state) => ({
        currentTransaction: transaction,
        loading: false,
      }))
      return transaction
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to upload slip",
        loading: false,
      })
      throw error
    }
  },

  confirmDelivery: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `${API_URL}/transactions/${id}/deliver`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const transaction = response.data.data || response.data
      set((state) => ({
        currentTransaction: transaction,
        loading: false,
      }))
      return transaction
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to confirm delivery",
        loading: false,
      })
      throw error
    }
  },

  acceptDelivery: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `${API_URL}/transactions/${id}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const transaction = response.data.data || response.data
      set((state) => ({
        currentTransaction: transaction,
        loading: false,
      }))
      return transaction
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to accept delivery",
        loading: false,
      })
      throw error
    }
  },

  cancelTransaction: async (id: string, reason?: string) => {
    set({ loading: true, error: null })
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `${API_URL}/transactions/${id}/cancel`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const transaction = response.data.data || response.data
      set((state) => ({
        currentTransaction: transaction,
        loading: false,
      }))
      return transaction
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to cancel transaction",
        loading: false,
      })
      throw error
    }
  },

  addMessage: async (id: string, content: string) => {
    set({ loading: true, error: null })
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `${API_URL}/transactions/${id}/messages`,
        { content },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      set((state) => ({
        currentTransaction: state.currentTransaction
          ? {
              ...state.currentTransaction,
              messages: [...state.currentTransaction.messages, response.data],
            }
          : null,
        loading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to send message",
        loading: false,
      })
      throw error
    }
  },

  updateTransaction: (transaction: Transaction) => {
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === transaction.id ? transaction : t
      ),
      currentTransaction:
        state.currentTransaction?.id === transaction.id
          ? transaction
          : state.currentTransaction,
    }))
  },
}))
