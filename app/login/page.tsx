'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginFormData } from '@/lib/validations'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Logo } from '@/components/shared/Logo'
import { FormInput } from '@/components/shared/FormInput'

// ─── All logic untouched ────────────────────────────────────────────────────

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

  // ─── UI Layer ──────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f1624 0%, #1a2340 40%, #0d1829 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow orbs — pointer-events:none, no interaction with form */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-120px',
          right: '-120px',
          width: '480px',
          height: '480px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,252,58,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-120px',
          left: '-120px',
          width: '480px',
          height: '480px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,230,46,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Card — isolation:isolate prevents parent blend modes from leaking into inputs */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          isolation: 'isolate',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '24px',
            padding: '40px 36px',
            boxShadow: '0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset',
          }}
        >
          {/* ── Logo & Brand ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
            <Logo
              containerClassName="w-14 h-14 rounded-2xl shadow-lg shadow-[#ECFC3A]/30 mb-4"
              width={40}
              height={40}
              padding="p-1"
            />
            <h1
              style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.02em',
              }}
            >
              Bikash Institute
            </h1>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.45)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Management System
            </p>
          </div>

          {/* ── Heading ── */}
          <h2
            style={{
              margin: '0 0 4px',
              fontSize: '18px',
              fontWeight: 600,
              color: '#ffffff',
            }}
          >
            Welcome back
          </h2>
          <p
            style={{
              margin: '0 0 28px',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.38)',
            }}
          >
            Sign in to your admin account
          </p>

          {/* ── Form — logic fully preserved via react-hook-form register ── */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Email field */}
            <div>
              <label
                htmlFor="login-email"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.65)',
                  marginBottom: '8px',
                }}
              >
                Email address
              </label>
              <FormInput
                {...register('email')}
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="admin@bikashinstitute.com"
                hasError={!!errors.email}
              />
              {errors.email && (
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#fb7185' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="login-password"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.65)',
                  marginBottom: '8px',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <FormInput
                  {...register('password')}
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  hasError={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 150ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#fb7185' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit button — className kept for brand consistency, no input risks */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '4px',
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: loading
                  ? 'rgba(236,252,58,0.6)'
                  : 'linear-gradient(135deg, #ECFC3A 0%, #d4e62e 100%)',
                color: '#0f1624',
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '0.01em',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(236,252,58,0.25)',
                transition: 'box-shadow 150ms ease, background 150ms ease, transform 100ms ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(236,252,58,0.35)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(236,252,58,0.25)'
                }
              }}
            >
              {loading && <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* ── Hint box ── */}
          <div
            style={{
              marginTop: '24px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <ShieldCheck size={14} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
              Default: admin@bikashinstitute.com · Admin@1234
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
