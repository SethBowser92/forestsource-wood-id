export const metadata = { title: 'GrainScout — Wood ID by ForestSource', description: 'GrainScout identifies wood species from a photo. Know your wood.', openGraph: { title: 'GrainScout — Wood ID', description: 'Identify wood species from a photo', images: ['/logo.svg'] } }
export default function RootLayout({ children }:{children:React.ReactNode}){
  return (
    <html lang="en"><body>
      <nav className="p-4 border-b mb-6 flex items-center gap-4"><a href="/" className="flex items-center gap-2"><img src="/logo.svg" alt="GrainScout" width="100" height="24"/><span className="sr-only">GrainScout</span></a><a href="/identify">Identify</a>·<a href="/pricing">Pricing</a>·<a href="/history">History</a>·<a href="/admin/species">Admin</a></nav>
      <main className="container mx-auto px-4">{children}</main>
      <style>{`.container{max-width:1000px}.btn-primary{padding:.5rem 1rem;border-radius:.75rem;background:black;color:white}.btn-outline{padding:.5rem 1rem;border-radius:.75rem;border:1px solid #ddd}`}.card{border:1px solid #eee;border-radius:1rem;padding:1.25rem;margin-bottom:1rem}
nav a{margin-right:.5rem}
</style>
    </body></html>
  )
}
