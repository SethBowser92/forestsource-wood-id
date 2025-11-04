import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest){
  const { id, reason } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const r = await fetch(`${url}/rest/v1/species_images?id=eq.${id}`, {
    method: 'PATCH',
    headers: { 'apikey': service, 'Authorization': `Bearer ${service}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ moderation_status: 'pending' })
  })
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 502 })
  return NextResponse.json({ ok: true })
}
