import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  erro: Error | null;
}

/** Captura erros de renderização/inicialização e mostra uma mensagem em vez de tela em branco. */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { erro: null };

  static getDerivedStateFromError(erro: Error): ErrorBoundaryState {
    return { erro };
  }

  componentDidCatch(erro: Error, info: ErrorInfo): void {
    console.error('Erro inesperado ao iniciar o app:', erro, info);
  }

  render(): ReactNode {
    if (this.state.erro) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
            <p className="text-sm font-medium text-slate-800">Algo deu errado ao iniciar o aplicativo.</p>
            <p className="mt-2 break-words text-xs text-slate-500">{this.state.erro.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
