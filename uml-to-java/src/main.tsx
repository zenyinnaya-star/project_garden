import { StrictMode, Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/* ── Error Boundary ────────────────────────────────────────────────────────
   Catches any render-time crash and shows a readable message instead of a
   completely blank white page. Without this, React 18/19 silently unmounts
   the entire tree on any uncaught error in production.
─────────────────────────────────────────────────────────────────────────── */
interface EBState { error: Error | null }

class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { error: null };

  static getDerivedStateFromError(error: Error): EBState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[UML→Code] Uncaught render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', background: '#000', color: '#e2e8f0',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif', padding: 32, gap: 16,
        }}>
          <div style={{ fontSize: 40 }}>⚠</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f87171' }}>
            Something went wrong
          </div>
          <pre style={{
            background: '#0f172a', border: '1px solid #1e293b',
            borderRadius: 8, padding: '12px 16px',
            fontSize: 12, color: '#94a3b8',
            maxWidth: 640, width: '100%', overflowX: 'auto',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {this.state.error.message}
            {import.meta.env.DEV && '\n\n'}
            {import.meta.env.DEV && this.state.error.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#1d4ed8', border: 'none', borderRadius: 8,
              color: '#fff', padding: '10px 24px',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
