export default function ResultCard({label, score}:{label:string; score:number}){
  const pct = Math.round(score*100)
  return (
    <div className="p-3 rounded-xl border bg-gray-50 flex items-center justify-between">
      <div>
        <div className="font-semibold">{label}</div>
        <div className="text-xs text-gray-600">{pct}% confidence</div>
      </div>
      <div className="w-28 h-2 rounded-full bg-gray-200">
        <div className="h-2 rounded-full bg-black" style={{width:`${pct}%`}}/>
      </div>
    </div>
  )
}
