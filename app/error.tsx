'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-rose-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500 mb-6">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-brand-300 text-gray-900 rounded-xl text-sm font-medium hover:bg-brand-400 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
