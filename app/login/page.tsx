'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginFormData } from '@/lib/validations'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Logo } from '@/components/shared/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (result?.error) {
        toast.error('Invalid email or password')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e2235] via-[#2a3050] to-[#1a1f35] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#ECFC3A]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#d4e62e]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <Logo 
              containerClassName="w-14 h-14 rounded-2xl shadow-lg shadow-[#ECFC3A]/30 mb-4" 
              width={40} 
              height={40} 
              padding="p-1"
            />
            <h1 className="text-2xl font-bold text-white">Bikash Institute</h1>
            <p className="text-white/50 text-sm mt-1">Management System</p>
          </div>

          <h2 className="text-lg font-semibold text-white mb-1">Welcome back</h2>
          <p className="text-white/40 text-sm mb-6">Sign in to your admin account</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Email address</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="admin@bikashinstitute.com"
                className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder-white/25 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-[#ECFC3A]/20 transition-all"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder-white/25 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-[#ECFC3A]/20 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-300 hover:bg-brand-400 disabled:opacity-60 text-gray-900 font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-[#ECFC3A]/30"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 p-3 bg-white/5 rounded-xl border border-white/8">
            <p className="text-xs text-white/40 text-center">Default: admin@bikashinstitute.com · Admin@1234</p>
          </div>
        </div>
      </div>
    </div>
  )
}
