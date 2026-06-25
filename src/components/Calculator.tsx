import { useMemo, useState, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Zap, Car, Plane, Utensils, Home, Leaf, ArrowRight, Trees } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { api } from '../services/api'
import GradientButton from './ui/GradientButton'

const EcoSphereScene = lazy(() => import('./three/Scene3D').then((m) => ({ default: m.EcoSphereScene })))

// Standard annual emission factors (tonnes CO2e). Sources: IEA / EPA / Our World in Data averages.
const DIETS = [
  { id: 'meat', label: 'Meat in most meals', t: 3.3 },
  { id: 'average', label: 'Average / mixed', t: 2.5 },
  { id: 'veg', label: 'Vegetarian', t: 1.7 },
  { id: 'vegan', label: 'Vegan', t: 1.5 },
]

function Slider({ icon: Icon, label, value, set, min, max, step, unit }: any) {
  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-2 text-pine font-medium"><Icon className="w-5 h-5 text-sage-deep" /> {label}</span>
        <span className="font-semibold text-pine">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))}
        className="w-full accent-[#3E5F55]" />
    </div>
  )
}

export default function Calculator() {
  const { dispatch } = useApp()
  const [electricity, setElectricity] = useState(250)  // kWh / month
  const [carKm, setCarKm] = useState(100)              // km / week
  const [flights, setFlights] = useState(2)            // flights / year
  const [gas, setGas] = useState(40)                   // therms heating / month
  const [diet, setDiet] = useState('average')

  const breakdown = useMemo(() => {
    const e = (electricity * 12 * 0.45) / 1000
    const c = (carKm * 52 * 0.17) / 1000
    const f = flights * 0.9
    const g = (gas * 12 * 5.3) / 1000
    const d = DIETS.find((x) => x.id === diet)!.t
    return { Electricity: e, Driving: c, Flights: f, Heating: g, Diet: d }
  }, [electricity, carKm, flights, gas, diet])

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0)
  const credits = Math.ceil(total * 10) // 1 credit ≈ 0.1 t in this platform
  const trees = Math.round(total / 0.02)
  const vsAvg = Math.round((total / 4) * 100) // world avg ~4t

  const autoOffset = async () => {
    try {
      const { url } = await api.payments.subscribe(Math.max(1, Math.round(total)))
      if (url) window.location.href = url
    } catch (err: any) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'info', message: err.message?.includes('configured') ? 'Auto-offset subscriptions require Stripe to be configured.' : (err.message || 'Could not start subscription') } })
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-pine mb-3">
          <Leaf className="w-4 h-4 text-sage-deep" /> Know your impact
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gradient">Carbon Footprint Calculator</h1>
        <p className="text-muted-foreground mt-2">Estimate your yearly emissions — then offset them instantly with verified credits.</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* inputs */}
        <div className="space-y-4">
          <Slider icon={Zap} label="Electricity" value={electricity} set={setElectricity} min={0} max={1500} step={10} unit=" kWh/mo" />
          <Slider icon={Car} label="Driving" value={carKm} set={setCarKm} min={0} max={1000} step={10} unit=" km/wk" />
          <Slider icon={Plane} label="Flights" value={flights} set={setFlights} min={0} max={20} step={1} unit="/yr" />
          <Slider icon={Home} label="Home heating" value={gas} set={setGas} min={0} max={150} step={5} unit=" th/mo" />
          <div className="rounded-2xl glass p-5">
            <span className="flex items-center gap-2 text-pine font-medium mb-3"><Utensils className="w-5 h-5 text-sage-deep" /> Diet</span>
            <div className="grid grid-cols-2 gap-2">
              {DIETS.map((d) => (
                <button key={d.id} onClick={() => setDiet(d.id)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${diet === d.id ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-pine hover:bg-secondary'}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* result */}
        <div className="space-y-6">
          <motion.div layout className="relative rounded-3xl glass glow-sage overflow-hidden">
            <div className="absolute inset-0 opacity-60 pointer-events-none">
              <Suspense fallback={null}><EcoSphereScene className="h-full w-full" /></Suspense>
            </div>
            <div className="relative p-8 text-center">
              <p className="text-muted-foreground">Your estimated footprint</p>
              <motion.div key={total.toFixed(1)} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-6xl font-bold text-gradient my-2">{total.toFixed(1)}<span className="text-2xl"> t CO₂/yr</span></motion.div>
              <p className="text-sm text-muted-foreground">{vsAvg}% of the global average (4 t)</p>
            </div>
          </motion.div>

          {/* breakdown bars */}
          <div className="rounded-2xl glass p-6 space-y-3">
            {Object.entries(breakdown).map(([k, v]) => (
              <div key={k}>
                <div className="flex justify-between text-sm mb-1"><span className="text-pine">{k}</span><span className="text-muted-foreground">{v.toFixed(2)} t</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#3E5F55,#A9CDBA)' }}
                    initial={{ width: 0 }} animate={{ width: `${Math.min(100, (v / total) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* offset CTA */}
          <div className="rounded-2xl bg-primary text-primary-foreground p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div>
              <div className="flex items-center gap-2 font-semibold"><Trees className="w-5 h-5" /> Offset it</div>
              <p className="text-sm opacity-90 mt-1">Buy ~<b>{credits} credits</b> (≈ {trees.toLocaleString()} trees) to go carbon-neutral.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={autoOffset}
                className="rounded-full border border-cream/40 px-4 py-2 text-sm font-medium hover:bg-cream/10 transition-colors">
                Auto-offset monthly
              </button>
              <GradientButton variant="outline" onClick={() => dispatch({ type: 'SET_PAGE', payload: 'marketplace' })}>
                Offset now <ArrowRight className="w-4 h-4" />
              </GradientButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
