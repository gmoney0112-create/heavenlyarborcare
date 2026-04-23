import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/checkout — create Stripe checkout session
export async function POST(req: NextRequest) {
  try {
    const { estimateId } = await req.json()

    if (!estimateId) {
      return NextResponse.json({ error: 'estimateId required' }, { status: 400 })
    }

    const { data: estimate, error } = await supabaseAdmin
      .from('estimates')
      .select('*')
      .eq('id', estimateId)
      .single()

    if (error || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    if (['deposit_paid', 'scheduled', 'completed'].includes(estimate.status)) {
      return NextResponse.json({ error: 'Deposit already paid' }, { status: 409 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: estimate.customer_email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Heavenly Arbor — ${formatJobType(estimate.job_type)} Deposit`,
              description: `50% deposit for services at ${estimate.address}`,
            },
            unit_amount: Math.round(estimate.deposit_amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        estimate_id: estimateId,
        customer_name: estimate.customer_name,
        customer_phone: estimate.customer_phone,
      },
      success_url: `${baseUrl}/estimate/${estimateId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/estimate/${estimateId}/cancel`,
    })

    // Save session ID to estimate
    await supabaseAdmin
      .from('estimates')
      .update({ stripe_session_id: session.id, status: 'approved' })
      .eq('id', estimateId)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('checkout error:', err)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
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
