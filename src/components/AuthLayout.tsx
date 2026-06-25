import { lazy, Suspense, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Leaf, ShieldCheck, Coins, Trophy } from 'lucide-react'

const GlobeScene = lazy(() => import('./three/Scene3D').then((m) => ({ default: m.GlobeScene })))

const FEATURES = [
  { Icon: ShieldCheck, text: 'AI-verified, blockchain-backed credits' },
  { Icon: Coins, text: 'Trade in a transparent marketplace' },
  { Icon: Trophy, text: 'Climb the climate leaderboard' },
]

export default function AuthLayout({ title, subtitle, children, onBack }: {
  title: string; subtitle: string; children: ReactNode; onBack?: () => void
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* ── brand panel ── */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden text-cream"
        style={{ background: 'linear-gradient(150deg,#2C453E,#3E5F55 55%,#4F7A6B)' }}>
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl opacity-30 animate-float"
          style={{ background: 'radial-gradient(circle,#A9CDBA,transparent 70%)' }} />
        <div className="absolute inset-0 ring-grid opacity-10" />

        <div className="relative flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cream/15"><Leaf className="h-6 w-6 text-cream" /></div>
          <span className="text-2xl font-bold">EcoCredit India</span>
        </div>

        <div className="relative">
          <motion.h2 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold leading-tight mb-6">Turn climate action<br />into real value.</motion.h2>
          <ul className="space-y-4">
            {FEATURES.map(({ Icon, text }, i) => (
              <motion.li key={text} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
                className="flex items-center gap-3 text-cream/90">
                <span className="rounded-full bg-cream/15 p-2"><Icon className="h-5 w-5" /></span> {text}
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="relative h-44 -mb-6">
          <Suspense fallback={null}><GlobeScene className="h-full w-full" /></Suspense>
        </div>
      </div>

      {/* ── form panel ── */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg,#3E5F55,#6FA690)' }}><Leaf className="h-5 w-5 text-cream" /></div>
            <span className="text-xl font-bold text-gradient">EcoCredit India</span>
          </div>
          <h1 className="text-3xl font-bold text-pine mb-1">{title}</h1>
          <p className="text-muted-foreground mb-8">{subtitle}</p>
          {children}
          {onBack && (
            <button onClick={onBack} className="mt-6 text-sm text-muted-foreground hover:text-pine transition-colors">← Back to home</button>
          )}
        </motion.div>
      </div>
    </div>
  )
}
