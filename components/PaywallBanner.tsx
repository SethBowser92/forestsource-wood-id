import Link from 'next/link'
export default function PaywallBanner({ remaining }: { remaining: number }) {
  const urgent = remaining <= 3
  return (
    <div className={`p-4 rounded-xl border flex items-center justify-between ${urgent ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50'}`}>
      <div className="text-sm text-gray-800">
        Free plan: <b>{remaining}</b> identifications left this month.
        {urgent && <span className="ml-2">Upgrade now to avoid interruptions.</span>}
      </div>
      <Link className="btn-primary" href="/pricing">Upgrade</Link>
    </div>
  )
}
