import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode; fallback?: ReactNode }
type State = { hasError: boolean }

// App-wide safety net: a render crash anywhere (e.g. WebGL/3D on low-end devices)
// shows a recoverable fallback instead of a blank white screen.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Caught by ErrorBoundary:', error)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) return this.props.fallback
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 p-6 text-center"
        style={{ background: 'linear-gradient(160deg,#CDEBD6,#A9CDBA)' }}>
        <div className="text-5xl">🌱</div>
        <h1 className="text-2xl font-semibold text-pine">Something went wrong</h1>
        <p className="max-w-sm text-pine/70">The page hit an unexpected error. Reloading usually fixes it.</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-pine px-6 py-3 font-medium text-white transition-transform hover:scale-105"
        >
          Reload page
        </button>
      </div>
    )
  }
}
