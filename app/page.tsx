export default function Home(){
  return (
    <div className="card">
      <h1 className="text-3xl font-bold mb-2">GrainScout identifies wood species from a photo</h1>
      <p className="text-lg text-gray-700">Know your wood.</p>
      <p className="text-gray-600">Upload a clear grain or endgrain photo. Get instant predictions, then confirm with verified species data — by ForestSource.</p>
      <a className="btn-primary mt-4 inline-block" href="/identify">Try it</a>
    </div>
  )
}
