import { useState, type FormEvent } from 'react';

interface LoginScreenProps {
  onLogin: (usuario: string, senha: string) => Promise<void>;
}

const campoCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100';

/** Tela de login por usuário e senha (o app converte para o Supabase Auth). */
export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !senha) return;
    setEnviando(true);
    setErro(null);
    try {
      await onLogin(usuario, senha);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha no login. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-lg"
      >
        <h1 className="text-center text-2xl font-bold text-slate-800">Tarefas</h1>
        <p className="mt-1 text-center text-sm text-slate-500">Entre para acessar suas tarefas.</p>
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-usuario" className="mb-1 block text-sm font-medium text-slate-700">
              Usuário
            </label>
            <input
              id="login-usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
              className={campoCls}
            />
          </div>
          <div>
            <label htmlFor="login-senha" className="mb-1 block text-sm font-medium text-slate-700">
              Senha
            </label>
            <input
              id="login-senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              className={campoCls}
            />
          </div>
          {erro && (
            <p role="alert" className="text-sm text-rose-600">
              {erro}
            </p>
          )}
          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </form>
    </div>
  );
}
