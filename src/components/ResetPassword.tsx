import { useState } from 'react'
import { api } from '../services/api'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Lock, AlertCircle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'
import GradientButton from './ui/GradientButton'
import AuthLayout from './AuthLayout'

export default function ResetPassword({ token, email, onDone }: { token: string; email: string; onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirm) return setError('Passwords do not match')
    setLoading(true)
    try {
      await api.auth.resetPassword({ token, email, password })
      setDone(true)
    } catch (err: any) {
      setError(err.message || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Set a new password" subtitle={`Resetting password for ${email}`} onBack={onDone}>
      {done ? (
        <div className="text-center py-6">
          <CheckCircle className="w-12 h-12 text-sage-deep mx-auto mb-3" />
          <p className="text-pine font-medium mb-4">Password updated! You can sign in now.</p>
          <GradientButton onClick={onDone}>Go to Sign In</GradientButton>
        </div>
      ) : (
        <>
          {error && <Alert variant="destructive" className="mb-6"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pl-10 h-12" />
              </div>
            </div>
            <GradientButton type="submit" size="lg" className="w-full">{loading ? 'Updating…' : 'Update password'}</GradientButton>
          </form>
        </>
      )}
    </AuthLayout>
  )
}
