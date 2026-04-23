import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendSMS, sendEmail } from '@/lib/ghl'
import { BUSINESS_PHONE } from '@/lib/constants'

// POST /api/estimates/[id]/schedule
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { scheduledDate } = await req.json()

    if (!scheduledDate) {
      return NextResponse.json({ error: 'scheduledDate required' }, { status: 400 })
    }

    // Fetch the estimate
    const { data: estimate, error: fetchError } = await supabaseAdmin
      .from('estimates')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    // Update estimate with scheduled date
    const scheduledAt = new Date(scheduledDate).toISOString()

    await supabaseAdmin
      .from('estimates')
      .update({ status: 'scheduled', scheduled_date: scheduledAt })
      .eq('id', params.id)

    // Create the job record
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .insert({
        estimate_id: params.id,
        scheduled_date: scheduledAt,
        status: 'scheduled',
      })
      .select()
      .single()

    if (jobError) console.error('job insert error (non-fatal):', jobError)

    // Format date for messages
    const formattedDate = new Date(scheduledAt).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    // SMS confirmation
    try {
      await sendSMS(
        estimate.customer_phone,
        `📅 Heavenly Arbor: Your ${formatJobType(estimate.job_type)} is scheduled for ${formattedDate}! ` +
          `We'll send a reminder the day before. Questions? ${BUSINESS_PHONE}`
      )
    } catch (e) {
      console.error('SMS send failed (non-fatal):', e)
    }

    // Email confirmation with calendar-style details
    if (estimate.customer_email) {
      try {
        await sendEmail(
          estimate.customer_email,
          estimate.customer_name,
          `Service Scheduled — ${formattedDate} | Heavenly Arbor`,
          buildScheduleEmail(estimate, formattedDate)
        )
      } catch (e) {
        console.error('Email send failed (non-fatal):', e)
      }
    }

    return NextResponse.json({ success: true, jobId: job?.id || null })
  } catch (err) {
    console.error('schedule error:', err)
    return NextResponse.json({ error: 'Scheduling failed' }, { status: 500 })
  }
}

function formatJobType(type: string) {
  const m: Record<string, string> = {
    removal: 'Tree Removal',
    trimming: 'Tree Trimming',
    stump_grinding: 'Stump Grinding',
    storm_damage: 'Storm Damage',
    consultation: 'Consultation',
  }
  return m[type] || type
}

function buildScheduleEmail(estimate: Record<string, unknown>, formattedDate: string) {
  const name = (estimate.customer_name as string).split(' ')[0]
  const service = formatJobType(estimate.job_type as string)
  const address = estimate.address as string
  const balance = ((estimate.price_estimate as number) - (estimate.deposit_amount as number)).toFixed(2)

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#14532d;padding:20px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:white;margin:0;font-size:22px">🌳 Heavenly Arbor Care Services</h1>
      </div>
      <div style="background:white;padding:30px;border:1px solid #e5e7eb;border-top:none">
        <h2 style="color:#14532d;margin-top:0">You're Scheduled, ${name}!</h2>
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0;font-size:16px;font-weight:bold;color:#14532d">📅 ${formattedDate}</p>
          <p style="margin:4px 0 0;color:#4b5563;font-size:14px">${service} at ${address}</p>
        </div>
        <p style="color:#4b5563">Our crew will arrive between 7:00 AM – 9:00 AM. We'll send a reminder text the day before.</p>
        <p style="color:#4b5563"><strong>Balance due on completion:</strong> $${balance}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:13px;margin:0">
          Need to reschedule? Call ${BUSINESS_PHONE} at least 24 hours in advance.
        </p>
      </div>
    </div>
  `
}
