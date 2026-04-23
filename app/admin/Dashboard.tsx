'use client'

import { useState } from 'react'
import type { Estimate, EstimateStatus } from '@/types'

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:      { label: 'Pending',      color: 'bg-yellow-100 text-yellow-800' },
  viewed:       { label: 'Viewed',       color: 'bg-blue-100 text-blue-800' },
  approved:     { label: 'Approved',     color: 'bg-purple-100 text-purple-800' },
  deposit_paid: { label: 'Deposit Paid', color: 'bg-green-100 text-green-700' },
  scheduled:    { label: 'Scheduled',    color: 'bg-green-200 text-green-900' },
  completed:    { label: 'Completed',    color: 'bg-gray-100 text-gray-600' },
}

const JOB_LABELS: Record<string, string> = {
  removal:        'Tree Removal',
  trimming:       'Tree Trimming',
  stump_grinding: 'Stump Grinding',
  storm_damage:   'Storm Damage',
  consultation:   'Consultation',
}

const TABS = [
  { key: 'all',          label: 'All' },
  { key: 'pending',      label: 'Pending' },
  { key: 'viewed',       label: 'Viewed' },
  { key: 'deposit_paid', label: 'Deposit Paid' },
  { key: 'scheduled',    label: 'Scheduled' },
  { key: 'completed',    label: 'Completed' },
]

interface Props {
  estimates: Estimate[]
  totalRevenue: number
  pendingCount: number
}

export default function AdminDashboard({ estimates, totalRevenue, pendingCount }: Props) {
  const [filter, setFilter] = useState('all')
  const [completing, setCompleting] = useState<string | null>(null)
  const [rows, setRows] = useState<Estimate[]>(estimates)

  const filtered = filter === 'all' ? rows : rows.filter((e) => e.status === filter)

  async function handleMarkComplete(estimateId: string) {
    setCompleting(estimateId)
    try {
      const jobsRes = await fetch(`/api/jobs?estimateId=${estimateId}`)
      if (!jobsRes.ok) throw new Error('Could not fetch job')
      const jobs = await jobsRes.json()
      const job = Array.isArray(jobs) ? jobs[0] : null
      if (!job) throw new Error('No job record found for this estimate')

      const completeRes = await fetch(`/api/jobs/${job.id}/complete`, { method: 'POST' })
      if (!completeRes.ok) throw new Error('Mark complete request failed')

      setRows((prev) =>
        prev.map((e) =>
          e.id === estimateId ? { ...e, status: 'completed' as EstimateStatus } : e
        )
      )
    } catch (err) {
      console.error('Mark complete failed:', err)
      alert('Failed to mark complete. Check console for details.')
    } finally {
      setCompleting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Estimates" value={String(rows.length)} />
        <StatCard label="Deposits Collected" value={`$${totalRevenue.toFixed(2)}`} highlight />
        <StatCard label="Awaiting Review" value={String(pendingCount)} warn={pendingCount > 0} />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const count = tab.key === 'all' ? rows.length : rows.filter((e) => e.status === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                filter === tab.key
                  ? 'bg-green-800 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-green-400'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-60">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Estimate cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-400">
          No estimates in this category.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((estimate) => {
            const meta = STATUS_META[estimate.status] ?? { label: estimate.status, color: 'bg-gray-100 text-gray-600' }
            const canComplete = estimate.status === 'scheduled'

            return (
              <div key={estimate.id} className="bg-white rounded-2xl shadow p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Left: customer info */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{estimate.customer_name}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {JOB_LABELS[estimate.job_type] ?? estimate.job_type} · {estimate.address}
                    </p>
                    <p className="text-sm text-gray-500">
                      <a href={`tel:${estimate.customer_phone}`} className="underline hover:text-green-700">
                        {estimate.customer_phone}
                      </a>
                      {estimate.customer_email && (
                        <>
                          {' · '}
                          <a href={`mailto:${estimate.customer_email}`} className="underline hover:text-green-700 break-all">
                            {estimate.customer_email}
                          </a>
                        </>
                      )}
                    </p>
                    {estimate.scheduled_date && (
                      <p className="text-sm font-medium text-green-700">
                        📅{' '}
                        {new Date(estimate.scheduled_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>

                  {/* Right: financials */}
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="text-xl font-bold text-gray-900">${estimate.price_estimate.toFixed(2)}</p>
                    <p className="text-sm text-green-700 font-medium">${estimate.deposit_amount.toFixed(2)} deposit</p>
                    <p className="text-xs text-gray-400">
                      {new Date(estimate.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                  <a
                    href={`/estimate/${estimate.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-700 underline hover:text-green-900 transition"
                  >
                    View customer portal →
                  </a>
                  {canComplete && (
                    <button
                      onClick={() => handleMarkComplete(estimate.id)}
                      disabled={completing === estimate.id}
                      className="ml-auto px-4 py-1.5 bg-green-800 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {completing === estimate.id ? 'Completing…' : 'Mark Complete ✓'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight = false,
  warn = false,
}: {
  label: string
  value: string
  highlight?: boolean
  warn?: boolean
}) {
  return (
    <div className={`rounded-2xl shadow p-5 ${highlight ? 'bg-green-800 text-white' : 'bg-white'}`}>
      <p className={`text-sm font-medium mb-1 ${highlight ? 'text-green-200' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-2xl font-bold ${warn ? 'text-yellow-600' : highlight ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  )
}
