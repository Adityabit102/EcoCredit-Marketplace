import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined' && (localStorage.getItem('ecocredit_theme') === 'dark')
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('ecocredit_theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <button onClick={() => setDark((d) => !d)} aria-label="Toggle theme"
      className="rounded-full p-2 text-pine hover:bg-secondary transition-colors">
      <motion.span key={dark ? 'm' : 's'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} className="block">
        {dark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </motion.span>
    </button>
  )
}
