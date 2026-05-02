'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { StudentForm } from '@/components/students/StudentForm'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TableSkeleton } from '@/components/shared/SkeletonLoader'
import { WhatsAppQueueModal } from '@/components/shared/WhatsAppQueueModal'
import { formatDate, buildWhatsAppLink, buildReminderMessage } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, Search, Filter, Users, ChevronLeft, ChevronRight, UserX, MessageSquare, Pencil, Trash2 } from 'lucide-react'
import type { StudentFormData } from '@/lib/validations'

import { CLASS_OPTIONS } from '@/lib/constants/classes'

export default function StudentsPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editStudent, setEditStudent] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])

  const params = new URLSearchParams({ page: String(page), limit: '10', search, class: filterClass, status: filterStatus })
  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search, filterClass, filterStatus],
    queryFn: async () => {
      const res = await fetch(`/api/students?${params}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch students')
      }
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (d: StudentFormData) => {
      const subjects = d.subjects ?? ''
      const res = await fetch('/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create student')
      }
      return res.json()
    },
    onSuccess: () => { toast.success('Student added successfully'); qc.invalidateQueries({ queryKey: ['students'] }); setAddOpen(false) },
    onError: (err: any) => toast.error(`Error: ${err.message}`),
  })

  const updateMutation = useMutation({
    mutationFn: async (d: StudentFormData) => {
      const res = await fetch(`/api/students/${editStudent.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update')
      }
      return res.json()
    },
    onSuccess: () => { toast.success('Student updated'); qc.invalidateQueries({ queryKey: ['students'] }); setEditStudent(null) },
    onError: (err: any) => toast.error(`Error: ${err.message}`),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => { toast.success('Student removed'); qc.invalidateQueries({ queryKey: ['students'] }); setDeleteId(null) },
    onError: () => toast.error('Failed to delete student'),
  })

  const toggleSelect = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const toggleAll = () => setSelected(s => s.length === data?.students?.length ? [] : data?.students?.map((s: any) => s.id) ?? [])

  const { data: settings } = useQuery({
    queryKey: ['settings-institute'],
    queryFn: async () => {
      const res = await fetch('/api/settings/institute')
      return res.json()
    }
  })

  const [queueOpen, setQueueOpen] = useState(false)
  const [queueItems, setQueueItems] = useState<{ id: string, name: string, phone: string, message: string }[]>([])

  const handleBulkWhatsApp = () => {
    const items: { id: string, name: string, phone: string, message: string }[] = []
    selected.forEach(id => {
      const student = data?.students?.find((s: any) => s.id === id)
      if (student) {
        let amount = student.monthlyFee ?? 1500
        const latestFee = student.feeRecords?.[0]
        if (latestFee && (latestFee.status === 'PENDING' || latestFee.status === 'PARTIAL')) {
          amount = latestFee.amount - latestFee.paidAmount
        }
        const msg = buildReminderMessage(
          student.name, 
          amount, 
          'this month', 
          new Date(),
          settings?.name,
          settings?.phone
        )
        items.push({ id: student.id, name: student.name, phone: student.phone, message: msg })
      }
    })
    setQueueItems(items)
    setQueueOpen(true)
  }

  return (
    <AppLayout title="Students">
      <WhatsAppQueueModal 
        isOpen={queueOpen} 
        onClose={() => setQueueOpen(false)} 
        items={queueItems} 
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 max-w-sm">
          <Search size={15} className="text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search by name or phone…" className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-400" />
        </div>

        {/* Filters */}
        <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setPage(1) }} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 outline-none">
          <option value="">All Classes</option>
          {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 outline-none">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <div className="flex-1 sm:flex-none" />
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-300 text-gray-900 rounded-xl text-sm font-medium hover:bg-brand-400 transition-colors">
          <Plus size={16} /> Add Student
        </button>
      </div>

      {selected.length > 0 && (
        <div className="mb-3 flex items-center gap-3 px-4 py-2.5 bg-brand-50 border border-brand-200 rounded-xl text-sm text-brand-700">
          <span>{selected.length} selected</span>
          <button className="flex items-center gap-1.5 px-3 py-1 bg-brand-300 text-gray-900 rounded-lg text-xs font-medium hover:bg-brand-400" onClick={handleBulkWhatsApp}>
            <MessageSquare size={12} /> Send WhatsApp
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100" onClick={() => setSelected([])}>
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left w-10">
                  <input type="checkbox" checked={selected.length === (data?.students?.length ?? 0) && selected.length > 0} onChange={toggleAll} className="rounded" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">School</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fee Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Enrolled</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="p-5"><TableSkeleton rows={10} cols={6} /></td></tr>
              ) : data?.students?.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon={Users} title="No students found" description="Add your first student to get started" /></td></tr>
              ) : data?.students?.map((s: any) => {
                const latestFee = s.feeRecords?.[0]
                return (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => router.push(`/students/${s.id}`)}>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleSelect(s.id)} className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                          {s.name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{s.name}</div>
                          {!s.isActive && <span className="text-[10px] text-rose-500 font-medium">Inactive</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell truncate max-w-[140px]">{s.school}</td>
                    <td className="px-4 py-3 text-gray-600 font-medium whitespace-nowrap">{s.class}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{s.phone}</td>
                    <td className="px-4 py-3">
                      {latestFee ? <StatusBadge status={latestFee.status} /> : <span className="text-xs text-gray-400">No record</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden lg:table-cell text-xs">{formatDate(s.enrolledAt)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditStudent(s)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/30">
            <span className="text-xs text-gray-400">Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, data.total)} of {data.total}</span>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 text-gray-500">
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-gray-600 px-2">Page {page} of {data.pages}</span>
              <button disabled={page === data.pages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 text-gray-500">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <StudentForm open={addOpen} onClose={() => setAddOpen(false)} onSubmit={createMutation.mutateAsync} loading={createMutation.isPending} />
      <StudentForm open={!!editStudent} onClose={() => setEditStudent(null)} onSubmit={updateMutation.mutateAsync} title="Edit Student" loading={updateMutation.isPending}
        defaultValues={editStudent ? {
          name: editStudent.name ?? '',
          phone: editStudent.phone ?? '',
          guardianPhone: editStudent.guardianPhone ?? '',
          school: editStudent.school ?? '',
          class: editStudent.class ?? '',
          subjects: Array.isArray(editStudent.subjects) ? editStudent.subjects.join(', ') : (editStudent.subjects ?? ''),
          address: editStudent.address ?? '',
          profilePhoto: editStudent.profilePhoto ?? '',
          monthlyFee: editStudent.monthlyFee ?? undefined,
          isActive: editStudent.isActive ?? true,
        } : undefined} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMutation.mutateAsync(deleteId!)} title="Delete Student" description="This will permanently delete the student and all their records. This cannot be undone." confirmLabel="Delete" loading={deleteMutation.isPending} />
    </AppLayout>
  )
}
