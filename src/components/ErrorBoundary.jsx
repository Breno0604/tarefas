import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.name === 'ChunkLoadError' ||
        this.state.error?.message?.includes('Loading chunk') ||
        this.state.error?.message?.includes('Failed to fetch')

      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15">
              <AlertTriangle size={28} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              Algo deu errado
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {isChunkError
                ? 'Ocorreu um erro ao carregar uma parte da aplicação. Isso pode acontecer após uma atualização.'
                : 'Ocorreu um erro inesperado. Tente novamente ou recarregue a página.'}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
              >
                Tentar novamente
              </button>
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"
              >
                <RefreshCw size={14} />
                Recarregar
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-red-50 p-3 text-left text-[11px] text-red-700 dark:bg-red-500/10 dark:text-red-300">
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </pre>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
