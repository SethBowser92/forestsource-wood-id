import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  const buf = await req.text();
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return NextResponse.json({ error: 'No signature' }, { status: 400 });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(buf, sig, secret); }
  catch (err: any) { return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 }); }
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  async function mapCustomerToUserId(customerId: string): Promise<string | null> {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?stripe_customer_id=eq.${customerId}&select=user_id`, {
      headers: { 'apikey': SERVICE, 'Authorization': `Bearer ${SERVICE}` }
    })
    const rows = await r.json() as Array<{ user_id: string }>
    return rows?.[0]?.user_id ?? null
  }
  async function upsertSubscription(customerId: string, status: string, currentPeriodEnd?: number) {
    const userId = await mapCustomerToUserId(customerId);
    const body: any = {
      customer_id: customerId,
      status,
      plan: status === 'active' ? 'pro' : 'free',
      current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
      ...(userId ? { user_id: userId } : {})
    };
    await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE,
        'Authorization': `Bearer ${SERVICE}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(body)
    });
  }
  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session;
      await upsertSubscription(String(s.customer), 'active', s.expires_at ?? undefined);
      break;
    }
    case 'invoice.payment_succeeded': {
      const inv = event.data.object as Stripe.Invoice;
      await upsertSubscription(String(inv.customer), 'active', inv.lines.data[0]?.period?.end);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await upsertSubscription(String(sub.customer), 'canceled', sub.current_period_end);
      break;
    }
  }
  return NextResponse.json({ received: true });
}
