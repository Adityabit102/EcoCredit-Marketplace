import { useRef, useState, type ReactNode, type MouseEvent } from 'react'
import { motion } from 'framer-motion'

type Props = {
  children: ReactNode
  onClick?: () => void
  variant?: 'solid' | 'outline'
  size?: 'md' | 'lg'
  className?: string
  type?: 'button' | 'submit'
}

/**
 * 21st.dev-style CTA: an always-animating panning gradient background, a shimmer
 * sweep on hover, and a subtle magnetic pull toward the cursor.
 */
export default function GradientButton({
  children, onClick, variant = 'solid', size = 'md', className = '', type = 'button',
}: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const onMove = (e: MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - (r.left + r.width / 2)) * 0.18
    const y = (e.clientY - (r.top + r.height / 2)) * 0.3
    setPos({ x, y })
  }
  const reset = () => setPos({ x: 0, y: 0 })

  const pad = size === 'lg' ? 'px-8 py-4 text-base' : 'px-6 py-3 text-sm'

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={reset}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: 'spring', stiffness: 250, damping: 18 }}
      whileTap={{ scale: 0.96 }}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-semibold tracking-tight ${pad} ${className}`}
    >
      {variant === 'solid' ? (
        <span
          className="animate-gradient absolute inset-0"
          style={{ backgroundImage: 'linear-gradient(110deg, #3E5F55, #6FA690, #A9CDBA, #C9A98C, #3E5F55)' }}
        />
      ) : (
        <>
          <span className="absolute inset-0 bg-card" />
          <span className="absolute inset-0 rounded-full p-[1.5px]"
            style={{ background: 'linear-gradient(110deg, #3E5F55, #A9CDBA, #C9A98C)', WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
        </>
      )}

      {/* shimmer sweep */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

      <span className={`relative z-10 flex items-center gap-2 ${variant === 'solid' ? 'text-cream' : 'text-pine'}`}>
        {children}
      </span>
    </motion.button>
  )
}
