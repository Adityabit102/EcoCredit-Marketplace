import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, MapPin, Coins, Trash2, Leaf } from 'lucide-react'
import { api } from '../services/api'
import { useApp } from '../contexts/AppContext'
import GradientButton from './ui/GradientButton'

export default function Favorites() {
  const { dispatch } = useApp()
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => api.favorites.list().then((d) => setFavorites(d.favorites || [])).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const remove = async (listingId: string) => {
    await api.favorites.remove(listingId)
    setFavorites((f) => f.filter((x) => (x.listing?._id || x.listing) !== listingId))
    dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'info', message: 'Removed from watchlist' } })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-pine mb-3">
          <Heart className="w-4 h-4 text-sage-deep" /> Your Watchlist
        </div>
        <h1 className="text-4xl font-bold text-gradient">Saved Listings</h1>
        <p className="text-muted-foreground mt-2">Credits you're keeping an eye on, with price-drop alerts.</p>
      </motion.div>

      {loading ? (
        <div className="text-center text-muted-foreground py-20">Loading…</div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl">
          <Heart className="w-12 h-12 mx-auto mb-4 text-sage" />
          <p className="text-pine font-medium">No favorites yet</p>
          <p className="text-sm text-muted-foreground mb-4">Tap the heart on any marketplace listing to save it here.</p>
          <GradientButton onClick={() => dispatch({ type: 'SET_PAGE', payload: 'marketplace' })}>Browse Marketplace</GradientButton>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((f, i) => {
            const l = f.listing || {}
            return (
              <motion.div key={f._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ y: -6 }} className="rounded-2xl glass glow-sage overflow-hidden">
                <div className="h-28 bg-gradient-to-br from-sage to-pine flex items-center justify-center">
                  <Leaf className="w-10 h-10 text-cream/80" />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-pine truncate">{l.title || 'Listing'}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {l.location || '—'}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="flex items-center gap-1 text-pine font-semibold"><Coins className="w-4 h-4" /> {l.credits ?? 0}</span>
                    <span className="text-pine font-bold">${l.price ?? 0}/cr</span>
                  </div>
                  {f.priceAlertBelow && (
                    <p className="text-xs text-sage-deep mt-2">🔔 Alert below ${f.priceAlertBelow}</p>
                  )}
                  <button onClick={() => remove(l._id)} className="mt-4 flex items-center gap-1 text-xs text-destructive hover:underline">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
