import { create } from "zustand"
import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

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
  fee: number
  buyerPays: number
  sellerReceives: number
  status: "PENDING" | "FUNDED" | "DELIVERED" | "COMPLETED" | "DISPUTED" | "CANCELLED"
  feePayer: "BUYER" | "SELLER" | "SPLIT"
  creator: User
  buyer?: User
  seller?: User
  messages: Message[]
  timeline: TimelineEvent[]
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
  updateTransactionStatus: (id: string, status: string) => Promise<void>
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
      set({ transactions: response.data, loading: false })
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
      set({ currentTransaction: response.data, loading: false })
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
      set((state) => ({
        transactions: [response.data, ...state.transactions],
        loading: false,
      }))
      return response.data
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to create transaction",
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
      set((state) => ({
        transactions: state.transactions.map((t) =>
          t.id === id ? response.data : t
        ),
        currentTransaction:
          state.currentTransaction?.id === id
            ? response.data
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
