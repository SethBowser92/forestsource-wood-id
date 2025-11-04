
'use client'
async function reportImage(id:number){
  try{
    const r = await fetch('/api/images/report', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, reason: 'user_report' }) })
    const j = await r.json(); if(!r.ok) throw new Error(j.error||'Failed')
    alert('Thanks for the report. We will review this image.')
  }catch(e:any){ alert(e.message) }
}

export function ImageGrid({ items }:{ items: any[] }){
  if (!items?.length) return null
  return <div className="grid md:grid-cols-3 gap-4">
    {items.map((it:any)=> (
      <figure key={it.id} className="border rounded-xl overflow-hidden bg-gray-50">
        <img src={it.cdn_url || ''} alt={it.alt_text || it.caption || ''} className="w-full h-48 object-cover" />
        {(it.caption || it.credit) && <figcaption className="p-2 text-xs text-gray-600">
          {it.caption} {it.credit && <span className="opacity-70">— {it.credit}</span>}
        </figcaption>}
      <div className="p-2"><button className="btn-outline text-xs" onClick={()=>reportImage(it.id)}>Report</button></div></figure>
    ))}
  </div>
}
