import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/jobs?estimateId=xxx
export async function GET(req: NextRequest) {
  const estimateId = req.nextUrl.searchParams.get('estimateId')
  if (!estimateId) {
    return NextResponse.json({ error: 'estimateId required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('estimate_id', estimateId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
