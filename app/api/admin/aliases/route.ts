import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  const admin = process.env.ADMIN_EMAIL
  if (!user || (admin && user.email !== admin)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const r = await fetch(`${url}/rest/v1/species_aliases?select=alias,species_id&order=alias.asc`, { headers: { 'apikey': anon, 'Authorization': `Bearer ${anon}` } })
  if (!r.ok) return NextResponse.json({ error: 'Fetch failed' }, { status: 502 })
  const rows = await r.json()
  return NextResponse.json({ rows })
}

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  const admin = process.env.ADMIN_EMAIL
  if (!user || (admin && user.email !== admin)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { alias, species_id } = await req.json()
  if (!alias || !species_id) return NextResponse.json({ error: 'alias and species_id required' }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const r = await fetch(`${url}/rest/v1/species_aliases`, {
    method: 'POST',
    headers: { 'apikey': service, 'Authorization': `Bearer ${service}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ alias, species_id })
  })
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 502 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  const admin = process.env.ADMIN_EMAIL
  if (!user || (admin && user.email !== admin)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const alias = new URL(req.url).searchParams.get('alias')
  if (!alias) return NextResponse.json({ error: 'alias required' }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const r = await fetch(`${url}/rest/v1/species_aliases?alias=eq.${encodeURIComponent(alias)}`, {
    method: 'DELETE',
    headers: { 'apikey': service, 'Authorization': `Bearer ${service}` }
  })
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 502 })
  return NextResponse.json({ ok: true })
}
