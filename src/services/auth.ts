import { getSupabaseClient } from './supabaseClient';

/** Domínio usado no login por usuário: <usuario>@<dominio>. */
export const LOGIN_DOMAIN: string =
  (import.meta.env.VITE_APP_LOGIN_DOMAIN as string | undefined) ?? 'tarefas.local';

/** Traduz os erros comuns do Supabase Auth para mensagens úteis. */
function mensagemDeErro(erro: { code?: string; message?: string }, email: string): string {
  const codigo = erro.code ?? '';
  if (codigo === 'invalid_credentials') {
    return `Usuário ou senha inválidos. (e-mail testado: ${email})`;
  }
  if (codigo === 'email_not_confirmed') {
    return 'Seu usuário ainda não está confirmado no Supabase (Authentication → Users).';
  }
  if (codigo === 'email_provider_disabled') {
    return 'O login por e-mail está desabilitado no Supabase (Authentication → Sign In / Providers → Email).';
  }
  if (/provider.*enabled/i.test(erro.message ?? '')) {
    return 'O login por e-mail está desabilitado no Supabase (Authentication → Sign In / Providers → Email).';
  }
  return `Falha no login (${email}): ${erro.message ?? 'erro desconhecido'}`;
}

/** Login por usuário e senha: converte <usuario>@<domínio> para o Supabase Auth. */
export async function loginPorUsuario(usuario: string, senha: string): Promise<void> {
  const client = getSupabaseClient();
  const email = `${usuario.trim()}@${LOGIN_DOMAIN}`;
  const { error } = await client.auth.signInWithPassword({ email, password: senha });
  if (error) {
    throw new Error(mensagemDeErro(error, email));
  }
}

export async function sair(): Promise<void> {
  await getSupabaseClient().auth.signOut();
}
