'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { changePasswordSchema, staffSchema, ChangePasswordFormData, StaffFormData } from '@/lib/validations'
import { AppLayout } from '@/components/layout/AppLayout'
import { toast } from 'sonner'
import { KeyRound, Users, Download, Building2, Loader2, Trash2 } from 'lucide-react'
import { CLASS_OPTIONS } from '@/lib/constants/classes'

const TABS = ['Institute Info', 'Change Password', 'Staff Users', 'Data Export']

export default function SettingsPage() {
  const [tab, setTab] = useState(0)

  return (
    <AppLayout title="Settings">
      <div className="flex gap-1 mb-6 bg-white border border-gray-100 rounded-2xl p-1 w-fit shadow-sm overflow-x-auto">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${tab === i ? 'bg-brand-300 text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && <InstituteInfo />}
      {tab === 1 && <ChangePassword />}
      {tab === 2 && <StaffUsers />}
      {tab === 3 && <DataExport />}
    </AppLayout>
  )
}

function InstituteInfo() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    address: '',
    phone: '',
    email: '',
    defaultFee: '',
    defaultDueDate: '',
    classFees: {} as Record<string, string>,
  })

  // Fetch current settings on mount
  useEffect(() => {
    fetch('/api/settings/institute')
      .then(r => r.json())
      .then(data => {
        setForm({
          address: data.address ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          defaultFee: String(data.defaultFee ?? 1500),
          defaultDueDate: String(data.defaultDueDate ?? 10),
          classFees: data.classFees || {},
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/institute', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          defaultFee: Number(form.defaultFee),
          defaultDueDate: Number(form.defaultDueDate),
          classFees: Object.fromEntries(
            Object.entries(form.classFees).map(([k, v]) => [k, Number(v)])
          ),
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Settings saved successfully')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-lg flex items-center gap-2 text-gray-400 text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading settings...
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-lg">
      <div className="flex items-center gap-2 mb-5">
        <Building2 size={18} className="text-gray-500" />
        <h2 className="text-base font-semibold text-gray-800">Institute Information</h2>
      </div>
      <div className="space-y-4">
        {/* Institute Name — read-only */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Institute Name</label>
          <input value="Bikash Educational Institution" disabled className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-400 bg-gray-50 outline-none" />
        </div>

        {[
          { label: 'Address', key: 'address' },
          { label: 'Phone', key: 'phone' },
          { label: 'Email', key: 'email' },
          { label: 'Default Monthly Fee (₹)', key: 'defaultFee' },
          { label: 'Default Due Date (day of month)', key: 'defaultDueDate' },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
            <input
              value={form[f.key as keyof typeof form] as string}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-400"
            />
          </div>
        ))}

        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Class-Specific Pricing</h3>
          <p className="text-xs text-gray-400 mb-4">Set specific fees for each class. If left blank, the global Default Monthly Fee will be applied.</p>
          <div className="grid grid-cols-2 gap-4">
            {CLASS_OPTIONS.map(c => (
              <div key={c}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{c}</label>
                <input
                  type="number"
                  placeholder={form.defaultFee}
                  value={form.classFees[c] ?? ''}
                  onChange={e => setForm(prev => ({
                    ...prev,
                    classFees: { ...prev.classFees, [c]: e.target.value }
                  }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-400"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-brand-300 text-gray-900 rounded-xl text-sm font-medium hover:bg-brand-400 transition-colors disabled:opacity-60"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}


function ChangePassword() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: ChangePasswordFormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed')
      }
      toast.success('Password changed successfully')
      reset()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-md">
      <div className="flex items-center gap-2 mb-5">
        <KeyRound size={18} className="text-gray-500" />
        <h2 className="text-base font-semibold text-gray-800">Change Password</h2>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {[
          { name: 'currentPassword', label: 'Current Password' },
          { name: 'newPassword', label: 'New Password' },
          { name: 'confirmPassword', label: 'Confirm New Password' },
        ].map(f => (
          <div key={f.name}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
            <input {...register(f.name as any)} type="password" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
            {errors[f.name as keyof ChangePasswordFormData] && (
              <p className="mt-1 text-xs text-rose-500">{errors[f.name as keyof ChangePasswordFormData]?.message}</p>
            )}
          </div>
        ))}
        <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-brand-300 text-gray-900 rounded-xl text-sm font-medium hover:bg-brand-400 disabled:opacity-60">
          {loading && <Loader2 size={14} className="animate-spin" />}
          Update Password
        </button>
      </form>
    </div>
  )
}

function StaffUsers() {
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
  })

  const { data: users } = useQuery({
    queryKey: ['staff-users'],
    queryFn: async () => {
      const res = await fetch('/api/settings/staff')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (d: StaffFormData) => {
      const res = await fetch('/api/settings/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: () => { toast.success('Staff user added'); qc.invalidateQueries({ queryKey: ['staff-users'] }); setAddOpen(false); reset() },
    onError: () => toast.error('Failed to add staff'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/settings/staff/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: () => { toast.success('Staff removed'); qc.invalidateQueries({ queryKey: ['staff-users'] }) },
    onError: () => toast.error('Failed to remove'),
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-gray-500" />
          <h2 className="text-base font-semibold text-gray-800">Staff Users</h2>
        </div>
        <button onClick={() => setAddOpen(!addOpen)} className="px-3 py-1.5 bg-brand-300 text-gray-900 rounded-lg text-xs font-medium hover:bg-brand-400">
          {addOpen ? 'Cancel' : '+ Add Staff'}
        </button>
      </div>

      {addOpen && (
        <form onSubmit={handleSubmit(d => createMutation.mutateAsync(d))} className="border border-gray-100 rounded-xl p-4 mb-4 space-y-3 bg-gray-50/50">
          {[{ name: 'name', label: 'Name', type: 'text' }, { name: 'email', label: 'Email', type: 'email' }, { name: 'password', label: 'Password', type: 'password' }].map(f => (
            <div key={f.name}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
              <input {...register(f.name as any)} type={f.type} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
              {errors[f.name as keyof StaffFormData] && <p className="mt-1 text-xs text-rose-500">{errors[f.name as keyof StaffFormData]?.message}</p>}
            </div>
          ))}
          <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-brand-300 text-gray-900 rounded-xl text-sm font-medium hover:bg-brand-400 disabled:opacity-60 flex items-center gap-2">
            {createMutation.isPending && <Loader2 size={13} className="animate-spin" />}
            Create Staff
          </button>
        </form>
      )}

      <div className="space-y-2">
        {(users ?? []).map((u: any) => (
          <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50/50">
            <div>
              <div className="font-medium text-gray-800 text-sm">{u.name}</div>
              <div className="text-xs text-gray-400">{u.email} · {u.role}</div>
            </div>
            {u.role !== 'ADMIN' && (
              <button onClick={() => deleteMutation.mutate(u.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function DataExport() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-md">
      <div className="flex items-center gap-2 mb-5">
        <Download size={18} className="text-gray-500" />
        <h2 className="text-base font-semibold text-gray-800">Data Export</h2>
      </div>
      <div className="space-y-3">
        {[
          { label: 'Export All Students', description: 'Download full student list as CSV', url: '/api/students?export=csv&limit=1000' },
          { label: 'Export All Payments', description: 'Download all payment records as CSV', url: '/api/payments?export=csv' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50/50">
            <div>
              <div className="text-sm font-medium text-gray-800">{item.label}</div>
              <div className="text-xs text-gray-400">{item.description}</div>
            </div>
            <a href={item.url} download className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-300 text-gray-900 rounded-lg text-xs font-medium hover:bg-brand-400 transition-colors">
              <Download size={12} /> Export
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
