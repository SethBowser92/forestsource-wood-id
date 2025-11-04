import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
export const runtime = 'nodejs'
export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  const form = await req.formData()
  const image = form.get('image') as File | null
  if (!image) return NextResponse.json({ error: 'No image' }, { status: 400 })
  const SUPABASE_FN_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTION_IDENTIFY_URL
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!SUPABASE_FN_URL || !SUPABASE_ANON) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  // RATE LIMIT: max 3 per 10 seconds per user/IP
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '0.0.0.0'
  const now = new Date().toISOString()
  const past = new Date(Date.now() - 10_000).toISOString()
  const who = user?.id ? `user_id=eq.${user.id}` : `ip_hash=eq.${await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip)).then(d=>Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,'0')).join(''))}`
  const head = await fetch(`${SUPABASE_URL}/rest/v1/identifications?and=(created_at.gte.${past},created_at.lte.${now})&${who}`, {
    method: 'HEAD', headers: { 'apikey': SERVICE, 'Authorization': `Bearer ${SERVICE}` }
  })
  const used = Number(head.headers.get('content-range')?.split('/')?.[1] || '0')
  if (used >= 3) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  const out = new FormData(); out.append('image', image)
  const r = await fetch(SUPABASE_FN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON}`,
      ...(user?.id ? { 'x-user-id': user.id } : {})
    },
    body: out
  })
  const data = await r.json()
  return NextResponse.json(data, { status: r.status })
}
