import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppState } from '../context/types';
import { appReducer } from '../context/appReducer';
import {
  createTask,
  computeIndicators,
  EMPTY_FILTERS,
  filterTasks,
} from '../utils/tasks';
import { TAREFAS } from '../data/mockData';
import { MemoryStorageProvider } from '../services/providers/MemoryStorageProvider';
import { isDueToday, isOverdue } from '../utils/date';
import type { Task } from '../types';
import { STATUS_LABELS } from '../utils/status';

/* ══════════════════════════════════════════════════════════════════
   SIMULAÇÃO — 1 SEMANA DE USO (06/08/2026 a 12/08/2026)
   Dirige o appReducer real com relógio fake, validando:
   - fluxo GTD: criar → A_FAZER → EM_ANDAMENTO → CONCLUIDA / ARQUIVADA / SUSPENSA
   - arquivamento com motivo e desarquivamento (ARQUIVADA → CAIXA_ENTRADA)
   - histórico (entradas de status, info de edição, duplicação, usuário)
   - concluidaEm (set ao concluir, limpo ao reabrir)
   - undo (pilha `past`, ações fora da pilha) e rejeição de transições inválidas
   - KPIs (computeIndicators) e filtros (filterTasks)
   - round-trip de persistência (MemoryStorageProvider)
   ══════════════════════════════════════════════════════════════════ */

const SEMANA = [
  new Date(2026, 7, 6, 9, 0, 0), // qui 06/08
  new Date(2026, 7, 7, 9, 0, 0), // sex 07/08
  new Date(2026, 7, 8, 10, 0, 0), // sáb 08/08
  new Date(2026, 7, 9, 10, 0, 0), // dom 09/08
  new Date(2026, 7, 10, 9, 0, 0), // seg 10/08
  new Date(2026, 7, 11, 9, 0, 0), // ter 11/08
  new Date(2026, 7, 12, 9, 0, 0), // qua 12/08
];

function bootState(): AppState {
  return {
    tasks: TAREFAS,
    view: 'lista',
    sidebarOpen: false,
    filters: { ...EMPTY_FILTERS },
    kpiCollapsed: false,
    filtersOpen: false,
    modal: { type: 'none' },
    past: [],
    tema: 'claro',
  };
}

function kpi(tasks: Task[], now: Date) {
  return computeIndicators(tasks, now);
}

function criar(state: AppState, titulo: string, prioridade: Task['prioridade'], prazo: string | null) {
  const task = createTask({ titulo, descricao: '', prioridade, prazo });
  return { state: appReducer(state, { type: 'CREATE_TASK', task }), task };
}

function mover(
  state: AppState,
  taskId: string,
  novoStatus: Task['status'],
  observacao?: string
): AppState {
  return appReducer(state, {
    type: 'CHANGE_STATUS',
    taskId,
    novoStatus,
    observacao,
  });
}

function label(status: Task['status'] | null): string {
  return status ? STATUS_LABELS[status] : '—';
}

function timeline(t: Task): string {
  return t.historico
    .map(
      (h) =>
        `  ${h.dataHora.slice(0, 10)} ${label(h.statusAnterior).padEnd(16)} → ${label(
          h.novoStatus
        ).padEnd(16)} ${h.tipo === 'info' ? '[info]' : '       '} ${h.observacao ?? ''}`
    )
    .join('\n');
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('simulação de uma semana de uso (app pessoal GTD)', () => {
  it('dia a dia: cria, conclui, arquiva, desarquiva, edita, duplica, desfaz e persiste — KPIs e histórico consistentes', async () => {
    const report: string[] = [];
    const kpiLinhas: string[] = [];

    // ── Baseline: Qui 06/08, 09:00 ──────────────────────────────────
    vi.setSystemTime(SEMANA[0]);
    let state = bootState();
    let now = SEMANA[0];

    const ind0 = kpi(state.tasks, now);
    expect(state.tasks).toHaveLength(58); // 8 base + 50 do seed
    expect(ind0).toEqual({
      total: 58,
      caixaEntrada: 13,
      aFazer: 11,
      emAndamento: 12,
      suspensas: 3,
      concluidas: 14,
      arquivadas: 5,
      atrasadas: 5,
    });
    // Regras de atraso no baseline
    const ta001 = state.tasks.find((t) => t.id === 'TA-001')!;
    const ta005 = state.tasks.find((t) => t.id === 'TA-005')!;
    expect(isOverdue(ta001.prazo, ta001.status, now)).toBe(false); // prazo é hoje
    expect(isOverdue(ta005.prazo, ta005.status, now)).toBe(true); // prazo 04/08, em andamento
    expect(ind0.atrasadas).toBeGreaterThanOrEqual(1);
    kpiLinhas.push(`baseline      | ${JSON.stringify(ind0)}`);

    // Filtros no baseline
    const hoje = filterTasks(state.tasks, { ...EMPTY_FILTERS, prazo: 'hoje' }, now);
    expect(hoje.some((t) => t.id === 'TA-001')).toBe(true);
    expect(hoje.every((t) => isDueToday(t.prazo, now))).toBe(true);
    const vencidas = filterTasks(state.tasks, { ...EMPTY_FILTERS, prazo: 'vencidas' }, now);
    expect(vencidas.some((t) => t.id === 'TA-005')).toBe(true);
    expect(vencidas.every((t) => isOverdue(t.prazo, t.status, now))).toBe(true);
    expect(vencidas).toHaveLength(ind0.atrasadas);
    const busca = filterTasks(state.tasks, { ...EMPTY_FILTERS, search: 'checkout' }, now);
    expect(busca.some((t) => t.id === 'TA-003')).toBe(true);
    expect(busca.every((t) => `${t.id} ${t.titulo} ${t.descricao}`.toLowerCase().includes('checkout'))).toBe(true);

    report.push('── DIA 1 — qui 06/08 ──');

    // Criar 2 tarefas na caixa de entrada
    let r = criar(state, 'Responder proposta do cliente X', 'alta', '2026-08-07');
    state = r.state;
    const proposta = r.task;
    expect(proposta.id).toBeTruthy();
    expect(proposta.status).toBe('CAIXA_ENTRADA');
    expect(proposta.historico).toHaveLength(1);
    expect(proposta.historico[0]).toMatchObject({
      statusAnterior: null,
      novoStatus: 'CAIXA_ENTRADA',
      tipo: 'status',
      observacao: 'Tarefa criada.',
      usuario: 'Eu',
    });

    r = criar(state, 'Agendar revisão trimestral', 'media', '2026-08-15');
    state = r.state;
    const agendar = r.task;
    expect(agendar.id).toBeTruthy();

    // Triagem: e-mails → A_FAZER → EM_ANDAMENTO
    const pastAntes = state.past.length;
    state = mover(state, 'TA-001', 'A_FAZER');
    state = mover(state, 'TA-001', 'EM_ANDAMENTO');
    expect(state.past.length).toBe(pastAntes + 2);
    const ta001Dia1 = state.tasks.find((t) => t.id === 'TA-001')!;
    expect(ta001Dia1.status).toBe('EM_ANDAMENTO');
    expect(ta001Dia1.concluidaEm).toBeUndefined();
    expect(ta001Dia1.historico).toHaveLength(2);
    expect(ta001Dia1.historico.map((h) => h.novoStatus)).toEqual(['A_FAZER', 'EM_ANDAMENTO']);
    expect(ta001Dia1.historico.every((h) => h.dataHora.startsWith('2026-08-06'))).toBe(true);

    // Arquivar escopo despriorizado (com motivo)
    state = mover(state, 'TA-002', 'ARQUIVADA', 'Escopo absorvido por outra frente.');
    const ta002 = state.tasks.find((t) => t.id === 'TA-002')!;
    expect(ta002.status).toBe('ARQUIVADA');
    expect(ta002.historico[ta002.historico.length - 1]?.observacao).toBe('Arquivada: Escopo absorvido por outra frente.');

    // Transições inválidas são rejeitadas sem mexer no estado nem na pilha
    const snapshot1 = state.tasks;
    const past1 = state.past.length;
    expect(appReducer(state, { type: 'CHANGE_STATUS', taskId: proposta.id, novoStatus: 'CONCLUIDA' }).tasks).toBe(snapshot1);
    expect(appReducer(state, { type: 'CHANGE_STATUS', taskId: 'TA-004', novoStatus: 'ARQUIVADA' }).tasks).toBe(snapshot1); // sem motivo
    expect(appReducer(state, { type: 'UPDATE_TASK', taskId: 'TA-004', changes: { status: 'CONCLUIDA' } }).tasks).toBe(snapshot1); // fora da whitelist
    expect(state.past.length).toBe(past1);

    // KPIs fim do dia 1
    let ind = kpi(state.tasks, now);
    expect({ total: ind.total, ce: ind.caixaEntrada, af: ind.aFazer, em: ind.emAndamento, su: ind.suspensas, co: ind.concluidas, ar: ind.arquivadas, at: ind.atrasadas }).toEqual({
      total: 60,
      ce: 13,
      af: 11,
      em: 13,
      su: 3,
      co: 14,
      ar: 6,
      at: 5,
    });
    kpiLinhas.push(`06/08 qui      | ${JSON.stringify(ind)}`);
    report.push('  • criou "Responder proposta do cliente X" (TA-059, alta, prazo 07/08)');
    report.push('  • criou "Agendar revisão trimestral" (TA-060, média, prazo 15/08)');
    report.push('  • triou TA-001: Caixa de entrada → A fazer → Em andamento');
    report.push('  • arquivou TA-002 ("Arquivada: Escopo absorvido por outra frente.")');
    report.push('  • rejeitou: CAIXA_ENTRADA→CONCLUIDA direto, ARQUIVADA sem motivo, UPDATE com status');

    // ── DIA 2 — sex 07/08 ────────────────────────────────────────────
    now = SEMANA[1];
    vi.setSystemTime(now);
    report.push('── DIA 2 — sex 07/08 ──');

    // TA-001 venceu hoje (prazo 06/08) enquanto está em andamento → atrasada
    const ta001Antes = state.tasks.find((t) => t.id === 'TA-001')!;
    expect(isOverdue(ta001Antes.prazo, ta001Antes.status, now)).toBe(true);

    // Conclui hoje mesmo
    state = mover(state, 'TA-001', 'CONCLUIDA');
    const ta001Fim = state.tasks.find((t) => t.id === 'TA-001')!;
    expect(ta001Fim.status).toBe('CONCLUIDA');
    expect(ta001Fim.concluidaEm).toMatch(/^2026-08-07T/);
    expect(ta001Fim.historico).toHaveLength(3);
    expect(ta001Fim.historico[ta001Fim.historico.length - 1]?.novoStatus).toBe('CONCLUIDA');
    expect(isOverdue(ta001Fim.prazo, ta001Fim.status, now)).toBe(false); // concluída nunca atrasa

    // Bug crítico entra em execução
    state = mover(state, 'TA-003', 'A_FAZER');
    state = mover(state, 'TA-003', 'EM_ANDAMENTO');

    // Nova tarefa + edição de prazo (gera entrada 'info' no histórico)
    r = criar(state, 'Preparar apresentação de status', 'media', '2026-08-10');
    state = r.state;
    const apresentacao = r.task;
    expect(apresentacao.id).toBeTruthy();
    state = appReducer(state, { type: 'UPDATE_TASK', taskId: 'TA-004', changes: { prazo: '2026-08-12' } });
    const ta004 = state.tasks.find((t) => t.id === 'TA-004')!;
    expect(ta004.prazo).toBe('2026-08-12');
    const info = ta004.historico[ta004.historico.length - 1]!;
    expect(info.tipo).toBe('info');
    expect(info.statusAnterior).toBe('A_FAZER');
    expect(info.novoStatus).toBe('A_FAZER');
    expect(info.observacao).toContain('Prazo alterado de 2026-08-10 para 2026-08-12');
    expect(info.usuario).toBe('Eu');

    ind = kpi(state.tasks, now);
    expect({ total: ind.total, ce: ind.caixaEntrada, af: ind.aFazer, em: ind.emAndamento, su: ind.suspensas, co: ind.concluidas, ar: ind.arquivadas, at: ind.atrasadas }).toEqual({
      total: 61,
      ce: 13,
      af: 11,
      em: 13,
      su: 3,
      co: 15,
      ar: 6,
      at: 5,
    });
    kpiLinhas.push(`07/08 sex      | ${JSON.stringify(ind)}`);
    report.push('  • concluiu TA-001 (prazo venceu ontem → Atrasadas caiu ao concluir)');
    report.push('  • bug crítico TA-003 em execução');
    report.push('  • criou "Preparar apresentação de status" (prazo 10/08)');
    report.push('  • editou prazo de TA-004 → histórico ganhou entrada [info] com usuário');

    // ── DIA 3 — sáb 08/08 ────────────────────────────────────────────
    now = SEMANA[2];
    vi.setSystemTime(now);
    report.push('── DIA 3 — sáb 08/08 ──');

    // Bug crítico concluído
    state = mover(state, 'TA-003', 'CONCLUIDA');
    expect(state.tasks.find((t) => t.id === 'TA-003')!.concluidaEm).toMatch(/^2026-08-08T/);

    // Duplicar TA-004 → cópia na caixa de entrada com histórico próprio
    state = appReducer(state, { type: 'DUPLICATE_TASK', taskId: 'TA-004' });
    const copia = state.tasks[state.tasks.length - 1]!;
    expect(copia.id).not.toBe('TA-004');
    expect(copia.status).toBe('CAIXA_ENTRADA');
    expect(copia.favorita).toBe(false);
    expect(copia.historico).toHaveLength(1);
    expect(copia.historico[0].observacao).toContain('Tarefa duplicada de');

    // Favoritar não entra na pilha de undo, mas fica registrado no histórico
    const pastAntesFav = state.past.length;
    state = appReducer(state, { type: 'TOGGLE_FAVORITE', taskId: proposta.id });
    expect(state.past.length).toBe(pastAntesFav);
    const propostaFavoritada = state.tasks.find((t) => t.id === proposta.id)!;
    expect(propostaFavoritada.favorita).toBe(true);
    expect(propostaFavoritada.historico[propostaFavoritada.historico.length - 1]).toMatchObject({
      tipo: 'info',
      observacao: 'Tarefa adicionada aos favoritos.',
      usuario: 'Eu',
    });

    // Reabrir uma concluída (retomar) limpa concluidaEm
    state = mover(state, 'TA-007', 'EM_ANDAMENTO');
    const ta007 = state.tasks.find((t) => t.id === 'TA-007')!;
    expect(ta007.status).toBe('EM_ANDAMENTO');
    expect(ta007.concluidaEm).toBeUndefined();
    expect(ta007.historico[ta007.historico.length - 1]).toMatchObject({ statusAnterior: 'CONCLUIDA', novoStatus: 'EM_ANDAMENTO' });
    state = mover(state, 'TA-007', 'CONCLUIDA');
    expect(state.tasks.find((t) => t.id === 'TA-007')!.concluidaEm).toMatch(/^2026-08-08T/);

    ind = kpi(state.tasks, now);
    expect({ total: ind.total, ce: ind.caixaEntrada, af: ind.aFazer, em: ind.emAndamento, su: ind.suspensas, co: ind.concluidas, ar: ind.arquivadas, at: ind.atrasadas }).toEqual({
      total: 62,
      ce: 14,
      af: 11,
      em: 12,
      su: 3,
      co: 16,
      ar: 6,
      at: 7,
    });
    kpiLinhas.push(`08/08 sáb      | ${JSON.stringify(ind)}`);
    report.push('  • concluiu o bug crítico TA-003');
    report.push('  • duplicou TA-004 (cópia na caixa de entrada)');
    report.push('  • favoritou a proposta (não entra no undo, mas fica no histórico)');
    report.push('  • reabriu TA-007 (concluidaEm limpo) e reconcluiu');

    // ── DIA 4 — dom 09/08 ────────────────────────────────────────────
    now = SEMANA[3];
    vi.setSystemTime(now);
    report.push('── DIA 4 — dom 09/08 ──');
    r = criar(state, 'Organizar fotos da viagem', 'baixa', null);
    state = r.state;
    const fotos = r.task;
    expect(fotos.id).toBeTruthy();
    expect(fotos.prazo).toBeNull();
    ind = kpi(state.tasks, now);
    expect({ total: ind.total, ce: ind.caixaEntrada, af: ind.aFazer, em: ind.emAndamento, su: ind.suspensas, co: ind.concluidas, ar: ind.arquivadas, at: ind.atrasadas }).toEqual({
      total: 63,
      ce: 15,
      af: 11,
      em: 12,
      su: 3,
      co: 16,
      ar: 6,
      at: 8,
    });
    kpiLinhas.push(`09/08 dom      | ${JSON.stringify(ind)}`);
    report.push('  • criou "Organizar fotos da viagem" (sem prazo)');

    // ── DIA 5 — seg 10/08 ────────────────────────────────────────────
    now = SEMANA[4];
    vi.setSystemTime(now);
    report.push('── DIA 5 — seg 10/08 ──');

    // Proposta (prazo 07/08) concluída depois de atrasar
    expect(isOverdue(proposta.prazo, state.tasks.find((t) => t.id === proposta.id)!.status, now)).toBe(true);
    state = mover(state, proposta.id, 'A_FAZER');
    state = mover(state, proposta.id, 'EM_ANDAMENTO');
    state = mover(state, proposta.id, 'CONCLUIDA');
    const propostaFim = state.tasks.find((t) => t.id === proposta.id)!;
    expect(propostaFim.status).toBe('CONCLUIDA');
    expect(propostaFim.concluidaEm).toMatch(/^2026-08-10T/);
    expect(propostaFim.historico).toHaveLength(5); // criação + favorito + 3 transições
    expect(isOverdue(propostaFim.prazo, propostaFim.status, now)).toBe(false);

    // Apresentação: inicia → desfaz (UNDO) → reinicia
    state = mover(state, apresentacao.id, 'A_FAZER');
    state = mover(state, apresentacao.id, 'EM_ANDAMENTO');
    const antesUndo = state.tasks;
    const pastAntesUndo = state.past.length;
    state = appReducer(state, { type: 'UNDO' });
    expect(state.past.length).toBe(pastAntesUndo - 1);
    const ta061 = state.tasks.find((t) => t.id === apresentacao.id)!;
    expect(ta061.status).toBe('A_FAZER');
    expect(state.tasks).not.toBe(antesUndo);
    state = mover(state, apresentacao.id, 'EM_ANDAMENTO');

    ind = kpi(state.tasks, now);
    expect({ total: ind.total, ce: ind.caixaEntrada, af: ind.aFazer, em: ind.emAndamento, su: ind.suspensas, co: ind.concluidas, ar: ind.arquivadas, at: ind.atrasadas }).toEqual({
      total: 63,
      ce: 13,
      af: 11,
      em: 13,
      su: 3,
      co: 17,
      ar: 6,
      at: 7,
    });
    kpiLinhas.push(`10/08 seg      | ${JSON.stringify(ind)}`);
    report.push('  • concluiu a proposta atrasada');
    report.push('  • apresentação: iniciou → Desfazer (voltou a A fazer) → reiniciou');

    // ── DIA 6 — ter 11/08 ────────────────────────────────────────────
    now = SEMANA[5];
    vi.setSystemTime(now);
    report.push('── DIA 6 — ter 11/08 ──');
    state = mover(state, fotos.id, 'ARQUIVADA', 'Não vou conseguir fazer este mês.');
    expect(state.tasks.find((t) => t.id === fotos.id)!.status).toBe('ARQUIVADA');
    state = mover(state, apresentacao.id, 'CONCLUIDA');
    expect(state.tasks.find((t) => t.id === apresentacao.id)!.concluidaEm).toMatch(/^2026-08-11T/);
    ind = kpi(state.tasks, now);
    expect({ total: ind.total, ce: ind.caixaEntrada, af: ind.aFazer, em: ind.emAndamento, su: ind.suspensas, co: ind.concluidas, ar: ind.arquivadas, at: ind.atrasadas }).toEqual({
      total: 63,
      ce: 12,
      af: 11,
      em: 12,
      su: 3,
      co: 18,
      ar: 7,
      at: 9,
    });
    kpiLinhas.push(`11/08 ter      | ${JSON.stringify(ind)}`);
    report.push('  • arquivou as fotos ("Não vou conseguir fazer este mês.")');
    report.push('  • concluiu a apresentação');

    // ── DIA 7 — qua 12/08 ────────────────────────────────────────────
    now = SEMANA[6];
    vi.setSystemTime(now);
    report.push('── DIA 7 — qua 12/08 ──');
    r = criar(state, 'Ler relatório de julho', 'media', '2026-08-14');
    state = r.state;
    const relatorio = r.task;
    expect(relatorio.id).toBeTruthy();
    // Todos os ids criados na semana são únicos
    expect(new Set([proposta.id, agendar.id, apresentacao.id, fotos.id, relatorio.id]).size).toBe(5);

    // Reordenação manual não entra no undo; excluir tarefa duplicada
    const pastAntesReorder = state.past.length;
    state = appReducer(state, { type: 'REORDER_TASKS', taskId: relatorio.id, toTaskId: 'TA-001' });
    expect(state.past.length).toBe(pastAntesReorder);
    const idx064 = state.tasks.findIndex((t) => t.id === relatorio.id);
    const idx001 = state.tasks.findIndex((t) => t.id === 'TA-001');
    expect(idx064).toBeLessThan(idx001);
    state = appReducer(state, { type: 'DELETE_TASK', taskId: copia.id });
    expect(state.tasks.some((t) => t.id === copia.id)).toBe(false);

    // Desarquivar TA-002 (ARQUIVADA → CAIXA_ENTRADA) — volta para a caixa de entrada
    state = mover(state, 'TA-002', 'CAIXA_ENTRADA');
    const ta002Final = state.tasks.find((t) => t.id === 'TA-002')!;
    expect(ta002Final.status).toBe('CAIXA_ENTRADA');
    expect(ta002Final.historico[ta002Final.historico.length - 1]).toMatchObject({
      statusAnterior: 'ARQUIVADA',
      novoStatus: 'CAIXA_ENTRADA',
      tipo: 'status',
      observacao: 'Tarefa desarquivada.',
    });

    const final = kpi(state.tasks, now);
    expect({ total: final.total, ce: final.caixaEntrada, af: final.aFazer, em: final.emAndamento, su: final.suspensas, co: final.concluidas, ar: final.arquivadas, at: final.atrasadas }).toEqual({
      total: 63,
      ce: 13,
      af: 11,
      em: 12,
      su: 3,
      co: 18,
      ar: 6,
      at: 12,
    });
    // Regras no fim da semana
    expect(isOverdue('2026-08-15', 'CAIXA_ENTRADA', now)).toBe(false); // prazo futuro
    expect(isOverdue(null, 'A_FAZER', now)).toBe(false); // sem prazo nunca atrasa
    expect(isOverdue('2026-08-01', 'ARQUIVADA', now)).toBe(false); // arquivada nunca atrasa
    expect(final.atrasadas).toBe(state.tasks.filter((t) => isOverdue(t.prazo, t.status, now)).length);
    expect(final.atrasadas).toBeGreaterThanOrEqual(1);
    kpiLinhas.push(`12/08 qua      | ${JSON.stringify(final)}`);
    report.push('  • criou "Ler relatório de julho" e reordenou manualmente');
    report.push('  • excluiu a duplicada');
    report.push('  • desarquivou TA-002 (volta à Caixa de entrada, registrado no histórico)');

    // Filtros no estado final
    const soCaixa = filterTasks(state.tasks, { ...EMPTY_FILTERS, status: ['CAIXA_ENTRADA'] }, now);
    expect(soCaixa).toHaveLength(13);
    expect(soCaixa.every((t) => t.status === 'CAIXA_ENTRADA')).toBe(true);
    const soArquivadas = filterTasks(state.tasks, { ...EMPTY_FILTERS, status: ['ARQUIVADA'] }, now);
    expect(soArquivadas).toHaveLength(6);
    expect(soArquivadas.every((t) => t.status === 'ARQUIVADA')).toBe(true);

    // Pilha de undo limitada a 50
    expect(state.past.length).toBeLessThanOrEqual(50);

    // ── Persistência: round-trip (MemoryStorageProvider) ─────────────
    const provider = new MemoryStorageProvider();
    await provider.save({ tasks: state.tasks, preferencias: null });
    const carregado = await provider.load();
    expect(carregado).not.toBeNull();
    expect(carregado!.tasks).toEqual(state.tasks);

    /* ── RELATÓRIO ── */
    const linhas = ['', '═'.repeat(74), '  SIMULAÇÃO — 1 SEMANA (06/08/2026 a 12/08/2026) — app pessoal GTD', '═'.repeat(74)];
    linhas.push(
      '  KPI (Total | Caixa entrada | A fazer | Em andamento | Suspensas | Concluídas | Arquivadas | Atrasadas)'
    );
    linhas.push('  ' + '─'.repeat(70));
    for (const l of kpiLinhas) linhas.push(`  ${l}`);
    linhas.push('', '  AGENDA DA SEMANA');
    linhas.push('  ' + '─'.repeat(70));
    for (const l of report) linhas.push(`  ${l}`);
    const ta001Final = state.tasks.find((t) => t.id === 'TA-001')!;
    const propostaFinal = state.tasks.find((t) => t.id === proposta.id)!;
    linhas.push('', `  HISTÓRICO de TA-001 (${ta001Final.titulo}) — final: ${STATUS_LABELS[ta001Final.status]}`);
    linhas.push(timeline(ta001Final));
    linhas.push('', `  HISTÓRICO da proposta (${propostaFinal.titulo}) — final: ${STATUS_LABELS[propostaFinal.status]}`);
    linhas.push(timeline(propostaFinal));
    const ta002Report = state.tasks.find((t) => t.id === 'TA-002')!;
    linhas.push('', `  HISTÓRICO de TA-002 (${ta002Report.titulo}) — final: ${STATUS_LABELS[ta002Report.status]}`);
    linhas.push(timeline(ta002Report));
    linhas.push('', '  RESUMO: 5 criadas · 5 concluídas · 2 arquivadas · 1 desarquivada · 1 excluída · 1 duplicada · 1 reaberta · 1 editada · 1 desfeita');
    linhas.push('  Persistência: salvo → carregado (round-trip OK) · pilha de undo ≤ 50');
    linhas.push('═'.repeat(74), '');
    for (const l of linhas) console.log(l);
  });
});
