'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase-browser'
export default function LoginPage(){
  const [email,setEmail] = useState(''); const [sent,setSent] = useState(false)
  const send = async () => {
    const { error } = await supabase().auth.signInWithOtp({ email, options:{ emailRedirectTo: window.location.origin } })
    if (error) alert(error.message); else setSent(true)
  }
  return <div className="max-w-md mx-auto card">
    <h1 className="text-2xl font-bold mb-4">Sign in</h1>
    {!sent ? (<>
      <input className="w-full border rounded-xl px-4 py-2 mb-2" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
      <button className="btn-primary w-full" onClick={send}>Send magic link</button>
    </>) : <div>Check your email.</div>}
  </div>
}
