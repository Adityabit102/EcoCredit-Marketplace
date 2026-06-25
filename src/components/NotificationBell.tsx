import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CheckCheck } from 'lucide-react'
import { api } from '../services/api'

const ICON: Record<string, string> = {
  action_verified: '✅', action_pending: '⏳', action_rejected: '❌',
  sale: '💚', purchase: '🛒', badge: '🏅', price_alert: '🔔', referral: '🎁', system: 'ℹ️',
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const load = () => api.notifications.list({ limit: 20 })
    .then((d) => { setItems(d.notifications || []); setUnread(d.unread || 0) }).catch(() => {})

  useEffect(() => {
    load()
    const t = setInterval(load, 30000) // light polling
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => { clearInterval(t); document.removeEventListener('mousedown', onClick) }
  }, [])

  const markAll = async () => { await api.notifications.markAllRead(); setUnread(0); setItems((x) => x.map((n) => ({ ...n, read: true }))) }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen((o) => !o); if (!open) load() }}
        className="relative rounded-full p-2 text-pine hover:bg-secondary transition-colors">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center px-1">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="absolute right-0 mt-2 w-80 rounded-2xl bg-card border border-border shadow-2xl overflow-hidden z-[60]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/40">
              <span className="font-semibold text-pine">Notifications</span>
              {unread > 0 && (
                <button onClick={markAll} className="text-xs text-sage-deep flex items-center gap-1 hover:underline">
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">You're all caught up 🌿</div>
              ) : items.map((n) => (
                <div key={n._id} className={`flex gap-3 px-4 py-3 border-b border-border/50 ${n.read ? '' : 'bg-secondary/40'}`}>
                  <span className="text-lg">{ICON[n.type] || 'ℹ️'}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-pine">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
