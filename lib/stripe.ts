import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
      apiVersion: '2024-09-30.acacia',
    })
  }
  return _stripe
}

// Keep backward compat export
export const stripe = { ...{} } as unknown as Stripe
Object.defineProperty(stripe, 'checkout', { get: () => getStripe().checkout })
Object.defineProperty(stripe, 'paymentIntents', { get: () => getStripe().paymentIntents })
Object.defineProperty(stripe, 'webhooks', { get: () => getStripe().webhooks })
Object.defineProperty(stripe, 'prices', { get: () => getStripe().prices })
Object.defineProperty(stripe, 'products', { get: () => getStripe().products })
