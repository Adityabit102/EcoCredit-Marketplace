import { lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Card } from './ui/card'
import GradientButton from './ui/GradientButton'
import CountUp from './ui/CountUp'
import { Leaf, ShieldCheck, Globe, TrendingUp, Users, Lock, ArrowRight } from 'lucide-react'
import { useApp } from '../contexts/AppContext'

// 3D scenes are heavy — load them only on the client, after the shell paints.
const TreeScene = lazy(() => import('./three/Scene3D').then((m) => ({ default: m.TreeScene })))
const SolarScene = lazy(() => import('./three/Scene3D').then((m) => ({ default: m.SolarScene })))
const WindScene = lazy(() => import('./three/Scene3D').then((m) => ({ default: m.WindScene })))
const DamScene = lazy(() => import('./three/Scene3D').then((m) => ({ default: m.DamScene })))
const GlobeScene = lazy(() => import('./three/Scene3D').then((m) => ({ default: m.GlobeScene })))
const Sustainability3DShowcase = lazy(() => import('./Sustainability3DShowcase'))

interface AboutEcoCreditProps {
  onNavigate: (page: string) => void
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: 'easeOut' } }),
}

export default function AboutEcoCredit({ onNavigate }: AboutEcoCreditProps) {
  const { state } = useApp()
  const authed = state.isAuthenticated
  // CTAs adapt to auth state
  const primary = authed ? { label: 'Go to Dashboard', page: 'dashboard' } : { label: 'Get Started', page: 'register' }
  const secondary = authed ? { label: 'Explore Marketplace', page: 'marketplace' } : { label: 'Sign In', page: 'login' }

  return (
    <div className="min-h-screen bg-gradient-to-b from-mint/40 via-background to-background">
      {/* ── Immersive 3D Hero ───────────────────────────── */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* animated aurora orbs for depth */}
        <div className="pointer-events-none absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-40 animate-float"
          style={{ background: 'radial-gradient(circle, #A9CDBA, transparent 70%)' }} />
        <div className="pointer-events-none absolute top-1/3 -right-24 h-[26rem] w-[26rem] rounded-full blur-3xl opacity-35 animate-float"
          style={{ background: 'radial-gradient(circle, #E7D7C8, transparent 70%)', animationDelay: '2s' }} />
        {/* 3D growing tree backdrop — fills the hero, framed so nothing clips */}
        <Suspense fallback={null}>
          <TreeScene fill className="absolute inset-0 h-full w-full opacity-95" />
        </Suspense>
        {/* soft vignette so text stays readable over the canvas */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="pointer-events-none absolute inset-0 ring-grid opacity-30" />

        <div className="relative max-w-6xl mx-auto text-center px-4 py-20">
          <motion.h1 initial="hidden" animate="show" custom={1} variants={fadeUp}
            className="text-5xl md:text-7xl font-bold tracking-tight text-gradient mb-6">
            Grow a greener planet,<br />one credit at a time
          </motion.h1>

          <motion.p initial="hidden" animate="show" custom={2} variants={fadeUp}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Turn real-world green actions into AI-verified, blockchain-backed carbon credits — then trade them in a transparent marketplace.
          </motion.p>

          <motion.div initial="hidden" animate="show" custom={3} variants={fadeUp}
            className="flex gap-4 justify-center flex-wrap">
            <GradientButton size="lg" onClick={() => onNavigate(primary.page)}>
              {primary.label} <ArrowRight className="w-4 h-4" />
            </GradientButton>
            <GradientButton size="lg" variant="outline" onClick={() => onNavigate(secondary.page)}>
              {secondary.label}
            </GradientButton>
          </motion.div>
        </div>
      </section>

      {/* ── Clean-energy trio: wind · solar · hydro (self-animating) ── */}
      <section className="px-4 pt-24 pb-16">
        <div className="max-w-5xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gradient">Clean energy, captured</h2>
          <p className="text-muted-foreground mt-3">Wind, sun, and water — the three pillars of a regenerative grid.</p>
        </div>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 items-center">
          {[
            { Scene: WindScene, label: 'Wind' },
            { Scene: SolarScene, label: 'Solar' },
            { Scene: DamScene, label: 'Hydro' },
          ].map(({ Scene, label }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
              <Suspense fallback={<div className="h-[380px]" />}>
                <Scene className="w-full h-[380px]" interactive />
              </Suspense>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Reel-style 3D sustainability showcase ───────── */}
      <Suspense fallback={<div className="h-96" />}>
        <Sustainability3DShowcase />
      </Suspense>

      {/* What is EcoCredit */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-[var(--teal)]">What is EcoCredit?</h2>
          <p className="text-center text-lg text-muted-foreground max-w-3xl mx-auto mb-12">
            EcoCredit is a carbon trading platform that combines blockchain technology with AI verification to create a transparent, accessible marketplace for environmental impact.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { Icon: Leaf, title: 'Submit Green Actions', body: 'Document your eco-friendly activities with geotagged photos and detailed descriptions. From planting trees to using renewable energy.' },
              { Icon: ShieldCheck, title: 'AI Verification', body: 'Our advanced AI system analyzes and verifies your submissions to ensure authenticity and calculate accurate carbon impact.' },
              { Icon: TrendingUp, title: 'Trade Credits', body: 'Earn eco-credits for verified actions and trade them in our marketplace. Turn your environmental impact into tangible value.' },
            ].map(({ Icon, title, body }) => (
              <motion.div key={title} whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                <Card className="p-8 text-center glass glow-sage h-full">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-pine" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-pine">{title}</h3>
                  <p className="text-muted-foreground">{body}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-gradient-to-b from-background to-mint/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-[var(--teal)]">How It Works</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--teal)] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="font-bold mb-2">Create Account</h3>
              <p className="text-muted-foreground text-sm">Sign up and complete your profile</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--green)] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="font-bold mb-2">Submit Actions</h3>
              <p className="text-muted-foreground text-sm">Upload proof of your green initiatives</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--light-blue)] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="font-bold mb-2">Get Verified</h3>
              <p className="text-muted-foreground text-sm">AI verifies and awards eco-credits</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--teal)] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="font-bold mb-2">Trade & Track</h3>
              <p className="text-muted-foreground text-sm">Trade credits and monitor your impact</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-[var(--teal)]">Key Features</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Globe className="w-10 h-10 text-[var(--teal)]" />
              </div>
              <div>
                <h3 className="font-bold mb-2">Blockchain Transparency</h3>
                <p className="text-muted-foreground">
                  Every transaction and verification is recorded on the blockchain, ensuring complete transparency and preventing fraud.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <ShieldCheck className="w-10 h-10 text-[var(--green)]" />
              </div>
              <div>
                <h3 className="font-bold mb-2">AI-Powered Verification</h3>
                <p className="text-muted-foreground">
                  Machine learning algorithms analyze photos, geolocation data, and action details to verify authenticity.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Users className="w-10 h-10 text-[var(--light-blue)]" />
              </div>
              <div>
                <h3 className="font-bold mb-2">Community Driven</h3>
                <p className="text-muted-foreground">
                  Join a global community of environmental champions. Collaborate, compete, and celebrate positive impact together.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Lock className="w-10 h-10 text-[var(--teal)]" />
              </div>
              <div>
                <h3 className="font-bold mb-2">Secure & Private</h3>
                <p className="text-muted-foreground">
                  Your data is encrypted and secured. You control what information is shared and with whom.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section — animated count-up + 3D impact globe */}
      <section className="relative py-20 px-4 bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute -right-10 top-0 h-full w-1/2 opacity-50 pointer-events-none hidden md:block">
          <Suspense fallback={null}><GlobeScene className="h-full w-full" /></Suspense>
        </div>
        <div className="relative max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our collective impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { v: 50, suffix: 'K+', label: 'Active Users' },
              { v: 2, suffix: 'M+', label: 'Green Actions' },
              { v: 500, suffix: 'K', label: 'Tons CO₂ Offset' },
              { v: 10, prefix: '$', suffix: 'M+', label: 'Credits Traded' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  <CountUp value={s.v} prefix={s.prefix} suffix={s.suffix} />
                </div>
                <p className="opacity-80">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-mint/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 text-[var(--teal)]">Ready to Make an Impact?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of individuals and businesses making a real difference in the fight against climate change.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <GradientButton size="lg" onClick={() => onNavigate(primary.page)}>
              {authed ? primary.label : 'Create Free Account'} <ArrowRight className="w-4 h-4" />
            </GradientButton>
            <GradientButton size="lg" variant="outline" onClick={() => onNavigate(secondary.page)}>
              {secondary.label}
            </GradientButton>
          </div>
        </div>
      </section>
    </div>
  )
}
