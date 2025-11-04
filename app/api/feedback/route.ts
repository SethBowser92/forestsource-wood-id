import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function POST(req: NextRequest){
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { identification_id, sha256, was_correct, correct_species_id } = await req.json()
  if (!sha256 || typeof was_correct !== 'boolean') return NextResponse.json({ error: 'sha256 and was_correct required' }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const payload:any = { user_id: user.id, identification_id, sha256, was_correct, correct_species_id: correct_species_id || null }
  const r = await fetch(`${url}/rest/v1/user_feedback`, {
    method: 'POST',
    headers: { 'apikey': service, 'Authorization': `Bearer ${service}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify(payload)
  })
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 502 })
  return NextResponse.json({ ok: true })
}
