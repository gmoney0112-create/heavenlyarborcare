import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Called by n8n after Remotion render completes
// POST /api/estimates/create
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      customer_name,
      customer_phone,
      customer_email,
      job_type,
      address,
      video_url,
      price_estimate,
    } = body

    if (!customer_name || !customer_phone || !job_type || !address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const deposit_amount = parseFloat((price_estimate * 0.5).toFixed(2))

    const { data, error } = await supabaseAdmin
      .from('estimates')
      .insert({
        customer_name,
        customer_phone,
        customer_email: customer_email || '',
        job_type,
        address,
        video_url: video_url || null,
        price_estimate: parseFloat(price_estimate),
        deposit_amount,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    // Return the estimate ID so n8n can build the portal link
    return NextResponse.json({
      id: data.id,
      portal_url: `${process.env.NEXT_PUBLIC_BASE_URL}/estimate/${data.id}`,
      deposit_amount,
    })
  } catch (err) {
    console.error('create estimate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
