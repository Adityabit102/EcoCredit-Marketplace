import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Leaf, ArrowLeft, Copy, Check } from 'lucide-react'
import { api } from '../services/api'

export default function ProofPage({ proofId, onBack }: { proofId: string; onBack: () => void }) {
  const [proof, setProof] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.transactions.proof(proofId).then(setProof).catch(() => setProof(null)).finally(() => setLoading(false))
  }, [proofId])

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?proof=${proofId}`)
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  if (loading) return <div className="text-center text-muted-foreground py-20">Verifying proof…</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-pine mb-6"><ArrowLeft className="w-4 h-4" /> Back</button>
      {!proof ? (
        <div className="text-center py-20 glass rounded-3xl">
          <p className="text-pine font-medium">Proof not found</p>
          <p className="text-sm text-muted-foreground">This retirement ID could not be verified.</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl overflow-hidden glass glow-sage text-center">
          <div className="p-8 text-cream" style={{ background: 'linear-gradient(135deg,#2C453E,#3E5F55,#6FA690)' }}>
            <ShieldCheck className="w-12 h-12 mx-auto mb-3" />
            <h1 className="text-2xl font-bold">Verified Carbon Retirement</h1>
            <p className="opacity-80 text-sm mt-1">Permanently offset · on the public ledger</p>
          </div>
          <div className="p-8">
            <div className="text-6xl font-bold text-gradient">{proof.co2Offset.toFixed(2)}<span className="text-2xl"> t CO₂</span></div>
            <p className="text-muted-foreground mt-1">{proof.credits} credits retired</p>

            <div className="mt-6 grid grid-cols-2 gap-4 text-left">
              <div className="rounded-xl bg-secondary/60 p-4"><div className="text-xs text-muted-foreground">Retired by</div><div className="font-semibold text-pine">{proof.retiredBy}</div></div>
              <div className="rounded-xl bg-secondary/60 p-4"><div className="text-xs text-muted-foreground">Date</div><div className="font-semibold text-pine">{new Date(proof.date).toLocaleDateString()}</div></div>
              <div className="rounded-xl bg-secondary/60 p-4 col-span-2"><div className="text-xs text-muted-foreground">Proof ID</div><div className="font-mono font-semibold text-pine">{proof.proofId}</div></div>
            </div>

            <button onClick={copyLink} className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied!' : 'Share proof'}
            </button>
            <p className="mt-4 text-xs text-muted-foreground flex items-center justify-center gap-1"><Leaf className="w-3 h-3" /> Verified by EcoCredit India</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
