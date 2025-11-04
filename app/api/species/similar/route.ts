import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function tokenize(s: string): string[] {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter(Boolean)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const headers = { 'apikey': anon, 'Authorization': `Bearer ${anon}` }

  // fetch aliases for all species (small table; if huge, replace with RPC)
  // optional: confusion pairs CSV
  let csvPairs: Array<{a:string,b:string,score:number}> = []
  try {
    const csv = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/confusion_pairs.csv`, { cache: 'no-store' })
    if (csv.ok) {
      const txt = await csv.text()
      for (const line of txt.split(/\r?\n/)){
        const [a,b,s] = line.split(','); if (a && b) csvPairs.push({ a: a.trim(), b: b.trim(), score: Number(s||1) })
      }
    }
  } catch {}

  const [aliasesRes, speciesRes] = await Promise.all([
    fetch(`${url}/rest/v1/species_aliases?select=alias,species_id`, { headers }),
    fetch(`${url}/rest/v1/species?select=id,common_name,verified`, { headers })
  ])
  if (!aliasesRes.ok || !speciesRes.ok) return NextResponse.json({ error: 'supabase fetch failed' }, { status: 502 })
  const aliases = await aliasesRes.json() as Array<{ alias: string, species_id: string }>
  const species = await speciesRes.json() as Array<{ id: string, common_name: string, verified: boolean }>

  const tokensBySpecies = new Map<string, Set<string>>()
  for (const row of aliases) {
    const toks = tokenize(row.alias)
    if (!tokensBySpecies.has(row.species_id)) tokensBySpecies.set(row.species_id, new Set())
    toks.forEach(t => tokensBySpecies.get(row.species_id)!.add(t))
  }
  const targetTokens = tokensBySpecies.get(id) || new Set<string>()

  // score others by token overlap
  const scores: Array<{ id: string, name: string, score: number }> = []
  for (const sp of species) {
    if (!sp.verified) continue
    if (sp.id === id) continue
    const toks = tokensBySpecies.get(sp.id) || new Set<string>()
    let overlap = 0
    toks.forEach(t => { if (targetTokens.has(t)) overlap++ })
    if (overlap > 0) scores.push({ id: sp.id, name: sp.common_name || sp.id, score: overlap })
  }
  // If we have confusion CSV, boost by that mapping from current id
  if (csvPairs.length) {
    const direct = csvPairs.filter(p => p.a === id).sort((x,y)=> y.score - x.score).slice(0,6)
    if (direct.length) return NextResponse.json({ similar: direct.map(d=> ({ id: d.b, name: (species.find(s=>s.id===d.b)?.common_name || d.b), score: d.score })) })
  }
  scores.sort((a,b) => b.score - a.score)
  return NextResponse.json({ similar: scores.slice(0, 6) })
}
