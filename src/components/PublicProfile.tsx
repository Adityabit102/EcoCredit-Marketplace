import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Leaf, Award, MapPin, Coins, ArrowLeft, Star } from 'lucide-react'
import { api } from '../services/api'

export default function PublicProfile({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [data, setData] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.users.publicProfile(userId).then(setData).catch(() => setData(null)).finally(() => setLoading(false))
    api.reviews.forSeller(userId).then((d) => setReviews(d.reviews || [])).catch(() => {})
  }, [userId])

  if (loading) return <div className="text-center text-muted-foreground py-20">Loading profile…</div>
  if (!data) return <div className="text-center text-muted-foreground py-20">Profile not found.</div>

  const u = data.user
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-pine mb-6"><ArrowLeft className="w-4 h-4" /> Back</button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl overflow-hidden glass glow-sage">
        <div className="h-28" style={{ background: 'linear-gradient(135deg,#3E5F55,#6FA690)' }} />
        <div className="px-8 pb-8 -mt-12">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sage to-pine flex items-center justify-center text-cream text-3xl font-bold border-4 border-card">
            {u.name?.[0]?.toUpperCase()}
          </div>
          <h1 className="text-3xl font-bold text-pine mt-3">{u.name}</h1>
          <p className="text-muted-foreground capitalize">{u.accountType} · Level {u.level} · joined {new Date(u.createdAt).toLocaleDateString()}</p>
          {u.bio && <p className="mt-3 text-muted-foreground">{u.bio}</p>}

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="rounded-xl bg-secondary/60 p-4 text-center"><div className="text-2xl font-bold text-pine">{(u.lifetimeCO2 || 0).toFixed(1)}</div><div className="text-xs text-muted-foreground">tons CO₂ offset</div></div>
            <div className="rounded-xl bg-secondary/60 p-4 text-center"><div className="text-2xl font-bold text-pine">{u.badges?.length || 0}</div><div className="text-xs text-muted-foreground">badges</div></div>
            <div className="rounded-xl bg-secondary/60 p-4 text-center"><div className="text-2xl font-bold text-pine">{data.listings?.length || 0}</div><div className="text-xs text-muted-foreground">active listings</div></div>
          </div>

          {u.badges?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {u.badges.map((b: string) => <span key={b} className="rounded-full bg-sand/60 text-pine-deep px-3 py-1 text-xs font-medium flex items-center gap-1"><Award className="w-3 h-3" /> {b}</span>)}
            </div>
          )}
        </div>
      </motion.div>

      {reviews.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-pine mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /> Reviews ({reviews.length})</h2>
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r._id} className="rounded-2xl glass p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-pine">{r.reviewer?.name || 'Buyer'}</span>
                  <span className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`w-4 h-4 ${n <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />)}
                  </span>
                </div>
                {r.comment && <p className="text-sm text-muted-foreground mt-2">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.listings?.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-pine mb-4 flex items-center gap-2"><Leaf className="w-5 h-5 text-sage-deep" /> Active Listings</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.listings.map((l: any) => (
              <div key={l._id} className="rounded-2xl glass p-5">
                <h3 className="font-semibold text-pine truncate">{l.title}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {l.location}</p>
                <div className="flex justify-between mt-3 text-pine"><span className="flex items-center gap-1"><Coins className="w-4 h-4" /> {l.credits}</span><span className="font-bold">${l.price}/cr</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
