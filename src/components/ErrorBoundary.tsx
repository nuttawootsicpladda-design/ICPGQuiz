'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                เกิดข้อผิดพลาด
              </h2>
              <p className="text-gray-600 mb-4">
                ขออภัย เกิดข้อผิดพลาดในการโหลดหน้านี้
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition"
              >
                รีโหลดหน้า
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
