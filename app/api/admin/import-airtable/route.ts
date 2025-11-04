import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import path from 'path'

export const runtime = 'nodejs'
async function sha256(buf: Buffer) { return crypto.createHash('sha256').update(buf).digest('hex') }

export async function POST(req: NextRequest) {
  const supabaseAuth = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabaseAuth.auth.getUser()
  const admin = process.env.ADMIN_EMAIL
  if (!user || (admin && user.email !== admin)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { recordId } = await req.json()
  if (!recordId) return NextResponse.json({ error: 'recordId required' }, { status: 400 })

  const baseId = process.env.AIRTABLE_BASE_ID
  const apiKey = process.env.AIRTABLE_API_KEY
  const imagesTable = process.env.AIRTABLE_IMAGES_TABLE || 'Images'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  const bucket = process.env.SUPABASE_BUCKET || 'species-images'
  if (!baseId || !apiKey || !supabaseUrl || !service) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })

  const r = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(imagesTable)}/${recordId}`, { headers: { Authorization: `Bearer ${apiKey}` } })
  if (!r.ok) return NextResponse.json({ error: 'Airtable fetch failed', detail: await r.text() }, { status: 502 })
  const data = await r.json() as any
  const fields = data.fields || {}
  const species_id = Array.isArray(fields.Species) ? fields.Species[0] : (fields.Species || null)
  const image_type = String(fields['Image Type'] || '').toLowerCase()
  if (!species_id || !image_type) return NextResponse.json({ error: 'Missing Species or Image Type in Airtable' }, { status: 400 })
  const files = Array.isArray(fields.Files) ? fields.Files : []

  const meta = { alt_text: fields['Alt Text'] || null, caption: fields['Caption'] || null, credit: fields['Credit'] || null, source_url: fields['Source URL'] || null, license: fields['License'] || null, is_primary: !!fields['Is Primary'], sort: Number(fields['Sort']) || 0, is_public: fields['Is Public'] !== false, verified: !!fields['Verified'] }
  const supabase = createClient(supabaseUrl, service)
  const results:any[] = []
  for (const f of files) {
    const fr = await fetch(f.url); if (!fr.ok) { results.push({ filename: f.filename, status: 'download_failed' }); continue }
    const buf = Buffer.from(await fr.arrayBuffer())
    const hash = await sha256(buf)
    const ext = path.extname(f.filename || '') || '.jpg'
    const key = `${species_id}/${image_type}/${hash}${ext}`
    const up = await supabase.storage.from(bucket).upload(key, buf, { upsert: false, contentType: f.type || 'image/jpeg' })
    if (up.error && !up.error.message.includes('exists')) { results.push({ filename: f.filename, status: 'upload_error', error: up.error.message }); continue }
    const pub = supabase.storage.from(bucket).getPublicUrl(key)
    const row = { species_id, image_type, storage_path: key, cdn_url: pub.data.publicUrl, width: f.width ?? null, height: f.height ?? null, size_bytes: f.size ?? null, sha256: hash, ...meta }
    const ins = await supabase.from('species_images').insert(row).select().single()
    if (ins.error) results.push({ filename: f.filename, status: 'db_error', error: ins.error.message })
    else results.push({ filename: f.filename, status: 'ok', id: ins.data.id })
  }
  return NextResponse.json({ recordId, results })
}
