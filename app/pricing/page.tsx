'use client'
import { useEffect, useState } from 'react'

export default function PricingPage(){
  const [loading,setLoading]=useState(false)
  const [plan,setPlan]=useState<'monthly'|'annual'>(process.env.NEXT_PUBLIC_PRICING_VARIANT==='B' ? 'annual' : 'monthly')
  const [status,setStatus]=useState<{plan:string,status:string}|null>(null)

  useEffect(()=>{
    (async()=>{
      const r = await fetch('/api/subscription/status')
      const d = await r.json()
      setStatus(d)
    })()
  },[])

  const onCheckout=async()=>{
    setLoading(true)
    try{
      const r=await fetch(`/api/create-checkout-session?plan=${plan}`,{method:'POST'})
      const {url,error}=await r.json()
      if(error) throw new Error(error)
      window.location.href=url
    } finally { setLoading(false) }
  }

  const isPro = status?.status === 'active' && status?.plan === 'pro'

  return (
    <div className="space-y-8">
      <div className="card">
        <h1 className="text-3xl font-bold mb-2">Simple pricing</h1>
        <p className="text-gray-600">Start free. Upgrade anytime. Discount codes accepted at checkout.</p>
        <div className="mt-4 inline-flex rounded-xl border overflow-hidden">
          <button className={`px-4 py-2 ${plan==='monthly'?'bg-black text-white':''}`} onClick={()=>setPlan('monthly')}>Monthly</button>
          <button className={`px-4 py-2 ${plan==='annual'?'bg-black text-white':''}`} onClick={()=>setPlan('annual')}>Annual <span className="opacity-70 ml-1">(save ~20%)</span></button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-2xl font-bold mb-2">Free</h2>
          <p className="text-gray-600 mb-4">10 identifications / month</p>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Top-3 predictions</li>
            <li>Basic history</li>
            <li>Community support</li>
          </ul>
        </div>

        <div className="card border-black">
          <h2 className="text-2xl font-bold mb-2">Pro</h2>
          <p className="text-gray-600 mb-4">{plan==='annual' ? '$39/year (save ~20%)' : '$4.99/month'}</p>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 mb-6">
            <li>Unlimited* identifications</li>
            <li>Full history & exports</li>
            <li>Priority support</li>
            <li>Batch uploads (coming soon)</li>
          </ul>
          {isPro ? (
            <button className="btn-outline" disabled>You're Pro</button>
          ) : (
            <button onClick={onCheckout} className="btn-primary" disabled={loading}>{loading?'Redirecting…':'Upgrade'}</button>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500">* Fair use policy applies.</p>
    </div>
  )
}
