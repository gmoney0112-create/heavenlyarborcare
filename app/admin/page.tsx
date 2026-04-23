import { supabaseAdmin } from '@/lib/supabase'
import type { Estimate } from '@/types'
import AdminDashboard from './Dashboard'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const { data, error } = await supabaseAdmin
    .from('estimates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-red-700">
        <p className="font-semibold">Failed to load estimates</p>
        <p className="text-sm mt-1 font-mono">{error.message}</p>
        <p className="text-sm mt-3 text-red-500">
          Check that SUPABASE_SERVICE_ROLE_KEY is set correctly in your environment.
        </p>
      </div>
    )
  }

  const estimates = (data ?? []) as Estimate[]

  const revenueStatuses = new Set(['deposit_paid', 'scheduled', 'completed'])
  const totalRevenue = estimates
    .filter((e) => revenueStatuses.has(e.status))
    .reduce((sum, e) => sum + e.deposit_amount, 0)

  const pendingCount = estimates.filter((e) => e.status === 'pending').length

  return (
    <AdminDashboard
      estimates={estimates}
      totalRevenue={totalRevenue}
      pendingCount={pendingCount}
    />
  )
}
