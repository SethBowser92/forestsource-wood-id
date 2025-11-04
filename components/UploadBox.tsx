'use client'
export default function UploadBox({ onFile }:{ onFile:(f:File)=>void }){
  return (
    <label className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer">
      <span className="text-sm mb-2">Click to upload or drag and drop</span>
      <input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0]; if(f) onFile(f)}} className="hidden" />
    </label>
  )
}
