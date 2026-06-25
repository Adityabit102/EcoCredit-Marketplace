import { useState } from 'react'
import { api } from '../services/api'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Mail, Lock, User, AlertCircle, Building } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import GradientButton from './ui/GradientButton'
import AuthLayout from './AuthLayout'

interface RegisterProps {
  onNavigate: (page: string) => void
  onRegister: (user: any) => void
}

export default function Register({ onNavigate, onRegister }: RegisterProps) {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', accountType: 'individual', role: 'buyer',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const set = (field: keyof typeof formData, value: string) => setFormData((p) => ({ ...p, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) return setError('Please fill in all fields')
    if (!formData.email.includes('@')) return setError('Please enter a valid email address')
    if (formData.password.length < 8) return setError('Password must be at least 8 characters')
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match')
    setIsLoading(true)
    try {
      const data = await api.auth.register({
        name: formData.name, email: formData.email, password: formData.password,
        accountType: formData.accountType, role: formData.role,
      })
      localStorage.setItem('ecocredit_access_token', data.accessToken)
      onRegister(data.user)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join the carbon-neutral revolution." onBack={() => onNavigate('about')}>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Account Type</Label>
            <Select value={formData.accountType} onValueChange={(v: string) => set('accountType', v)}>
              <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="individual"><span className="flex items-center gap-2"><User className="w-4 h-4" /> Individual</span></SelectItem>
                <SelectItem value="business"><span className="flex items-center gap-2"><Building className="w-4 h-4" /> Business</span></SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>I want to…</Label>
            <Select value={formData.role} onValueChange={(v: string) => set('role', v)}>
              <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">Buy credits</SelectItem>
                <SelectItem value="seller">Sell credits</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">{formData.accountType === 'business' ? 'Business Name' : 'Full Name'}</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input id="name" placeholder={formData.accountType === 'business' ? 'Green Co.' : 'John Doe'} value={formData.name} onChange={(e) => set('name', e.target.value)} className="pl-10 h-12" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input id="email" type="email" placeholder="your.email@example.com" value={formData.email} onChange={(e) => set('email', e.target.value)} className="pl-10 h-12" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => set('password', e.target.value)} className="pl-10 h-12" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input id="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} className="pl-10 h-12" />
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground -mt-3">Use at least 8 characters.</p>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 rounded border-gray-300 accent-[#3E5F55]" required />
          <span className="text-muted-foreground">I agree to the <span className="text-pine">Terms of Service</span> and <span className="text-pine">Privacy Policy</span></span>
        </label>

        <GradientButton type="submit" size="lg" className="w-full">
          {isLoading ? 'Creating account…' : 'Create Account'}
        </GradientButton>
      </form>

      <p className="mt-6 text-sm text-muted-foreground text-center">
        Already have an account?{' '}
        <button onClick={() => onNavigate('login')} className="text-pine hover:underline font-semibold">Sign In</button>
      </p>
    </AuthLayout>
  )
}
