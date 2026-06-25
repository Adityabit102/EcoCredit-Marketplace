import { motion } from 'framer-motion'
import { Leaf } from 'lucide-react'
import GradientButton from './ui/GradientButton'

export default function NotFound({ onHome }: { onHome: () => void }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl flex items-center justify-center text-cream" style={{ background: 'linear-gradient(135deg,#3E5F55,#6FA690)' }}>
          <Leaf className="w-10 h-10" />
        </div>
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <p className="text-lg text-muted-foreground mt-2 mb-8">This page wandered off into the forest.</p>
        <GradientButton size="lg" onClick={onHome}>Back to home</GradientButton>
      </motion.div>
    </div>
  )
}
