'use client'
import { useState } from 'react'
import UploadBox from '@/components/UploadBox'
import ResultCard from '@/components/ResultCard'
import PaywallBanner from '@/components/PaywallBanner'
import Link from 'next/link'

type Pred = { label: string; score: number }

type FeedbackPayload = { identification_id: number | null, sha256: string | null, was_correct: boolean, correct_species_id?: string }

export default function IdentifyPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [preds, setPreds] = useState<Pred[] | null>(null)
  const [identId, setIdentId] = useState<number | null>(null)
  const [sha, setSha] = useState<string | null>(null)
  const [correctId, setCorrectId] = useState('')
  const [fbStatus, setFbStatus] = useState<string | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [quotaBlocked, setQuotaBlocked] = useState(false)

  useEffect(()=>{ (async()=>{ try{ const r=await fetch('/api/subscription/status'); const j=await r.json(); setIsPro(j?.status==='active' && j?.plan==='pro') }catch{} })() },[])

  const onFile = (f: File) => { setFile(f); setPreview(URL.createObjectURL(f)); setPreds(null); setQuotaBlocked(false) }

  const onIdentify = async () => {
    if (!file) return
    setLoading(true)
    try {
      const form = new FormData()
      form.append('image', file)
      const res = await fetch('/api/identify', { method: 'POST', body: form })
      const data = await res.json()
      if (res.status === 402 || data.error === 'quota_exceeded') {
        setQuotaBlocked(true); setRemaining(0); return
      }
      if (!res.ok) throw new Error(data.error || 'Failed')
      setPreds(data.predictions); setIdentId(data.identification_id ?? null); setSha(data.sha256 ?? null)
      if (typeof data.remaining === 'number') setRemaining(data.remaining)
    } catch (e:any) { alert(e.message) } finally { setLoading(false) }
  }

  const sendFeedback = async (payload: FeedbackPayload)=>{ try{ const r=await fetch('/api/feedback',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }); const j=await r.json(); if(!r.ok) throw new Error(j.error||'Failed'); setFbStatus('Thanks!'); }catch(e:any){ setFbStatus(e.message) } }

  return (<div className="grid md:grid-cols-2 gap-8">
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Upload</h2>
      {!preview ? <UploadBox onFile={onFile}/> : (<div>
        <img src={preview!} alt="preview" className="rounded-xl mb-4" />
        <div className="flex gap-2">
          <button onClick={onIdentify} className="btn-primary" disabled={loading}>{loading?'Analyzing…':'Identify wood'}</button>
          <button className="btn-outline" onClick={()=>{ setFile(null); setPreview(null); setPreds(null) }}>Clear</button>
        
      {preds && <div className="mt-6 space-y-3">
        <div className="text-sm text-gray-700">Was this correct?</div>
        <div className="flex gap-2 items-center">
          <button className="btn-outline" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: true })}>Yes</button>
          <span className="text-sm text-gray-500">or</span>
          <input className="border rounded-xl px-3 py-2" placeholder="correct species_id (optional)" value={correctId} onChange={e=>setCorrectId(e.target.value)} />
          <button className="btn-primary" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: false, correct_species_id: correctId || undefined })}>Send correction</button>
          {fbStatus && <span className="text-sm text-gray-600 ml-2">{fbStatus}</span>}
        </div>
      </div>}
    </div>
      
      {preds && <div className="mt-6 space-y-3">
        <div className="text-sm text-gray-700">Was this correct?</div>
        <div className="flex gap-2 items-center">
          <button className="btn-outline" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: true })}>Yes</button>
          <span className="text-sm text-gray-500">or</span>
          <input className="border rounded-xl px-3 py-2" placeholder="correct species_id (optional)" value={correctId} onChange={e=>setCorrectId(e.target.value)} />
          <button className="btn-primary" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: false, correct_species_id: correctId || undefined })}>Send correction</button>
          {fbStatus && <span className="text-sm text-gray-600 ml-2">{fbStatus}</span>}
        </div>
      </div>}
    </div>)}
      {remaining!==null && remaining>=0 && <div className="mt-4"><PaywallBanner remaining={remaining}/>
      {preds && <div className="mt-6 space-y-3">
        <div className="text-sm text-gray-700">Was this correct?</div>
        <div className="flex gap-2 items-center">
          <button className="btn-outline" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: true })}>Yes</button>
          <span className="text-sm text-gray-500">or</span>
          <input className="border rounded-xl px-3 py-2" placeholder="correct species_id (optional)" value={correctId} onChange={e=>setCorrectId(e.target.value)} />
          <button className="btn-primary" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: false, correct_species_id: correctId || undefined })}>Send correction</button>
          {fbStatus && <span className="text-sm text-gray-600 ml-2">{fbStatus}</span>}
        </div>
      </div>}
    </div>}
      {quotaBlocked && (
        <div className="mt-4 p-4 rounded-xl border border-red-300 bg-red-50">
          <div className="text-sm text-red-800">Free limit reached. Upgrade to Pro for unlimited* identifications.
      {preds && <div className="mt-6 space-y-3">
        <div className="text-sm text-gray-700">Was this correct?</div>
        <div className="flex gap-2 items-center">
          <button className="btn-outline" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: true })}>Yes</button>
          <span className="text-sm text-gray-500">or</span>
          <input className="border rounded-xl px-3 py-2" placeholder="correct species_id (optional)" value={correctId} onChange={e=>setCorrectId(e.target.value)} />
          <button className="btn-primary" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: false, correct_species_id: correctId || undefined })}>Send correction</button>
          {fbStatus && <span className="text-sm text-gray-600 ml-2">{fbStatus}</span>}
        </div>
      </div>}
    </div>
          <Link href="/pricing" className="btn-primary mt-3 inline-block">Upgrade to Pro</Link>
          <div className="text-[11px] text-gray-500 mt-2">* Fair use policy applies.
      {preds && <div className="mt-6 space-y-3">
        <div className="text-sm text-gray-700">Was this correct?</div>
        <div className="flex gap-2 items-center">
          <button className="btn-outline" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: true })}>Yes</button>
          <span className="text-sm text-gray-500">or</span>
          <input className="border rounded-xl px-3 py-2" placeholder="correct species_id (optional)" value={correctId} onChange={e=>setCorrectId(e.target.value)} />
          <button className="btn-primary" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: false, correct_species_id: correctId || undefined })}>Send correction</button>
          {fbStatus && <span className="text-sm text-gray-600 ml-2">{fbStatus}</span>}
        </div>
      </div>}
    </div>
        
      {preds && <div className="mt-6 space-y-3">
        <div className="text-sm text-gray-700">Was this correct?</div>
        <div className="flex gap-2 items-center">
          <button className="btn-outline" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: true })}>Yes</button>
          <span className="text-sm text-gray-500">or</span>
          <input className="border rounded-xl px-3 py-2" placeholder="correct species_id (optional)" value={correctId} onChange={e=>setCorrectId(e.target.value)} />
          <button className="btn-primary" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: false, correct_species_id: correctId || undefined })}>Send correction</button>
          {fbStatus && <span className="text-sm text-gray-600 ml-2">{fbStatus}</span>}
        </div>
      </div>}
    </div>
      )}
    
      {preds && <div className="mt-6 space-y-3">
        <div className="text-sm text-gray-700">Was this correct?</div>
        <div className="flex gap-2 items-center">
          <button className="btn-outline" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: true })}>Yes</button>
          <span className="text-sm text-gray-500">or</span>
          <input className="border rounded-xl px-3 py-2" placeholder="correct species_id (optional)" value={correctId} onChange={e=>setCorrectId(e.target.value)} />
          <button className="btn-primary" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: false, correct_species_id: correctId || undefined })}>Send correction</button>
          {fbStatus && <span className="text-sm text-gray-600 ml-2">{fbStatus}</span>}
        </div>
      </div>}
    </div>
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Results</h2>
      {!preds && !quotaBlocked && <div className="text-gray-500 text-sm">Upload a photo and click Identify.
      {preds && <div className="mt-6 space-y-3">
        <div className="text-sm text-gray-700">Was this correct?</div>
        <div className="flex gap-2 items-center">
          <button className="btn-outline" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: true })}>Yes</button>
          <span className="text-sm text-gray-500">or</span>
          <input className="border rounded-xl px-3 py-2" placeholder="correct species_id (optional)" value={correctId} onChange={e=>setCorrectId(e.target.value)} />
          <button className="btn-primary" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: false, correct_species_id: correctId || undefined })}>Send correction</button>
          {fbStatus && <span className="text-sm text-gray-600 ml-2">{fbStatus}</span>}
        </div>
      </div>}
    </div>}
      {preds && <div className="space-y-3">{preds.slice(0, isPro?5:3).map((p,i)=>(<ResultCard key={i} label={p.label} score={p.score}/>))}
      {preds && <div className="mt-6 space-y-3">
        <div className="text-sm text-gray-700">Was this correct?</div>
        <div className="flex gap-2 items-center">
          <button className="btn-outline" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: true })}>Yes</button>
          <span className="text-sm text-gray-500">or</span>
          <input className="border rounded-xl px-3 py-2" placeholder="correct species_id (optional)" value={correctId} onChange={e=>setCorrectId(e.target.value)} />
          <button className="btn-primary" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: false, correct_species_id: correctId || undefined })}>Send correction</button>
          {fbStatus && <span className="text-sm text-gray-600 ml-2">{fbStatus}</span>}
        </div>
      </div>}
    </div>}
    
      {preds && <div className="mt-6 space-y-3">
        <div className="text-sm text-gray-700">Was this correct?</div>
        <div className="flex gap-2 items-center">
          <button className="btn-outline" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: true })}>Yes</button>
          <span className="text-sm text-gray-500">or</span>
          <input className="border rounded-xl px-3 py-2" placeholder="correct species_id (optional)" value={correctId} onChange={e=>setCorrectId(e.target.value)} />
          <button className="btn-primary" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: false, correct_species_id: correctId || undefined })}>Send correction</button>
          {fbStatus && <span className="text-sm text-gray-600 ml-2">{fbStatus}</span>}
        </div>
      </div>}
    </div>
  
      {preds && <div className="mt-6 space-y-3">
        <div className="text-sm text-gray-700">Was this correct?</div>
        <div className="flex gap-2 items-center">
          <button className="btn-outline" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: true })}>Yes</button>
          <span className="text-sm text-gray-500">or</span>
          <input className="border rounded-xl px-3 py-2" placeholder="correct species_id (optional)" value={correctId} onChange={e=>setCorrectId(e.target.value)} />
          <button className="btn-primary" onClick={()=>sendFeedback({ identification_id: identId, sha256: sha, was_correct: false, correct_species_id: correctId || undefined })}>Send correction</button>
          {fbStatus && <span className="text-sm text-gray-600 ml-2">{fbStatus}</span>}
        </div>
      </div>}
    </div>)
}
