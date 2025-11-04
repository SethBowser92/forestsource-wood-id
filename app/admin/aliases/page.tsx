'use client'
import { useEffect, useState } from 'react'

type AliasRow = { alias: string; species_id: string }
export default function AdminAliases(){
  const [rows,setRows] = useState<AliasRow[]>([])
  const [alias,setAlias] = useState('')
  const [speciesId,setSpeciesId] = useState('')
  const [loading,setLoading] = useState(false)
  const [err,setErr] = useState<string|null>(null)

  const fetchAll = async () => {
    setLoading(true); setErr(null)
    try{
      const r = await fetch('/api/admin/aliases')
      const j = await r.json()
      if(!r.ok) throw new Error(j.error||'Failed')
      setRows(j.rows||[])
    } catch(e:any){ setErr(e.message) } finally{ setLoading(false) }
  }
  useEffect(()=>{ fetchAll() }, [])

  const onAdd = async () => {
    if(!alias || !speciesId) return
    setLoading(true); setErr(null)
    try{
      const r = await fetch('/api/admin/aliases',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ alias, species_id: speciesId })})
      const j = await r.json(); if(!r.ok) throw new Error(j.error||'Failed')
      setAlias(''); setSpeciesId(''); fetchAll()
    }catch(e:any){ setErr(e.message) } finally{ setLoading(false) }
  }
  const onDelete = async (a:string) => {
    if(!confirm(`Delete alias "${a}"?`)) return
    setLoading(true); setErr(null)
    try{
      const r = await fetch('/api/admin/aliases?alias='+encodeURIComponent(a), { method:'DELETE' })
      const j = await r.json(); if(!r.ok) throw new Error(j.error||'Failed')
      fetchAll()
    }catch(e:any){ setErr(e.message) } finally{ setLoading(false) }
  }

  return <div className="space-y-6">
    <div className="card">
      <h1 className="text-2xl font-bold mb-2">Admin · Species Aliases</h1>
      <p className="text-sm text-gray-600 mb-4">Map model labels or common names to canonical <code>species.id</code>.</p>
      <div className="flex gap-2">
        <input className="border rounded-xl px-3 py-2 flex-1" placeholder="alias (e.g., red oak)" value={alias} onChange={e=>setAlias(e.target.value)} />
        <input className="border rounded-xl px-3 py-2 flex-1" placeholder="species_id (e.g., quercus_rubra)" value={speciesId} onChange={e=>setSpeciesId(e.target.value)} />
        <button className="btn-primary" onClick={onAdd} disabled={loading}>Add</button>
      </div>
      {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
    </div>
    <div className="card">
      <h2 className="text-xl font-semibold mb-3">Aliases</h2>
      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500"><th className="py-2">Alias</th><th>Species ID</th><th></th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.alias} className="border-t">
                <td className="py-2">{r.alias}</td>
                <td>{r.species_id}</td>
                <td><button className="btn-outline" onClick={()=>onDelete(r.alias)} disabled={loading}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
}
