'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, Trash2 } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3000)
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 min-w-[300px] max-w-md p-4 rounded-lg shadow-lg
              animate-in slide-in-from-top-5 duration-300
              ${toast.type === 'success' ? 'bg-green-50 border-2 border-green-500' : ''}
              ${toast.type === 'error' ? 'bg-red-50 border-2 border-red-500' : ''}
              ${toast.type === 'info' ? 'bg-blue-50 border-2 border-blue-500' : ''}
              ${toast.type === 'warning' ? 'bg-red-50 border-2 border-red-600' : ''}
            `}
          >
            {toast.type === 'success' && (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            )}
            {toast.type === 'info' && (
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
            )}
            {toast.type === 'warning' && (
              <Trash2 className="h-5 w-5 text-red-600 flex-shrink-0" />
            )}
            <p
              className={`
                flex-1 text-sm font-medium
                ${toast.type === 'success' ? 'text-green-900' : ''}
                ${toast.type === 'error' ? 'text-red-900' : ''}
                ${toast.type === 'info' ? 'text-blue-900' : ''}
                ${toast.type === 'warning' ? 'text-red-900' : ''}
              `}
            >
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className={`
                p-1 rounded hover:bg-opacity-20
                ${toast.type === 'success' ? 'hover:bg-green-600 text-green-700' : ''}
                ${toast.type === 'error' ? 'hover:bg-red-600 text-red-700' : ''}
                ${toast.type === 'info' ? 'hover:bg-blue-600 text-blue-700' : ''}
                ${toast.type === 'warning' ? 'hover:bg-red-600 text-red-700' : ''}
              `}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
