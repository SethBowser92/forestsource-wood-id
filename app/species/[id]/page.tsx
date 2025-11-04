
import { ImageGrid } from './images'

async function fetchJSON(url: string) {
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) return null
  return r.json()
}

export default async function SpeciesPage({ params }:{ params:{ id:string }}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const headers = { 'apikey': anon, 'Authorization': `Bearer ${anon}` }
  const [sp, imgs] = await Promise.all([
    fetch(`${url}/rest/v1/species?id=eq.${params.id}&select=id,common_name,scientific_name,verified`, { headers }).then(r=>r.json()).then(a=>a?.[0]||null),
    fetch(`${url}/rest/v1/species_images?species_id=eq.${params.id}&is_public=is.true&moderation_status=eq.approved&select=id,image_type,cdn_url,alt_text,caption,credit,width,height`, { headers }).then(r=>r.json())
  ])
  const thumb = imgs?.find((x:any)=>x.image_type==='thumbnail')
  const banner = imgs?.find((x:any)=>x.image_type==='banner')
  const grain = imgs?.filter((x:any)=>x.image_type==='wood_grain')
  const endgrain = imgs?.filter((x:any)=>x.image_type==='endgrain')
  const tree = imgs?.filter((x:any)=>x.image_type==='tree')
  const leaves = imgs?.filter((x:any)=>x.image_type==='leaves')
  const product = imgs?.filter((x:any)=>x.image_type==='product')

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold mb-2">{sp?.common_name ?? params.id}</h2>
        {sp?.scientific_name && <p className="italic text-gray-700 mb-2">{sp.scientific_name}</p>}
        <p className="text-sm">{sp?.verified ? 'Verified' : 'Unverified'}</p>
      </div>

      {banner && <div className="rounded-xl overflow-hidden"><img src={banner.cdn_url} className="w-full max-h-96 object-cover" /></div>}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <h3 className="font-semibold">Wood grain</h3>
          <ImageGrid items={grain} />
          <h3 className="font-semibold">Endgrain</h3>
          <ImageGrid items={endgrain} />
          <h3 className="font-semibold">Products</h3>
          <ImageGrid items={product} />
        </div>
        <div className="space-y-6">
          {thumb && <div className="border rounded-xl overflow-hidden"><img src={thumb.cdn_url} className="w-full object-cover" /></div>}
          <div>
            <h4 className="font-semibold mb-2">Tree</h4>
            <ImageGrid items={tree} />
          </div>
          <div>
            <h4 className="font-semibold mb-2">Leaves</h4>
            <ImageGrid items={leaves} />
          </div>
        
      </div>
      <div className="card">
        <h3 className="font-semibold mb-3">Similar species</h3>
        {/* Server-side fetch to our API for now */}
        {/* @ts-expect-error Async Server Component */}
        <SimilarList id={sp?.id ?? params.id} />
      </div>
    </div>
  )
}

async function SimilarList({ id }:{ id: string }){
  const r = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/species/similar?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
  if (!r.ok) return <div className="text-sm text-gray-500">No suggestions.</div>
  const j = await r.json()
  const items = (j.similar || []) as Array<{id:string,name:string}>
  if (!items.length) return <div className="text-sm text-gray-500">No suggestions.</div>
  return <ul className="grid md:grid-cols-3 gap-2">
    {items.map(s => <li key={s.id}><a className="btn-outline block text-center" href={`/species/${s.id}`}>{s.name}</a></li>)}
  </ul>
}
