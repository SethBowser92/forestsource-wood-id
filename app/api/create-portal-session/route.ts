import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function POST(){
  const stripeSecret = process.env.STRIPE_SECRET_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const portalReturn = process.env.STRIPE_PORTAL_RETURN_URL || `${siteUrl}/account`
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!stripeSecret || !SUPABASE_URL || !SERVICE) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })

  const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' })
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  // lookup customer id from profiles
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${user.id}&select=stripe_customer_id`, {
    headers: { 'apikey': SERVICE, 'Authorization': `Bearer ${SERVICE}` }
  })
  const rows = await res.json() as Array<{ stripe_customer_id: string | null }>
  const customer = rows?.[0]?.stripe_customer_id
  if (!customer) return NextResponse.json({ error: 'No Stripe customer' }, { status: 400 })

  const session = await stripe.billingPortal.sessions.create({ customer, return_url: portalReturn })
  return NextResponse.json({ url: session.url })
}
