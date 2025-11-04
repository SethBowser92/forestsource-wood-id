import 'dotenv/config'
import Airtable from 'airtable'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import fetch from 'node-fetch'
import path from 'path'

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY! }).base(process.env.AIRTABLE_BASE_ID!)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const BUCKET = process.env.SUPABASE_BUCKET || 'species-images'
const TABLE = process.env.AIRTABLE_IMAGES_TABLE || 'Images'

async function sha256(buf: Buffer) { return crypto.createHash('sha256').update(buf).digest('hex') }

async function run() {
  console.log('Syncing Airtable → Supabase…')
  await base(TABLE).select({ view: 'Grid view' }).eachPage(async (records, next) => {
    for (const r of records) {
      const species_id = (Array.isArray(r.get('Species')) ? r.get('Species')[0] : r.get('Species')) as string
      const image_type = String(r.get('Image Type') || '').toLowerCase()
      const files = (r.get('Files') as any[]) || []
      const meta = {
        alt_text: r.get('Alt Text') || null, caption: r.get('Caption') || null,
        credit: r.get('Credit') || null, source_url: r.get('Source URL') || null, license: r.get('License') || null,
        is_primary: !!r.get('Is Primary'), sort: Number(r.get('Sort')) || 0, is_public: r.get('Is Public') !== false, verified: !!r.get('Verified')
      }
      for (const f of files) {
        const fr = await fetch(f.url); if (!fr.ok) { console.error('download failed', f.filename); continue }
        const buf = Buffer.from(await fr.arrayBuffer())
        const hash = await sha256(buf)
        const ext = path.extname(f.filename || '') || '.jpg'
        const key = `${species_id}/${image_type}/${hash}${ext}`
        const up = await supabase.storage.from(BUCKET).upload(key, buf, { upsert: false, contentType: f.type || 'image/jpeg' })
        if (up.error && !up.error.message.includes('exists')) { console.error('upload error', up.error.message); continue }
        const pub = supabase.storage.from(BUCKET).getPublicUrl(key)
        const row = { species_id, image_type, storage_path: key, cdn_url: pub.data.publicUrl, width: f.width ?? null, height: f.height ?? null, size_bytes: f.size ?? null, sha256: hash, ...meta }
        const ins = await supabase.from('species_images').insert(row).select().single()
        if (ins.error) console.error('db error', ins.error.message); else console.log('OK', species_id, image_type, f.filename)
      }
    }
    next()
  })
  console.log('Done.')
}
run().catch(e=>{ console.error(e); process.exit(1) })
