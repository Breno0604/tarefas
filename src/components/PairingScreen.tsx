/**
 * PairingScreen — shown when the user hasn't paired a device yet.
 *
 * Two modes:
 * 1. "New account" → generates a code, user shows it on another device
 * 2. "Join existing" → user enters a code from another device
 */

import React, { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { saveUserId } from "./ConvexProvider";

interface Props {
  onPaired: (userId: string) => void;
}

export default function PairingScreen({ onPaired }: Props) {
  const [mode, setMode] = useState<"choose" | "new" | "join">("choose");
  const [code, setCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const generateCode = useMutation(api.pairing.generateCode);
  const validateCode = useQuery(
    api.pairing.validateCode,
    code.length === 6 ? { code } : "skip"
  );
  const claimCode = useMutation(api.pairing.claimCode);

  // Generate a new pairing code
  const handleNewAccount = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Generate a temporary userId for this device
      const tempId = crypto.randomUUID();
      const result = await generateCode({ userId: tempId });
      setGeneratedCode(result);
      // Store temporarily — will be confirmed when paired
      sessionStorage.setItem("taskflow-temp-user-id", tempId);
      setMode("new");
    } catch (e) {
      setError("Erro ao gerar código. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [generateCode]);

  // Confirm the new account (use the generated code's userId)
  const handleConfirmNew = useCallback(() => {
    const tempId = sessionStorage.getItem("taskflow-temp-user-id");
    if (tempId) {
      saveUserId(tempId);
      sessionStorage.removeItem("taskflow-temp-user-id");
      onPaired(tempId);
    }
  }, [onPaired]);

  // Join an existing account
  const handleJoin = useCallback(async () => {
    if (code.length !== 6) {
      setError("O código deve ter 6 dígitos.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await claimCode({ code });
      if (result && result.userId) {
        saveUserId(result.userId);
        onPaired(result.userId);
      } else {
        setError("Código inválido ou expirado. Verifique e tente novamente.");
      }
    } catch (e) {
      setError("Erro ao validar código. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [code, claimCode, onPaired]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-card dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            TaskFlow
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sincronize seus dados entre dispositivos
          </p>
        </div>

        {mode === "choose" && (
          <div className="space-y-3">
            <button
              onClick={handleNewAccount}
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? "Gerando..." : "Nova conta"}
            </button>
            <button
              onClick={() => setMode("join")}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Entrar com código
            </button>
            <button
              onClick={() => {
                // Skip pairing — use a random userId (data won't sync)
                const id = crypto.randomUUID();
                saveUserId(id);
                onPaired(id);
              }}
              className="w-full px-4 py-2 text-xs text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
            >
              Pular por agora (sem sincronização)
            </button>
          </div>
        )}

        {mode === "new" && generatedCode && (
          <div className="text-center">
            <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
              Mostre este código no outro dispositivo:
            </p>
            <div className="mb-4 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 px-6 py-4 dark:border-brand-600 dark:bg-brand-950/30">
              <span className="text-3xl font-mono font-bold tracking-[0.3em] text-brand-600 dark:text-brand-400">
                {generatedCode}
              </span>
            </div>
            <p className="mb-4 text-xs text-slate-400">
              Código válido por 10 minutos
            </p>
            <button
              onClick={handleConfirmNew}
              className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Confirmar e entrar
            </button>
          </div>
        )}

        {mode === "join" && (
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Código de 6 dígitos
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              placeholder="000000"
              className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-2xl font-mono tracking-[0.2em] text-slate-800 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              autoFocus
            />
            {error && (
              <p className="mb-3 text-xs text-red-500">{error}</p>
            )}
            <button
              onClick={handleJoin}
              disabled={loading || code.length !== 6}
              className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? "Validando..." : "Entrar"}
            </button>
            <button
              onClick={() => { setMode("choose"); setCode(""); setError(""); }}
              className="mt-3 w-full px-4 py-2 text-xs text-slate-400 transition hover:text-slate-600"
            >
              ← Voltar
            </button>
          </div>
        )}

        {error && mode === "choose" && (
          <p className="mt-3 text-center text-xs text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
}
