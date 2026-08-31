import React, { useState, useCallback } from "react";

interface Props {
  onAuthenticated: () => void;
}

export default function PasswordScreen({ onAuthenticated }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Digite a senha.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password.trim());
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      const storedHash = import.meta.env.VITE_APP_PASSWORD_HASH || "";

      if (!storedHash) {
        onAuthenticated();
        return;
      }

      if (hashHex === storedHash) {
        localStorage.setItem("taskflow-password-verified", "true");
        onAuthenticated();
      } else {
        setError("Senha incorreta.");
      }
    } catch {
      setError("Erro ao verificar senha.");
    } finally {
      setLoading(false);
    }
  }, [password, onAuthenticated]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-card dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">TaskFlow</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Acesso restrito</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Digite a senha de acesso"
            className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            autoFocus
          />
          {error && <p className="mb-3 text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
