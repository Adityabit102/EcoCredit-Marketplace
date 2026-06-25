import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, X, Send, Leaf } from 'lucide-react'
import { api } from '../services/api'

type Msg = { role: 'user' | 'assistant'; content: string }

const GREETING: Msg = { role: 'assistant', content: "Hi, I'm EcoBot 🌿 Ask me how to cut your footprint, earn credits, or what to offset." }

export default function EcoBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, open])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next); setInput(''); setLoading(true)
    try {
      const { reply } = await api.ai.chat(next.filter((m) => m !== GREETING).map(({ role, content }) => ({ role, content })))
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Hmm, I had trouble responding. Try again!' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen((o) => !o)} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
        className="fixed bottom-5 right-5 z-[55] h-14 w-14 rounded-full shadow-xl flex items-center justify-center text-cream"
        style={{ background: 'linear-gradient(135deg,#3E5F55,#6FA690)' }} aria-label="Open EcoBot">
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="fixed bottom-24 right-5 z-[55] w-[92vw] max-w-sm h-[28rem] rounded-2xl bg-card border border-border shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 text-cream" style={{ background: 'linear-gradient(135deg,#3E5F55,#6FA690)' }}>
              <div className="rounded-full bg-cream/20 p-1.5"><Leaf className="w-4 h-4" /></div>
              <div><p className="font-semibold leading-none">EcoBot</p><p className="text-xs opacity-80">Your green assistant</p></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-pine-deep'}`}>{m.content}</div>
                </div>
              ))}
              {loading && <div className="text-sm text-muted-foreground">EcoBot is typing…</div>}
              <div ref={endRef} />
            </div>
            <div className="border-t border-border p-2 flex items-center gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Ask EcoBot…" className="flex-1 bg-transparent px-3 py-2 text-sm outline-none" />
              <button onClick={send} disabled={loading} className="rounded-full bg-primary text-primary-foreground p-2 disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
