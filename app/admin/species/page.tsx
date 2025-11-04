'use client'
import { useState } from 'react'

type FileInfo = { url:string; filename:string; size?:number; type?:string; width?:number; height?:number; thumbnails?: any }
type Preview = { recordId:string; species_id:string|null; image_type:string; meta:any; files:FileInfo[] }

export default function AdminSpeciesPage(){
  const [recordId, setRecordId] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const onPreview = async () => {
    setLoading(true); setError(null)
    try {
      const r = await fetch(`/api/admin/list-airtable?recordId=${encodeURIComponent(recordId)}`)
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Failed')
      setPreview(data)
    } catch (e:any) { setError(e.message) } finally { setLoading(false) }
  }
  const onImport = async () => {
    if (!preview) return
    setImporting(true); setError(null); setResult(null)
    try {
      const r = await fetch('/api/admin/import-airtable', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ recordId: preview.recordId }) })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Import failed')
      setResult(data)
    } catch (e:any) { setError(e.message) } finally { setImporting(false) }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold mb-2">Admin · Species Image Import</h1>
        <p className="text-sm text-gray-600 mb-4">Paste an Airtable <b>Images</b> record ID (recXXXXXXXX) and import attachments into Supabase.</p>
        <div className="flex gap-2">
          <input className="flex-1 border rounded-xl px-4 py-2" placeholder="Airtable record ID"
            value={recordId} onChange={e=>setRecordId(e.target.value)} />
          <button className="btn-outline" onClick={onPreview} disabled={!recordId || loading}>{loading ? 'Loading…' : 'Preview'}</button>
          <button className="btn-primary" onClick={onImport} disabled={!preview || importing}>{importing ? 'Importing…' : 'Import'}</button>
        </div>
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </div>
      {preview && (
        <div className="card">
          <div className="mb-3 text-sm text-gray-700">
            <div><b>Species:</b> {preview.species_id || '-'}</div>
            <div><b>Image type:</b> {preview.image_type || '-'}</div>
            <div><b>Files:</b> {preview.files.length}</div>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {preview.files.map((f, i) => (
              <div key={i} className="border rounded-xl p-2">
                <div className="aspect-video bg-gray-100 rounded mb-2 overflow-hidden">
                  <img src={(f.thumbnails?.large?.url || f.thumbnails?.small?.url || f.url)} className="w-full h-full object-cover" />
                </div>
                <div className="text-xs text-gray-700 break-all">{f.filename}</div>
                <div className="text-[11px] text-gray-500">{(f.width||'?')}×{(f.height||'?')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {result && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">Import results</h2>
          <ul className="text-sm">
            {result.results.map((r:any, idx:number)=>(
              <li key={idx} className={r.status==='ok'?'text-green-700':'text-red-700'}>
                {r.status.toUpperCase()} — {r.filename} {r.id ? `(id ${r.id})` : r.error ? `(${r.error})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
