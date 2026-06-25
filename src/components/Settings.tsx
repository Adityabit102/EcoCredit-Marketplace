import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Settings as Cog, Bell, User, Crown, Check } from 'lucide-react'
import { api } from '../services/api'
import { useApp } from '../contexts/AppContext'
import { Input } from './ui/input'
import { Label } from './ui/label'
import GradientButton from './ui/GradientButton'

const PLANS = [
  { id: 'free', name: 'Free', price: '$0', perks: ['5 actions/mo', '3 listings/mo', 'Marketplace access'] },
  { id: 'pro', name: 'Pro', price: '$19/mo', perks: ['50 actions/mo', 'Priority AI', 'Analytics', 'Certificates'] },
  { id: 'enterprise', name: 'Enterprise', price: '$99/mo', perks: ['Unlimited', 'API access', 'Bulk certificates', 'Support'] },
]

export default function Settings() {
  const { dispatch } = useApp()
  const [me, setMe] = useState<any>(null)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [prefs, setPrefs] = useState({ email: true, sales: true, priceAlerts: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.auth.me().then((u) => {
      setMe(u); setName(u.name || ''); setBio(u.bio || '')
      setPrefs({ email: u.notificationPrefs?.email ?? true, sales: u.notificationPrefs?.sales ?? true, priceAlerts: u.notificationPrefs?.priceAlerts ?? true })
    }).catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.users.updateProfile({ name, bio, notificationPrefs: prefs })
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'success', message: 'Profile updated ✓' } })
    } catch (err: any) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'error', message: err.message || 'Could not save' } })
    } finally { setSaving(false) }
  }

  const upgrade = async (plan: string) => {
    try {
      const { url } = await api.payments.checkout(plan)
      if (url) window.location.href = url
    } catch (err: any) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'info', message: err.message?.includes('configured') ? 'Plan upgrades require Stripe to be configured.' : (err.message || 'Could not start checkout') } })
    }
  }

  const Toggle = ({ label, k }: { label: string; k: keyof typeof prefs }) => (
    <button onClick={() => setPrefs((p) => ({ ...p, [k]: !p[k] }))}
      className="flex items-center justify-between w-full rounded-xl bg-secondary/40 px-4 py-3">
      <span className="text-pine">{label}</span>
      <span className={`h-6 w-11 rounded-full p-0.5 transition-colors ${prefs[k] ? 'bg-primary' : 'bg-muted'}`}>
        <span className={`block h-5 w-5 rounded-full bg-card transition-transform ${prefs[k] ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-pine mb-3"><Cog className="w-4 h-4 text-sage-deep" /> Account</div>
        <h1 className="text-4xl font-bold text-gradient">Settings</h1>
      </motion.div>

      {/* profile */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass p-6 space-y-4">
        <h2 className="font-semibold text-pine flex items-center gap-2"><User className="w-5 h-5 text-sage-deep" /> Profile</h2>
        <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" /></div>
        <div className="space-y-2"><Label>Bio</Label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={500}
            className="w-full rounded-lg bg-input-background border border-border px-3 py-2 text-sm resize-none" placeholder="Tell the community about your climate journey…" />
        </div>
        <div className="text-xs text-muted-foreground">Email: {me?.email} · Referral code: <span className="font-mono text-pine">{me?.referralCode}</span></div>
      </motion.div>

      {/* notifications */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass p-6 space-y-3">
        <h2 className="font-semibold text-pine flex items-center gap-2"><Bell className="w-5 h-5 text-sage-deep" /> Notifications</h2>
        <Toggle label="Email notifications" k="email" />
        <Toggle label="Sale alerts" k="sales" />
        <Toggle label="Price-drop alerts" k="priceAlerts" />
        <GradientButton onClick={save} className="mt-2">{saving ? 'Saving…' : 'Save changes'}</GradientButton>
      </motion.div>

      {/* plan */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass p-6">
        <h2 className="font-semibold text-pine flex items-center gap-2 mb-4"><Crown className="w-5 h-5 text-sage-deep" /> Plan <span className="text-xs text-muted-foreground">(current: {me?.plan || 'free'})</span></h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {PLANS.map((p) => {
            const current = (me?.plan || 'free') === p.id
            return (
              <div key={p.id} className={`rounded-2xl p-5 border ${current ? 'border-primary bg-secondary/40' : 'border-border'}`}>
                <div className="font-bold text-pine">{p.name}</div>
                <div className="text-2xl font-bold text-gradient my-1">{p.price}</div>
                <ul className="text-xs text-muted-foreground space-y-1 my-3">
                  {p.perks.map((x) => <li key={x} className="flex items-center gap-1"><Check className="w-3 h-3 text-sage-deep" /> {x}</li>)}
                </ul>
                {current ? <span className="text-xs font-medium text-sage-deep">Current plan</span>
                  : p.id !== 'free' ? <button onClick={() => upgrade(p.id)} className="w-full rounded-full bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90">Upgrade</button>
                  : null}
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
