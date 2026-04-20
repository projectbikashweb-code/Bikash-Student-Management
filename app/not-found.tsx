import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="w-8 h-8 text-gray-500" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-500 mb-6">Page not found</p>
        <Link href="/dashboard" className="px-5 py-2.5 bg-brand-300 text-gray-900 rounded-xl text-sm font-medium hover:bg-brand-400 transition-colors">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
