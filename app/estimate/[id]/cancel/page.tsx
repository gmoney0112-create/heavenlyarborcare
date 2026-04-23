'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { BUSINESS_PHONE, BUSINESS_PHONE_TEL } from '@/lib/constants'

export default function CancelPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow p-8 max-w-md text-center space-y-4">
        <div className="text-4xl">↩️</div>
        <h2 className="text-xl font-bold text-gray-800">Payment Cancelled</h2>
        <p className="text-gray-500 text-sm">
          No worries — your estimate is saved. You can return to approve it any time.
        </p>
        <Link
          href={`/estimate/${id}`}
          className="inline-block w-full bg-green-800 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition"
        >
          Back to My Estimate
        </Link>
        <p className="text-xs text-gray-400">
          Questions?{' '}
          <a href={`tel:${BUSINESS_PHONE_TEL}`} className="underline">
            {BUSINESS_PHONE}
          </a>
        </p>
      </div>
    </div>
  )
}
