import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
export const runtime = 'nodejs'
export async function GET(){
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ plan: 'free', status: 'free' })
  const { data } = await supabase.from('subscriptions').select('plan,status,current_period_end').maybeSingle()
  if (!data) return NextResponse.json({ plan: 'free', status: 'free' })
  return NextResponse.json(data)
}
