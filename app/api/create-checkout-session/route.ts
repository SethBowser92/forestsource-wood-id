import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
export async function POST(req: NextRequest){
  const stripeSecret = process.env.STRIPE_SECRET_KEY
  const priceMonthly = process.env.STRIPE_PRICE_ID
  const priceAnnual = process.env.STRIPE_PRICE_ID_ANNUAL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!stripeSecret || !priceMonthly || !siteUrl || !SERVICE || !SUPABASE_URL)
    return NextResponse.json({ error: 'Stripe/Supabase not configured' }, { status: 500 })
  const { searchParams } = new URL(req.url)
  const plan = searchParams.get('plan') === 'annual' ? 'annual' : 'monthly'
  const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' })
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  let customerId: string | undefined
  if (user) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${user.id}&select=stripe_customer_id`, {
      headers: { 'apikey': SERVICE, 'Authorization': `Bearer ${SERVICE}` }
    })
    const rows = await res.json() as Array<{ stripe_customer_id: string | null }>
    if (rows?.[0]?.stripe_customer_id) customerId = rows[0].stripe_customer_id ?? undefined
  }
  if (!customerId) {
    const customer = await stripe.customers.create({ metadata: user ? { user_id: user.id } : {} })
    customerId = customer.id
    if (user) {
      await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE, 'Authorization': `Bearer ${SERVICE}`, 'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({ user_id: user.id, stripe_customer_id: customerId })
      })
    }
  }
  const priceId = plan === 'annual' ? (priceAnnual ?? priceMonthly) : priceMonthly
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer: customerId,
    success_url: `${siteUrl}/account`,
    cancel_url: `${siteUrl}/pricing`,
    allow_promotion_codes: true
  })
  return NextResponse.json({ url: session.url })
}
