import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Gift, Copy, Check, Award, Download, Users, Sparkles, ShieldCheck, Flame } from 'lucide-react'
import { api } from '../services/api'
import { useApp } from '../contexts/AppContext'
import GradientButton from './ui/GradientButton'

export default function Rewards() {
  const { dispatch } = useApp()
  const [me, setMe] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [catalog, setCatalog] = useState<any[]>([])
  const [copied, setCopied] = useState(false)
  const [retireAmt, setRetireAmt] = useState(10)
  const [retiring, setRetiring] = useState(false)

  useEffect(() => {
    api.auth.me().then(setMe).catch(() => {})
    api.users.dashboard().then((d) => setStats(d.stats)).catch(() => {})
    api.leaderboard.badges().then((d) => setCatalog(d.badges || [])).catch(() => {})
  }, [])

  const balance = stats?.creditBalance ?? 0
  const retire = async () => {
    if (retireAmt < 1 || retireAmt > balance) { dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'error', message: `You can retire up to ${balance} credits` } }); return }
    setRetiring(true)
    try {
      const { proofId } = await api.transactions.retire(retireAmt)
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'success', message: `Retired ${retireAmt} credits 🌍` } })
      dispatch({ type: 'SET_PAGE', payload: `proof:${proofId}` })
    } catch (err: any) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'error', message: err.message || 'Could not retire credits' } })
    } finally {
      setRetiring(false)
    }
  }

  const code = me?.referralCode || '— — —'
  const link = `${window.location.origin}/?ref=${me?.referralCode || ''}`
  const earned: string[] = stats?.badges || []

  const copy = () => {
    navigator.clipboard.writeText(link)
    setCopied(true); setTimeout(() => setCopied(false), 1800)
    dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'success', message: 'Referral link copied!' } })
  }
  const downloadCert = () => window.open(api.certificates.downloadUrl(), '_blank')

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-pine mb-3">
          <Sparkles className="w-4 h-4 text-sage-deep" /> Rewards & Recognition
        </div>
        <h1 className="text-4xl font-bold text-gradient">Your Rewards</h1>
      </motion.div>

      {/* referral */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl glass glow-sage p-8 grid md:grid-cols-2 gap-6 items-center">
        <div>
          <div className="flex items-center gap-2 text-pine font-semibold mb-2"><Gift className="w-5 h-5 text-sage-deep" /> Invite friends, earn credits</div>
          <p className="text-sm text-muted-foreground mb-4">You and a friend both win — earn <b>50 bonus credits</b> for every person who joins with your code.</p>
          <div className="flex items-center gap-2">
            <div className="font-mono text-2xl font-bold tracking-widest text-pine bg-secondary rounded-lg px-4 py-2">{code}</div>
            <button onClick={copy} className="rounded-lg bg-primary text-primary-foreground p-3 hover:opacity-90">
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="text-center">
          <div className="text-5xl font-bold text-pine">{me?.referralCount ?? 0}</div>
          <div className="text-muted-foreground flex items-center justify-center gap-1 mt-1"><Users className="w-4 h-4" /> friends referred</div>
        </div>
      </motion.div>

      {/* badges */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass p-8">
        <div className="flex items-center gap-2 text-pine font-semibold mb-5"><Award className="w-5 h-5 text-sage-deep" /> Badge Collection</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {catalog.map((b) => {
            const has = earned.includes(b.label)
            return (
              <div key={b.id} className={`rounded-xl p-4 text-center transition-all ${has ? 'bg-gradient-to-br from-sage to-pine text-cream glow-sage' : 'bg-secondary/50 text-muted-foreground'}`}>
                <div className="text-3xl mb-2">{has ? '🏅' : '🔒'}</div>
                <div className="text-xs font-medium">{b.label}</div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* retire credits -> verifiable proof */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass p-8">
        <div className="flex items-center gap-2 text-pine font-semibold mb-2"><Flame className="w-5 h-5 text-sage-deep" /> Retire credits to offset</div>
        <p className="text-sm text-muted-foreground mb-4">Permanently retire credits to claim the offset — you'll get a public, shareable proof. Balance: <b className="text-pine">{balance}</b> credits.</p>
        <div className="flex flex-wrap items-center gap-3">
          <input type="number" min={1} max={balance} value={retireAmt} onChange={(e) => setRetireAmt(Number(e.target.value))}
            className="w-28 rounded-lg bg-input-background border border-border px-3 py-2 text-pine" />
          <span className="text-sm text-muted-foreground">≈ {(retireAmt * 0.1).toFixed(1)} t CO₂</span>
          <GradientButton onClick={retire}>
            <ShieldCheck className="w-4 h-4" /> {retiring ? 'Retiring…' : 'Retire & get proof'}
          </GradientButton>
        </div>
      </motion.div>

      {/* certificate */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl glass p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-pine font-semibold"><Download className="w-5 h-5 text-sage-deep" /> Carbon Offset Certificate</div>
          <p className="text-sm text-muted-foreground mt-1">A shareable PDF certifying your {(stats?.totalCO2 ?? 0).toFixed(1)} tons of verified CO₂ offset.</p>
        </div>
        <GradientButton onClick={downloadCert}><Download className="w-4 h-4" /> Download PDF</GradientButton>
      </motion.div>
    </div>
  )
}
