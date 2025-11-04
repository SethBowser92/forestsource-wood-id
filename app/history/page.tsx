'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'

type Row = { id:number; created_at:string; top1:string|null; top1_conf:number|null }

export default function HistoryPage() {
  const [rows, setRows] = useState<Row[] | null>(null)
  useEffect(()=>{
    (async()=>{
      const s = supabase()
      const { data: { user } } = await s.auth.getUser()
      if (!user) return
      const { data } = await s.from('identifications')
        .select('id, created_at, top1, top1_conf')
        .order('created_at', { ascending: false })
        .limit(100)
      setRows(data as Row[] | null)
    })()
  },[])

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">History</h2>
      {!rows ? <p className="text-sm text-gray-600">Sign in to see your past identifications.</p> :
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500"><th className="py-2">When</th><th>Top result</th><th>Confidence</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="py-2">{new Date(r.created_at).toLocaleString()}</td>
                <td>{r.top1 ?? '-'}</td>
                <td>{r.top1_conf ? `${(r.top1_conf*100).toFixed(0)}%` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </div>
  )
}
