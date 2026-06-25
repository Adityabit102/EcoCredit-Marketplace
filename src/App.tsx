import { useEffect, useState } from "react"
import { AppProvider, useApp } from "./contexts/AppContext"
import { AnimatePresence, motion } from 'framer-motion'
import Navigation from "./components/Navigation"
import AboutEcoCredit from "./components/AboutEcoCredit"
import Login from "./components/Login"
import Register from "./components/Register"
import SubmitAction from "./components/SubmitAction"
import Marketplace from "./components/Marketplace"
import Dashboard from "./components/Dashboard"
import ImpactTracking from "./components/ImpactTracking"
import Leaderboard from "./components/Leaderboard"
import Favorites from "./components/Favorites"
import Rewards from "./components/Rewards"
import Admin from "./components/Admin"
import Calculator from "./components/Calculator"
import Settings from "./components/Settings"
import PublicProfile from "./components/PublicProfile"
import ProofPage from "./components/ProofPage"
import ResetPassword from "./components/ResetPassword"
import NotFound from "./components/NotFound"
import EcoBot from "./components/EcoBot"
import Footer from "./components/Footer"
import NotificationSystem from "./components/NotificationSystem"

const KNOWN_PAGES = ['about', 'login', 'register', 'home', 'submit', 'marketplace', 'dashboard', 'impact', 'leaderboard', 'favorites', 'rewards', 'calculator', 'settings', 'admin']

function AppContent() {
  const { state, dispatch } = useApp()
  const [reset, setReset] = useState<{ token: string; email: string } | null>(null)

  // Handle deep links: password reset and shared proof links.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('reset') && p.get('email')) setReset({ token: p.get('reset')!, email: p.get('email')! })
    if (p.get('proof')) dispatch({ type: 'SET_PAGE', payload: `proof:${p.get('proof')}` })
    if (p.get('reset') || p.get('proof')) window.history.replaceState({}, '', window.location.pathname)
  }, [dispatch])

  const handleNavigate = (page: string) => {
    dispatch({ type: 'SET_PAGE', payload: page })
  }
  const back = () => handleNavigate(state.isAuthenticated ? 'home' : 'about')

  const handleLogin = (user: any) => {
    dispatch({ type: 'LOGIN', payload: user })
    dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'success', message: 'Successfully logged in!' } })
  }

  const handleRegister = (user: any) => {
    dispatch({ type: 'LOGIN', payload: user })
    dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'success', message: 'Account created successfully!' } })
  }

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' })
    dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'info', message: 'You have been logged out' } })
  }

  const renderCurrentPage = () => {
    // Public deep-link pages (work logged in or out)
    if (state.currentPage.startsWith('proof:')) return <ProofPage proofId={state.currentPage.slice(6)} onBack={back} />
    if (state.currentPage.startsWith('profile:')) return <PublicProfile userId={state.currentPage.slice(8)} onBack={back} />

    // Pre-login pages
    if (!state.isAuthenticated) {
      switch (state.currentPage) {
        case 'about':
          return <AboutEcoCredit onNavigate={handleNavigate} />
        case 'login':
          return <Login onNavigate={handleNavigate} onLogin={handleLogin} />
        case 'register':
          return <Register onNavigate={handleNavigate} onRegister={handleRegister} />
        default:
          return <AboutEcoCredit onNavigate={handleNavigate} />
      }
    }

    // Post-login pages
    switch (state.currentPage) {
      case 'home':
        return <AboutEcoCredit onNavigate={handleNavigate} />
      case 'submit':
        return <SubmitAction />
      case 'marketplace':
        return <Marketplace />
      case 'dashboard':
        return <Dashboard />
      case 'impact':
        return <ImpactTracking />
      case 'leaderboard':
        return <Leaderboard />
      case 'favorites':
        return <Favorites />
      case 'rewards':
        return <Rewards />
      case 'calculator':
        return <Calculator />
      case 'settings':
        return <Settings />
      case 'admin':
        return <Admin />
      default:
        return KNOWN_PAGES.includes(state.currentPage)
          ? <AboutEcoCredit onNavigate={handleNavigate} />
          : <NotFound onHome={() => handleNavigate('home')} />
    }
  }

  // password reset deep-link takes over the screen
  if (reset) return <ResetPassword token={reset.token} email={reset.email} onDone={() => { setReset(null); handleNavigate('login') }} />

  // login/signup have their own full-screen branded layout — no global header there
  const hideChrome = !state.isAuthenticated && (state.currentPage === 'login' || state.currentPage === 'register')

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!hideChrome && (
        <Navigation
          currentPage={state.currentPage}
          onNavigate={handleNavigate}
          isAuthenticated={state.isAuthenticated}
          userEmail={state.user?.email}
          userRole={state.user?.role}
          onLogout={handleLogout}
        />
      )}
      <main className="min-h-screen">
        <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
          <motion.div
            key={state.currentPage}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {renderCurrentPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      {state.isAuthenticated && <Footer onNavigate={handleNavigate} />}
      {state.isAuthenticated && <EcoBot />}
      <NotificationSystem />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}