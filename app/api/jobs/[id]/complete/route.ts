import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendSMS, sendEmail } from '@/lib/ghl'
import { BUSINESS_PHONE } from '@/lib/constants'

// POST /api/jobs/[id]/complete — mark job done and trigger review requests
// Called from admin dashboard "Mark Complete" button
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch job + linked estimate
    const { data: job, error: jobErr } = await supabaseAdmin
      .from('jobs')
      .select('*, estimates(*)')
      .eq('id', params.id)
      .single()

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Mark job complete
    await supabaseAdmin
      .from('jobs')
      .update({ status: 'complete' })
      .eq('id', params.id)

    // Mark estimate complete
    await supabaseAdmin
      .from('estimates')
      .update({ status: 'completed' })
      .eq('id', job.estimate_id)

    // Send review requests (immediate — or use a cron/delay in production)
    const estimate = job.estimates as Record<string, unknown>
    await sendReviewRequests(job.id, estimate)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('complete job error:', err)
    return NextResponse.json({ error: 'Failed to complete job' }, { status: 500 })
  }
}

async function sendReviewRequests(
  jobId: string,
  estimate: Record<string, unknown>
) {
  const googleReviewLink =
    process.env.GOOGLE_REVIEW_LINK ||
    'https://g.page/r/heavenly-arbor/review'

  const firstName = (estimate.customer_name as string).split(' ')[0]
  const service = formatJobType(estimate.job_type as string)

  // SMS
  try {
    await sendSMS(
      estimate.customer_phone as string,
      `Hi ${firstName}! Your ${service} from Heavenly Arbor is complete. ` +
        `How did we do? A quick review means the world to us: ${googleReviewLink} 🌟`
    )
  } catch (e) {
    console.error('Review SMS failed:', e)
  }

  // Email
  if (estimate.customer_email) {
    try {
      await sendEmail(
        estimate.customer_email as string,
        estimate.customer_name as string,
        'How did we do? — Heavenly Arbor',
        buildReviewEmail(firstName, service, googleReviewLink)
      )
    } catch (e) {
      console.error('Review email failed:', e)
    }
  }

  // Mark review as sent
  await supabaseAdmin
    .from('jobs')
    .update({ review_requested: true, review_sent_at: new Date().toISOString() })
    .eq('id', jobId)
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

function buildReviewEmail(name: string, service: string, reviewLink: string) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#14532d;padding:20px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:white;margin:0;font-size:22px">🌳 Heavenly Arbor Care Services</h1>
      </div>
      <div style="background:white;padding:30px;border:1px solid #e5e7eb;border-top:none;text-align:center">
        <h2 style="color:#14532d">Thanks for choosing us, ${name}!</h2>
        <p style="color:#4b5563">
          We hope your <strong>${service}</strong> came out exactly how you imagined.
          If you're happy with the results, a Google review helps our small business
          reach more homeowners who need professional tree care.
        </p>
        <div style="margin:24px 0">
          <span style="font-size:32px">⭐⭐⭐⭐⭐</span>
        </div>
        <a href="${reviewLink}"
           style="display:inline-block;background:#14532d;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">
          Leave a Google Review
        </a>
        <p style="color:#9ca3af;font-size:13px;margin-top:24px">
          It only takes 60 seconds and makes a huge difference for us. Thank you!
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">
          Heavenly Arbor Care Services · San Antonio, TX · ${BUSINESS_PHONE}
        </p>
      </div>
    </div>
  `
}
