'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { Estimate } from '@/types'
import { BUSINESS_PHONE, BUSINESS_PHONE_TEL } from '@/lib/constants'

const JOB_TYPE_LABELS: Record<string, string> = {
  removal: 'Tree Removal',
  trimming: 'Tree Trimming',
  stump_grinding: 'Stump Grinding',
  storm_damage: 'Storm Damage',
  consultation: 'Consultation',
}

export default function EstimatePage() {
  const { id } = useParams<{ id: string }>()
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewed, setViewed] = useState(false)

  useEffect(() => {
    async function fetchEstimate() {
      try {
        const res = await fetch(`/api/estimates/${id}`)
        if (!res.ok) throw new Error('Estimate not found')
        const data: Estimate = await res.json()
        setEstimate(data)
        // Mark as viewed if still pending
        if (data.status === 'pending') {
          await fetch(`/api/estimates/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'viewed' }),
          })
          setViewed(true)
        }
      } catch (e) {
        setError('We couldn\'t find that estimate. Please contact us.')
      } finally {
        setLoading(false)
      }
    }
    fetchEstimate()
  }, [id])

  async function handleApproveAndPay() {
    if (!estimate) return
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimateId: estimate.id }),
      })
      if (!res.ok) throw new Error('Failed to create checkout session')
      const { url } = await res.json()
      window.location.href = url
    } catch (e) {
      setError('Could not start checkout. Please try again.')
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-green-800 text-lg animate-pulse">Loading your estimate…</div>
      </div>
    )
  }

  if (error || !estimate) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-8 max-w-md text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-gray-500 mt-2 text-sm">
            Call us: <a href={`tel:${BUSINESS_PHONE_TEL}`} className="underline">{BUSINESS_PHONE}</a>
          </p>
        </div>
      </div>
    )
  }

  const isPaid = ['deposit_paid', 'scheduled', 'completed'].includes(estimate.status)
  const isScheduled = ['scheduled', 'completed'].includes(estimate.status)

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <header className="bg-green-900 text-white py-4 px-6 shadow">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <span className="text-2xl">🌳</span>
          <div>
            <h1 className="font-bold text-lg leading-tight">Heavenly Arbor Care Services</h1>
            <p className="text-green-300 text-xs">San Antonio, TX — Licensed & Insured</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 py-8 space-y-6">
        {/* Status badge */}
        <StatusBadge status={estimate.status} />

        {/* Customer greeting */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-green-900">
            Hi {estimate.customer_name.split(' ')[0]}, here&apos;s your estimate!
          </h2>
          <p className="text-gray-500 text-sm mt-1">{estimate.address}</p>
        </div>

        {/* Video */}
        {estimate.video_url && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-green-900">Your Personalized Video Estimate</h3>
            </div>
            <div className="aspect-video bg-black">
              <video
                src={estimate.video_url}
                controls
                autoPlay
                muted
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {/* Job details */}
        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h3 className="font-semibold text-green-900">Job Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Service</p>
              <p className="font-medium">{JOB_TYPE_LABELS[estimate.job_type] || estimate.job_type}</p>
            </div>
            <div>
              <p className="text-gray-500">Location</p>
              <p className="font-medium">{estimate.address}</p>
            </div>
            {isScheduled && estimate.scheduled_date && (
              <div>
                <p className="text-gray-500">Scheduled Date</p>
                <p className="font-medium text-green-700">
                  {new Date(estimate.scheduled_date).toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-semibold text-green-900 mb-4">Pricing</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Estimate</span>
              <span className="font-medium">${estimate.price_estimate.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-3">
              <span className="text-gray-600">Deposit Due Today (50%)</span>
              <span className="font-semibold text-green-700">${estimate.deposit_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Balance due on completion</span>
              <span>${(estimate.price_estimate - estimate.deposit_amount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        {!isPaid && (
          <div className="bg-green-900 rounded-2xl shadow p-6 text-white text-center space-y-3">
            <h3 className="font-bold text-lg">Ready to get started?</h3>
            <p className="text-green-300 text-sm">
              Secure your spot with a 50% deposit. Balance due on completion.
            </p>
            <button
              onClick={handleApproveAndPay}
              disabled={checkoutLoading}
              className="w-full bg-white text-green-900 font-bold py-4 rounded-xl text-lg hover:bg-green-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {checkoutLoading ? 'Redirecting to checkout…' : `Approve & Pay $${estimate.deposit_amount.toFixed(2)} Deposit`}
            </button>
            <p className="text-green-400 text-xs">Secure payment powered by Stripe</p>
          </div>
        )}

        {isPaid && (
          <div className="bg-green-800 rounded-2xl shadow p-6 text-white text-center">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="font-bold text-lg">Deposit Received — You&apos;re Confirmed!</h3>
            <p className="text-green-300 text-sm mt-1">
              {isScheduled
                ? "We'll see you on your scheduled date."
                : "We'll reach out shortly to schedule your service."}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-400 text-xs pb-4">
          Questions? Call{' '}
          <a href={`tel:${BUSINESS_PHONE_TEL}`} className="underline">
            {BUSINESS_PHONE}
          </a>{' '}
          or reply to our text message.
        </div>
      </main>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending:      { label: 'Awaiting Review', color: 'bg-yellow-100 text-yellow-800' },
    viewed:       { label: 'Estimate Viewed', color: 'bg-blue-100 text-blue-800' },
    approved:     { label: 'Approved', color: 'bg-green-100 text-green-800' },
    deposit_paid: { label: 'Deposit Paid ✓', color: 'bg-green-100 text-green-800' },
    scheduled:    { label: 'Job Scheduled ✓', color: 'bg-green-100 text-green-800' },
    completed:    { label: 'Job Complete ✓', color: 'bg-gray-100 text-gray-700' },
  }
  const s = map[status] || { label: status, color: 'bg-gray-100 text-gray-700' }
  return (
    <div className="flex justify-end">
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.color}`}>
        {s.label}
      </span>
    </div>
  )
}
