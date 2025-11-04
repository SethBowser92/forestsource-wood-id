import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
export const runtime = 'nodejs'
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const recordId = url.searchParams.get('recordId')
  if (!recordId) return NextResponse.json({ error: 'recordId required' }, { status: 400 })
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  const admin = process.env.ADMIN_EMAIL
  if (!user || (admin && user.email !== admin)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const baseId = process.env.AIRTABLE_BASE_ID
  const apiKey = process.env.AIRTABLE_API_KEY
  const imagesTable = process.env.AIRTABLE_IMAGES_TABLE || 'Images'
  if (!baseId || !apiKey) return NextResponse.json({ error: 'Airtable not configured' }, { status: 500 })
  const r = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(imagesTable)}/${recordId}`, { headers: { Authorization: `Bearer ${apiKey}` } })
  if (!r.ok) return NextResponse.json({ error: 'Airtable fetch failed', detail: await r.text() }, { status: 502 })
  const data = await r.json()
  const fields = data.fields || {}
  const files = Array.isArray(fields.Files) ? fields.Files.map((f:any)=> ({ url: f.url, filename: f.filename, size: f.size, type: f.type, width: f.width, height: f.height, thumbnails: f.thumbnails || null })) : []
  return NextResponse.json({
    recordId,
    species_id: Array.isArray(fields.Species) ? fields.Species[0] : (fields.Species || null),
    image_type: String(fields['Image Type'] || '').toLowerCase(),
    meta: { alt: fields['Alt Text'] || null, caption: fields['Caption'] || null, credit: fields['Credit'] || null, source_url: fields['Source URL'] || null, license: fields['License'] || null, is_primary: !!fields['Is Primary'], sort: Number(fields['Sort']) || 0, is_public: fields['Is Public'] !== false, verified: !!fields['Verified'] },
    files
  })
}
