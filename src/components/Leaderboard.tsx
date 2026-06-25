import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Leaf, Coins, Zap, Crown, Medal } from 'lucide-react'
import { api } from '../services/api'
import { useApp } from '../contexts/AppContext'

const METRICS = [
  { id: 'co2', label: 'CO₂ Offset', icon: Leaf, unit: 't' },
  { id: 'credits', label: 'Credits', icon: Coins, unit: '' },
  { id: 'xp', label: 'XP', icon: Zap, unit: '' },
]

const rankColor = (r: number) =>
  r === 1 ? 'from-[#E7D7C8] to-[#C9A98C]' : r === 2 ? 'from-[#CDEBD6] to-[#A9CDBA]' : r === 3 ? 'from-[#A9CDBA] to-[#6FA690]' : ''

export default function Leaderboard() {
  const { state, dispatch } = useApp()
  const viewProfile = (id: string) => dispatch({ type: 'SET_PAGE', payload: `profile:${id}` })
  const [metric, setMetric] = useState('co2')
  const [leaders, setLeaders] = useState<any[]>([])
  const [myRank, setMyRank] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.leaderboard.top({ metric, limit: 25 }),
      state.isAuthenticated ? api.leaderboard.myRank({ metric }).catch(() => null) : Promise.resolve(null),
    ]).then(([top, mine]) => {
      setLeaders(top.leaders || [])
      setMyRank(mine)
    }).finally(() => setLoading(false))
  }, [metric, state.isAuthenticated])

  const fmt = (v: number) => metric === 'co2' ? `${v.toFixed(1)}t` : Math.round(v).toLocaleString()
  const podium = leaders.slice(0, 3)
  const rest = leaders.slice(3)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-pine mb-4">
          <Trophy className="w-4 h-4 text-sage-deep" /> Global Climate Champions
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gradient">Leaderboard</h1>
        <p className="text-muted-foreground mt-2">The people offsetting the most carbon, climbing the ranks.</p>
      </motion.div>

      {/* metric switch */}
      <div className="flex justify-center gap-2 mb-10">
        {METRICS.map((m) => (
          <button key={m.id} onClick={() => setMetric(m.id)}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all ${
              metric === m.id ? 'bg-primary text-primary-foreground shadow-md' : 'glass text-pine hover:bg-secondary'}`}>
            <m.icon className="w-4 h-4" /> {m.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-20">Loading rankings…</div>
      ) : leaders.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">No ranked users yet — be the first to make an impact!</div>
      ) : (
        <>
          {/* podium */}
          <div className="grid grid-cols-3 gap-3 md:gap-6 items-end mb-8">
            {[1, 0, 2].map((idx, col) => {
              const u = podium[idx]; if (!u) return <div key={col} />
              // indexed by rank: #1 tallest, then #2, then #3
              const heights = ['h-44', 'h-32', 'h-24']
              return (
                <motion.div key={u._id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: col * 0.12 }}
                  className="flex flex-col items-center">
                  {u.rank === 1 && <Crown className="w-7 h-7 text-[#C9A98C] mb-1" />}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sage to-pine flex items-center justify-center text-cream font-bold text-lg mb-2 glow-sage">
                    {u.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="font-semibold text-pine text-center text-sm truncate max-w-[8rem]">{u.name}</div>
                  <div className="text-xs text-muted-foreground mb-2">{fmt(u.value)}</div>
                  <div className={`w-full ${heights[idx]} rounded-t-xl bg-gradient-to-t ${rankColor(u.rank)} flex items-start justify-center pt-2`}>
                    <span className="text-2xl font-bold text-pine-deep">#{u.rank}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* rest */}
          <div className="space-y-2">
            {rest.map((u, i) => (
              <motion.div key={u._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => viewProfile(u._id)}
                className="flex items-center gap-4 rounded-xl glass px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                <span className="w-8 text-center font-bold text-muted-foreground">#{u.rank}</span>
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-pine font-semibold">
                  {u.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-pine truncate">{u.name}</div>
                  <div className="text-xs text-muted-foreground">Level {u.level} · {u.badges?.length || 0} badges</div>
                </div>
                <div className="font-semibold text-pine">{fmt(u.value)}</div>
              </motion.div>
            ))}
          </div>

          {myRank && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="sticky bottom-4 mt-8 flex items-center gap-4 rounded-xl bg-primary text-primary-foreground px-5 py-4 shadow-xl">
              <Medal className="w-6 h-6" />
              <span className="font-medium">Your rank</span>
              <span className="ml-auto text-2xl font-bold">#{myRank.rank}</span>
              <span className="opacity-80">{fmt(myRank.value)}</span>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
