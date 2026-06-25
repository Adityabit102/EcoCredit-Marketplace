import { lazy, Suspense, useMemo } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Leaf } from 'lucide-react'

const GlobeScene = lazy(() => import('./three/Scene3D').then((m) => ({ default: m.GlobeScene })))

// Aggregates listing locations into a "where the impact happens" legend beside a 3D globe.
export default function ImpactMap({ listings }: { listings: any[] }) {
  const places = useMemo(() => {
    const map = new Map<string, { credits: number; co2: number; count: number }>()
    for (const l of listings) {
      const key = l.location || 'Unknown'
      const cur = map.get(key) || { credits: 0, co2: 0, count: 0 }
      cur.credits += l.credits || 0; cur.co2 += l.co2Offset || 0; cur.count += 1
      map.set(key, cur)
    }
    return [...map.entries()].sort((a, b) => b[1].co2 - a[1].co2).slice(0, 8)
  }, [listings])

  if (!places.length) return null

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl glass glow-sage overflow-hidden grid md:grid-cols-2 mb-8">
      <div className="relative min-h-[260px]">
        <Suspense fallback={null}><GlobeScene className="absolute inset-0 h-full w-full" /></Suspense>
        <div className="absolute top-4 left-5 text-pine font-semibold flex items-center gap-2"><Leaf className="w-5 h-5 text-sage-deep" /> Impact across the map</div>
      </div>
      <div className="p-6">
        <p className="text-sm text-muted-foreground mb-4">Verified projects you can support right now:</p>
        <div className="space-y-2">
          {places.map(([place, v]) => (
            <div key={place} className="flex items-center gap-3 rounded-xl bg-secondary/40 px-3 py-2">
              <MapPin className="w-4 h-4 text-sage-deep shrink-0" />
              <span className="flex-1 min-w-0 truncate text-pine font-medium">{place}</span>
              <span className="text-xs text-muted-foreground">{v.count} proj · {v.co2.toFixed(0)}t · {v.credits} cr</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
