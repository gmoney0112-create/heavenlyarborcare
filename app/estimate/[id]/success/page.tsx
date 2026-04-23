'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import type { Estimate } from '@/types'
import { BUSINESS_PHONE, BUSINESS_PHONE_TEL } from '@/lib/constants'

export default function SuccessPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/estimates/${id}`)
      .then((r) => r.json())
      .then(setEstimate)
  }, [id])

  async function submitDate() {
    if (!selectedDate || !estimate) return
    setLoading(true)
    await fetch(`/api/estimates/${id}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledDate: selectedDate }),
    })
    setSubmitted(true)
    setLoading(false)
  }

  // Min date = tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  // Max date = 60 days out
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 60)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-green-50">
      <header className="bg-green-900 text-white py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <span className="text-2xl">🌳</span>
          <h1 className="font-bold text-lg">Heavenly Arbor Care Services</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 py-10 space-y-6">
        <div className="bg-white rounded-2xl shadow p-8 text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h2 className="text-2xl font-bold text-green-900">Payment Confirmed!</h2>
          {estimate && (
            <p className="text-gray-600">
              Thank you, {estimate.customer_name.split(' ')[0]}! Your $
              {estimate.deposit_amount.toFixed(2)} deposit has been received.
            </p>
          )}
        </div>

        {!submitted ? (
          <div className="bg-white rounded-2xl shadow p-6 space-y-4">
            <h3 className="font-semibold text-green-900 text-lg">Pick a Service Date</h3>
            <p className="text-gray-500 text-sm">
              Choose your preferred date and we'll confirm within 24 hours.
            </p>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={minDate}
              max={maxDateStr}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <button
              onClick={submitDate}
              disabled={!selectedDate || loading}
              className="w-full bg-green-800 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Confirming…' : 'Confirm Date'}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-6 text-center space-y-3">
            <div className="text-3xl">📅</div>
            <h3 className="font-bold text-green-900">Date Submitted!</h3>
            <p className="text-gray-500 text-sm">
              We'll send a confirmation text to finalize your appointment.
            </p>
            <p className="text-sm text-gray-400">
              Questions? Call{' '}
              <a href={`tel:${BUSINESS_PHONE_TEL}`} className="underline">
                {BUSINESS_PHONE}
              </a>
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
