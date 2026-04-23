import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { sendSMS, sendEmail } from '@/lib/ghl'
import { BUSINESS_PHONE } from '@/lib/constants'
import type Stripe from 'stripe'

export const config = { api: { bodyParser: false } }

// POST /api/webhooks/stripe
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Stripe webhook signature failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const estimateId = session.metadata?.estimate_id

    if (!estimateId) {
      console.error('No estimate_id in Stripe session metadata')
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    // Update estimate status
    const { data: estimate, error } = await supabaseAdmin
      .from('estimates')
      .update({
        status: 'deposit_paid',
        stripe_payment_intent_id: session.payment_intent as string,
        stripe_session_id: session.id,
      })
      .eq('id', estimateId)
      .select()
      .single()

    if (error || !estimate) {
      console.error('Failed to update estimate:', error)
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }

    // Send confirmation SMS via GHL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!
    const smsMessage =
      `✅ Heavenly Arbor: Deposit received! Your ${formatJobType(estimate.job_type)} is confirmed. ` +
      `Pick your service date here: ${baseUrl}/estimate/${estimateId}/success`

    try {
      await sendSMS(estimate.customer_phone, smsMessage)
    } catch (e) {
      console.error('GHL SMS failed (non-fatal):', e)
    }

    // Send confirmation email
    if (estimate.customer_email) {
      try {
        await sendEmail(
          estimate.customer_email,
          estimate.customer_name,
          'Deposit Confirmed — Heavenly Arbor Care Services',
          buildConfirmationEmail(estimate, baseUrl)
        )
      } catch (e) {
        console.error('GHL Email failed (non-fatal):', e)
      }
    }
  }

  return NextResponse.json({ received: true })
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

function buildConfirmationEmail(estimate: Record<string, unknown>, baseUrl: string) {
  const name = (estimate.customer_name as string).split(' ')[0]
  const service = formatJobType(estimate.job_type as string)
  const deposit = (estimate.deposit_amount as number).toFixed(2)
  const scheduleUrl = `${baseUrl}/estimate/${estimate.id}/success`

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#14532d;padding:20px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:white;margin:0;font-size:22px">🌳 Heavenly Arbor Care Services</h1>
        <p style="color:#86efac;margin:4px 0 0;font-size:13px">San Antonio, TX</p>
      </div>
      <div style="background:white;padding:30px;border:1px solid #e5e7eb;border-top:none">
        <h2 style="color:#14532d;margin-top:0">Deposit Confirmed, ${name}!</h2>
        <p style="color:#4b5563">Your <strong>$${deposit} deposit</strong> for <strong>${service}</strong> has been received.</p>
        <p style="color:#4b5563">Pick your preferred service date:</p>
        <a href="${scheduleUrl}"
           style="display:inline-block;background:#14532d;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:10px 0">
          Schedule My Service Date →
        </a>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:13px;margin:0">
          Questions? Call us at ${BUSINESS_PHONE} or reply to this email.
        </p>
      </div>
    </div>
  `
}
