import { useState } from 'react'
import { api } from '../services/api'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'
import GradientButton from './ui/GradientButton'
import AuthLayout from './AuthLayout'

interface LoginProps {
  onNavigate: (page: string) => void
  onLogin: (user: any) => void
}

export default function Login({ onNavigate, onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const doLogin = async (creds: { email: string; password: string }) => {
    setError('')
    setIsLoading(true)
    try {
      const data = await api.auth.login(creds)
      localStorage.setItem('ecocredit_access_token', data.accessToken)
      onLogin(data.user)
    } catch (err: any) {
      setError(err.message || 'Failed to login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) return setError('Please fill in all fields')
    if (!email.includes('@')) return setError('Please enter a valid email address')
    await doLogin({ email, password })
  }

  const quickLogin = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('password123')
    doLogin({ email: demoEmail, password: 'password123' })
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue your climate journey." onBack={() => onNavigate('about')}>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {info && (
        <Alert className="mb-6 border-sage">
          <AlertDescription className="text-pine break-all">{info}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input id="email" type="email" placeholder="your.email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" />
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border-gray-300 accent-[#3E5F55]" />
            <span className="text-muted-foreground">Remember me</span>
          </label>
          <button type="button" className="text-pine hover:underline font-medium" onClick={async () => {
            if (!email.includes('@')) return setError('Enter your email above first, then click Forgot password')
            try { const r = await api.auth.forgotPassword(email); setError(''); setInfo(r.devLink ? `Dev reset link: ${r.devLink}` : 'If that email exists, a reset link has been sent.') }
            catch (err: any) { setError(err.message || 'Could not send reset link') }
          }}>Forgot password?</button>
        </div>
        <GradientButton type="submit" size="lg" className="w-full">
          {isLoading ? 'Signing in…' : 'Sign In'}
        </GradientButton>
      </form>

      <div className="mt-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick demo login</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => quickLogin('maya@ecocredit.com')}
            className="group flex items-center gap-3 rounded-xl border border-sage/60 bg-mint/40 px-4 py-3 text-left transition-all hover:border-pine hover:bg-mint/70 hover:shadow-sm disabled:opacity-50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pine/10 text-base">🌱</span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-pine">Maya</span>
              <span className="block text-xs text-muted-foreground truncate">Seller account</span>
            </span>
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => quickLogin('admin@ecocredit.com')}
            className="group flex items-center gap-3 rounded-xl border border-sage/60 bg-sand/40 px-4 py-3 text-left transition-all hover:border-pine hover:bg-sand/70 hover:shadow-sm disabled:opacity-50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pine/10 text-base">🛡️</span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-pine">Admin</span>
              <span className="block text-xs text-muted-foreground truncate">Full access</span>
            </span>
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">Instant access — no credentials needed</p>
      </div>

      <p className="mt-6 text-sm text-muted-foreground text-center">
        Don't have an account?{' '}
        <button onClick={() => onNavigate('register')} className="text-pine hover:underline font-semibold">Create Account</button>
      </p>
    </AuthLayout>
  )
}
