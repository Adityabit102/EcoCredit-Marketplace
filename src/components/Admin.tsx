import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts'
import { Users, Leaf, ShoppingBag, DollarSign, ShieldCheck, Clock, Check, X } from 'lucide-react'
import { api } from '../services/api'
import { useApp } from '../contexts/AppContext'

const PALETTE = ['#3E5F55', '#6FA690', '#A9CDBA', '#C9A98C', '#CDEBD6']

function Kpi({ icon: Icon, label, value, tint }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold text-pine">{value}</p>
        </div>
        <div className="rounded-full p-3" style={{ background: tint }}><Icon className="w-6 h-6 text-pine" /></div>
      </div>
    </motion.div>
  )
}

export default function Admin() {
  const { dispatch } = useApp()
  const [stats, setStats] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [pending, setPending] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  const loadAll = () => {
    api.admin.stats().then(setStats).catch(() => {})
    api.admin.analytics({ days: 30 }).then(setAnalytics).catch(() => {})
    api.admin.pendingActions().then((d) => setPending(d.actions || [])).catch(() => {})
    api.admin.users({ limit: 20 }).then((d) => setUsers(d.users || [])).catch(() => {})
  }
  useEffect(() => { loadAll() }, [])

  const reviewAction = async (id: string, status: string) => {
    try {
      await api.admin.updateActionStatus(id, status)
      setPending((p) => p.filter((a) => a._id !== id))
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'success', message: `Action ${status}` } })
      api.admin.stats().then(setStats).catch(() => {})
    } catch (err: any) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'error', message: err.message || 'Failed' } })
    }
  }
  const changePlan = async (id: string, plan: string) => {
    try {
      await api.admin.updatePlan(id, plan)
      setUsers((u) => u.map((x) => (x._id === id ? { ...x, plan } : x)))
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'success', message: `Plan set to ${plan}` } })
    } catch { /* ignore */ }
  }

  const signups = (analytics?.signups || []).map((d: any) => ({ date: d._id.slice(5), count: d.count }))
  const types = (analytics?.actionTypes || []).map((d: any) => ({ name: d._id, co2: Math.round(d.co2 * 10) / 10 }))
  const plans = (analytics?.plans || []).map((d: any) => ({ name: d._id, value: d.count }))

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-pine mb-3">
          <ShieldCheck className="w-4 h-4 text-sage-deep" /> Platform Console
        </div>
        <h1 className="text-4xl font-bold text-gradient">Admin Analytics</h1>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Users} label="Users" value={stats?.users ?? '—'} tint="#CDEBD6" />
        <Kpi icon={Leaf} label="CO₂ Offset (t)" value={(stats?.totalCO2Offset ?? 0).toFixed(1)} tint="#A9CDBA" />
        <Kpi icon={ShoppingBag} label="Active Listings" value={stats?.activeListings ?? '—'} tint="#E7D7C8" />
        <Kpi icon={DollarSign} label="GMV ($)" value={(stats?.gmv ?? 0).toLocaleString()} tint="#CDEBD6" />
        <Kpi icon={ShieldCheck} label="Verified Actions" value={stats?.verifiedActions ?? '—'} tint="#A9CDBA" />
        <Kpi icon={Clock} label="Pending Review" value={stats?.pendingActions ?? '—'} tint="#E7D7C8" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 rounded-2xl glass p-6">
          <h3 className="font-semibold text-pine mb-4">New Signups (30 days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={signups}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3E5F55" stopOpacity={0.5} /><stop offset="100%" stopColor="#3E5F55" stopOpacity={0} />
              </linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#A9CDBA40" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#3E5F55" strokeWidth={2} fill="url(#g)" dot={{ r: 3, fill: '#3E5F55' }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass p-6">
          <h3 className="font-semibold text-pine mb-4">Plan Mix</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={plans} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={4}
                label={(e: any) => e.name}>
                {plans.map((_: any, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={24} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass p-6">
        <h3 className="font-semibold text-pine mb-4">CO₂ Offset by Action Type</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={types}>
            <CartesianGrid strokeDasharray="3 3" stroke="#A9CDBA40" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="co2" radius={[6, 6, 0, 0]} maxBarSize={64}>
              {types.map((_: any, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* verification queue */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass p-6">
        <h3 className="font-semibold text-pine mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-sage-deep" /> Verification Queue ({pending.length})</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No actions awaiting review. 🌿</p>
        ) : (
          <div className="space-y-3">
            {pending.map((a) => (
              <div key={a._id} className="flex items-center gap-4 rounded-xl bg-secondary/40 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-pine">{a.type} · {a.co2Estimate}t</p>
                  <p className="text-xs text-muted-foreground truncate">{a.description} — by {a.user?.name || a.user?.email}</p>
                </div>
                <button onClick={() => reviewAction(a._id, 'verified')} className="rounded-full bg-primary text-primary-foreground p-2 hover:opacity-90" title="Approve"><Check className="w-4 h-4" /></button>
                <button onClick={() => reviewAction(a._id, 'rejected')} className="rounded-full bg-destructive text-white p-2 hover:opacity-90" title="Reject"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* users management */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass p-6">
        <h3 className="font-semibold text-pine mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-sage-deep" /> Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border">
              <th className="py-2">Name</th><th>Role</th><th>CO₂</th><th>Plan</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-border/50">
                  <td className="py-2"><div className="font-medium text-pine">{u.name}</div><div className="text-xs text-muted-foreground">{u.email}</div></td>
                  <td className="capitalize">{u.role}</td>
                  <td>{(u.lifetimeCO2 || 0).toFixed(1)}t</td>
                  <td>
                    <select value={u.plan} onChange={(e) => changePlan(u._id, e.target.value)}
                      className="rounded-lg bg-input-background border border-border px-2 py-1 text-pine">
                      <option value="free">free</option><option value="pro">pro</option><option value="enterprise">enterprise</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
