'use client'
import { useEffect, useState } from 'react'

export default function AccountPage(){
  const [status,setStatus]=useState<{plan:string,status:string,current_period_end?:string}|null>(null)
  const [loading,setLoading]=useState(false)

  useEffect(()=>{ (async()=>{
    const r = await fetch('/api/subscription/status')
    setStatus(await r.json())
  })() }, [])

  const onPortal = async () => {
    setLoading(true)
    try{
      const r = await fetch('/api/create-portal-session', { method:'POST' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error||'Failed')
      window.location.href = j.url
    } finally { setLoading(false) }
  }

  const next = status?.current_period_end ? new Date(status.current_period_end).toLocaleString() : null

  return (
    <div className="card">
      <h1 className="text-2xl font-bold mb-2">Your account</h1>
      <div className="text-sm text-gray-700 mb-4">
        <div><b>Plan:</b> {status?.plan ?? 'free'}</div>
        <div><b>Status:</b> {status?.status ?? 'free'}</div>
        {next && <div><b>Renews:</b> {next}</div>}
      </div>
      <button className="btn-primary" onClick={onPortal} disabled={loading || status?.plan!=='pro'}>
        {loading?'Opening…':'Manage billing'}
      </button>
      {status?.plan!=='pro' && <p className="text-xs text-gray-500 mt-2">Upgrade on the <a className="underline" href="/pricing">pricing</a> page.</p>}
    </div>
  )
}
