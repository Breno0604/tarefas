import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppState } from '../context/types';
import { appReducer } from '../context/appReducer';
import {
  createTask,
  computeIndicators,
  EMPTY_FILTERS,
  filterTasks,
  nextTaskId,
} from '../utils/tasks';
import { TAREFAS } from '../data/mockData';
import { LocalStorageProvider } from '../services/providers/LocalStorageProvider';
import { isDueToday, isOverdue } from '../utils/date';
import type { Task } from '../types';
import { PRIORITY_RANK, STATUS_LABELS } from '../utils/status';

/* ══════════════════════════════════════════════════════════════════
   SIMULAÇÃO — 1 SEMANA DE USO (06/08/2026 a 12/08/2026)
   Dirige o appReducer real com relógio fake, validando:
   - fluxo GTD: criar → A_FAZER → EM_ANDAMENTO → CONCLUIDA / CANCELADA
   - histórico (entradas de status, info de edição, duplicação)
   - concluidaEm (set ao concluir, limpo ao reabrir)
   - undo (pilha `past`, ações fora da pilha) e rejeição de transições inválidas
   - KPIs (computeIndicators) e filtros (filterTasks)
   - round-trip de persistência (LocalStorageProvider v2)
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

function installMockLocalStorage() {
  const store = new Map<string, string>();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };
}

function kpi(tasks: Task[], now: Date) {
  return computeIndicators(tasks, now);
}

function criar(state: AppState, titulo: string, prioridade: Task['prioridade'], prazo: string | null) {
  const task = createTask(state.tasks, { titulo, descricao: '', prioridade, prazo });
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
  installMockLocalStorage();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  delete (globalThis as Record<string, unknown>).localStorage;
});

describe('simulação de uma semana de uso (app pessoal GTD)', () => {
  it('dia a dia: cria, conclui, cancela, edita, duplica, desfaz e persiste — KPIs e histórico consistentes', () => {
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
      emAndamento: 14,
      concluidas: 14,
      canceladas: 6,
      atrasadas: expect.any(Number) as unknown as number,
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
    expect(proposta.id).toBe('TA-059');
    expect(proposta.status).toBe('CAIXA_ENTRADA');
    expect(proposta.historico).toHaveLength(1);
    expect(proposta.historico[0]).toMatchObject({
      statusAnterior: null,
      novoStatus: 'CAIXA_ENTRADA',
      tipo: 'status',
      observacao: 'Tarefa criada.',
    });

    r = criar(state, 'Agendar revisão trimestral', 'media', '2026-08-15');
    state = r.state;
    expect(r.task.id).toBe('TA-060');

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

    // Cancelar escopo despriorizado (com observação)
    state = mover(state, 'TA-002', 'CANCELADA', 'Escopo absorvido por outra frente.');
    const ta002 = state.tasks.find((t) => t.id === 'TA-002')!;
    expect(ta002.status).toBe('CANCELADA');
    expect(ta002.historico[ta002.historico.length - 1]?.observacao).toBe('Escopo absorvido por outra frente.');

    // Transições inválidas são rejeitadas sem mexer no estado nem na pilha
    const snapshot1 = state.tasks;
    const past1 = state.past.length;
    expect(appReducer(state, { type: 'CHANGE_STATUS', taskId: 'TA-059', novoStatus: 'CONCLUIDA' }).tasks).toBe(snapshot1);
    expect(appReducer(state, { type: 'CHANGE_STATUS', taskId: 'TA-004', novoStatus: 'CANCELADA' }).tasks).toBe(snapshot1); // sem observação
    expect(appReducer(state, { type: 'UPDATE_TASK', taskId: 'TA-004', changes: { status: 'CONCLUIDA' } }).tasks).toBe(snapshot1); // fora da whitelist
    expect(state.past.length).toBe(past1);

    // KPIs fim do dia 1
    let ind = kpi(state.tasks, now);
    expect({ total: ind.total, ce: ind.caixaEntrada, af: ind.aFazer, em: ind.emAndamento, co: ind.concluidas, ca: ind.canceladas }).toEqual({
      total: 60,
      ce: 13,
      af: 11,
      em: 15,
      co: 14,
      ca: 7,
    });
    kpiLinhas.push(`06/08 qui      | ${JSON.stringify(ind)}`);
    report.push('  • criou "Responder proposta do cliente X" (TA-059, alta, prazo 07/08)');
    report.push('  • criou "Agendar revisão trimestral" (TA-060, média, prazo 15/08)');
    report.push('  • triou TA-001: Caixa de entrada → A fazer → Em andamento');
    report.push('  • cancelou TA-002 ("Escopo absorvido por outra frente.")');
    report.push('  • rejeitou: CAIXA_ENTRADA→CONCLUIDA direto, CANCELADA sem observação, UPDATE com status');

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
    expect(r.task.id).toBe('TA-061');
    state = appReducer(state, { type: 'UPDATE_TASK', taskId: 'TA-004', changes: { prazo: '2026-08-12' } });
    const ta004 = state.tasks.find((t) => t.id === 'TA-004')!;
    expect(ta004.prazo).toBe('2026-08-12');
    const info = ta004.historico[ta004.historico.length - 1]!;
    expect(info.tipo).toBe('info');
    expect(info.statusAnterior).toBe('A_FAZER');
    expect(info.novoStatus).toBe('A_FAZER');
    expect(info.observacao).toContain('Prazo alterado de 2026-08-10 para 2026-08-12');

    ind = kpi(state.tasks, now);
    expect({ total: ind.total, ce: ind.caixaEntrada, af: ind.aFazer, em: ind.emAndamento, co: ind.concluidas, ca: ind.canceladas }).toEqual({
      total: 61,
      ce: 13,
      af: 11,
      em: 15,
      co: 15,
      ca: 7,
    });
    kpiLinhas.push(`07/08 sex      | ${JSON.stringify(ind)}`);
    report.push('  • concluiu TA-001 (prazo venceu ontem → Atrasadas caiu ao concluir)');
    report.push('  • bug crítico TA-003 em execução');
    report.push('  • criou "Preparar apresentação de status" (TA-061, prazo 10/08)');
    report.push('  • editou prazo de TA-004 → histórico ganhou entrada [info]');

    // ── DIA 3 — sáb 08/08 ────────────────────────────────────────────
    now = SEMANA[2];
    vi.setSystemTime(now);
    report.push('── DIA 3 — sáb 08/08 ──');

    // Bug crítico concluído
    state = mover(state, 'TA-003', 'CONCLUIDA');
    expect(state.tasks.find((t) => t.id === 'TA-003')!.concluidaEm).toMatch(/^2026-08-08T/);

    // Duplicar TA-004 → cópia na caixa de entrada com histórico próprio
    state = appReducer(state, { type: 'DUPLICATE_TASK', taskId: 'TA-004' });
    const copia = state.tasks.find((t) => t.id === 'TA-062')!;
    expect(copia).toBeDefined();
    expect(copia.status).toBe('CAIXA_ENTRADA');
    expect(copia.favorita).toBe(false);
    expect(copia.historico).toHaveLength(1);
    expect(copia.historico[0].observacao).toBe('Tarefa duplicada de TA-004.');

    // Favoritar não entra na pilha de undo
    const pastAntesFav = state.past.length;
    state = appReducer(state, { type: 'TOGGLE_FAVORITE', taskId: 'TA-059' });
    expect(state.past.length).toBe(pastAntesFav);
    expect(state.tasks.find((t) => t.id === 'TA-059')!.favorita).toBe(true);

    // Reabrir uma concluída (retomar) limpa concluidaEm
    state = mover(state, 'TA-007', 'EM_ANDAMENTO');
    const ta007 = state.tasks.find((t) => t.id === 'TA-007')!;
    expect(ta007.status).toBe('EM_ANDAMENTO');
    expect(ta007.concluidaEm).toBeUndefined();
    expect(ta007.historico[ta007.historico.length - 1]).toMatchObject({ statusAnterior: 'CONCLUIDA', novoStatus: 'EM_ANDAMENTO' });
    state = mover(state, 'TA-007', 'CONCLUIDA');
    expect(state.tasks.find((t) => t.id === 'TA-007')!.concluidaEm).toMatch(/^2026-08-08T/);

    ind = kpi(state.tasks, now);
    expect({ total: ind.total, ce: ind.caixaEntrada, af: ind.aFazer, em: ind.emAndamento, co: ind.concluidas, ca: ind.canceladas }).toEqual({
      total: 62,
      ce: 14,
      af: 11,
      em: 14,
      co: 16,
      ca: 7,
    });
    kpiLinhas.push(`08/08 sáb      | ${JSON.stringify(ind)}`);
    report.push('  • concluiu o bug crítico TA-003');
    report.push('  • duplicou TA-004 → TA-062 na caixa de entrada');
    report.push('  • favoritou a proposta (não entra no undo)');
    report.push('  • reabriu TA-007 (concluidaEm limpo) e reconcluiu');

    // ── DIA 4 — dom 09/08 ────────────────────────────────────────────
    now = SEMANA[3];
    vi.setSystemTime(now);
    report.push('── DIA 4 — dom 09/08 ──');
    r = criar(state, 'Organizar fotos da viagem', 'baixa', null);
    state = r.state;
    expect(r.task.id).toBe('TA-063');
    expect(r.task.prazo).toBeNull();
    ind = kpi(state.tasks, now);
    expect({ total: ind.total, ce: ind.caixaEntrada, af: ind.aFazer, em: ind.emAndamento, co: ind.concluidas, ca: ind.canceladas }).toEqual({
      total: 63,
      ce: 15,
      af: 11,
      em: 14,
      co: 16,
      ca: 7,
    });
    kpiLinhas.push(`09/08 dom      | ${JSON.stringify(ind)}`);
    report.push('  • criou "Organizar fotos da viagem" (TA-063, sem prazo)');

    // ── DIA 5 — seg 10/08 ────────────────────────────────────────────
    now = SEMANA[4];
    vi.setSystemTime(now);
    report.push('── DIA 5 — seg 10/08 ──');

    // Proposta (prazo 07/08) concluída depois de atrasar
    expect(isOverdue(proposta.prazo, state.tasks.find((t) => t.id === 'TA-059')!.status, now)).toBe(true);
    state = mover(state, 'TA-059', 'A_FAZER');
    state = mover(state, 'TA-059', 'EM_ANDAMENTO');
    state = mover(state, 'TA-059', 'CONCLUIDA');
    const propostaFim = state.tasks.find((t) => t.id === 'TA-059')!;
    expect(propostaFim.status).toBe('CONCLUIDA');
    expect(propostaFim.concluidaEm).toMatch(/^2026-08-10T/);
    expect(propostaFim.historico).toHaveLength(4); // criação + 3 transições
    expect(isOverdue(propostaFim.prazo, propostaFim.status, now)).toBe(false);

    // Apresentação: inicia → desfaz (UNDO) → reinicia
    state = mover(state, 'TA-061', 'A_FAZER');
    state = mover(state, 'TA-061', 'EM_ANDAMENTO');
    const antesUndo = state.tasks;
    const pastAntesUndo = state.past.length;
    state = appReducer(state, { type: 'UNDO' });
    expect(state.past.length).toBe(pastAntesUndo - 1);
    const ta061 = state.tasks.find((t) => t.id === 'TA-061')!;
    expect(ta061.status).toBe('A_FAZER');
    expect(state.tasks).not.toBe(antesUndo);
    state = mover(state, 'TA-061', 'EM_ANDAMENTO');

    ind = kpi(state.tasks, now);
    expect({ total: ind.total, ce: ind.caixaEntrada, af: ind.aFazer, em: ind.emAndamento, co: ind.concluidas, ca: ind.canceladas }).toEqual({
      total: 63,
      ce: 13,
      af: 11,
      em: 15,
      co: 17,
      ca: 7,
    });
    kpiLinhas.push(`10/08 seg      | ${JSON.stringify(ind)}`);
    report.push('  • concluiu a proposta atrasada (TA-059)');
    report.push('  • TA-061: iniciou → Desfazer (voltou a A fazer) → reiniciou');

    // ── DIA 6 — ter 11/08 ────────────────────────────────────────────
    now = SEMANA[5];
    vi.setSystemTime(now);
    report.push('── DIA 6 — ter 11/08 ──');
    state = mover(state, 'TA-063', 'CANCELADA', 'Não vou conseguir fazer este mês.');
    expect(state.tasks.find((t) => t.id === 'TA-063')!.status).toBe('CANCELADA');
    state = mover(state, 'TA-061', 'CONCLUIDA');
    expect(state.tasks.find((t) => t.id === 'TA-061')!.concluidaEm).toMatch(/^2026-08-11T/);
    ind = kpi(state.tasks, now);
    expect({ total: ind.total, ce: ind.caixaEntrada, af: ind.aFazer, em: ind.emAndamento, co: ind.concluidas, ca: ind.canceladas }).toEqual({
      total: 63,
      ce: 12,
      af: 11,
      em: 14,
      co: 18,
      ca: 8,
    });
    kpiLinhas.push(`11/08 ter      | ${JSON.stringify(ind)}`);
    report.push('  • cancelou TA-063 ("Não vou conseguir fazer este mês.")');
    report.push('  • concluiu a apresentação (TA-061)');

    // ── DIA 7 — qua 12/08 ────────────────────────────────────────────
    now = SEMANA[6];
    vi.setSystemTime(now);
    report.push('── DIA 7 — qua 12/08 ──');
    r = criar(state, 'Ler relatório de julho', 'media', '2026-08-14');
    state = r.state;
    expect(r.task.id).toBe('TA-064');
    expect(nextTaskId(state.tasks)).toBe('TA-065');

    // Reordenação manual não entra no undo; excluir tarefa duplicada
    const pastAntesReorder = state.past.length;
    state = appReducer(state, { type: 'REORDER_TASKS', taskId: 'TA-064', toTaskId: 'TA-001' });
    expect(state.past.length).toBe(pastAntesReorder);
    const idx064 = state.tasks.findIndex((t) => t.id === 'TA-064');
    const idx001 = state.tasks.findIndex((t) => t.id === 'TA-001');
    expect(idx064).toBeLessThan(idx001);
    state = appReducer(state, { type: 'DELETE_TASK', taskId: 'TA-062' });
    expect(state.tasks.some((t) => t.id === 'TA-062')).toBe(false);

    const final = kpi(state.tasks, now);
    expect({ total: final.total, ce: final.caixaEntrada, af: final.aFazer, em: final.emAndamento, co: final.concluidas, ca: final.canceladas }).toEqual({
      total: 63,
      ce: 12,
      af: 11,
      em: 14,
      co: 18,
      ca: 8,
    });
    // Regras no fim da semana
    expect(isOverdue('2026-08-15', 'CAIXA_ENTRADA', now)).toBe(false); // prazo futuro
    expect(isOverdue(null, 'A_FAZER', now)).toBe(false); // sem prazo nunca atrasa
    expect(isOverdue('2026-08-01', 'CANCELADA', now)).toBe(false); // cancelada nunca atrasa
    expect(final.atrasadas).toBe(state.tasks.filter((t) => isOverdue(t.prazo, t.status, now)).length);
    expect(final.atrasadas).toBeGreaterThanOrEqual(1);
    kpiLinhas.push(`12/08 qua      | ${JSON.stringify(final)}`);
    report.push('  • criou "Ler relatório de julho" (TA-064) e reordenou manualmente');
    report.push('  • excluiu a duplicada TA-062');

    // Filtros no estado final
    const soCaixa = filterTasks(state.tasks, { ...EMPTY_FILTERS, status: ['CAIXA_ENTRADA'] }, now);
    expect(soCaixa).toHaveLength(12);
    expect(soCaixa.every((t) => t.status === 'CAIXA_ENTRADA')).toBe(true);
    const ordenadas = filterTasks(state.tasks, { ...EMPTY_FILTERS, sortBy: 'prioridade' }, now);
    for (let i = 1; i < ordenadas.length; i++) {
      expect(PRIORITY_RANK[ordenadas[i - 1].prioridade]).toBeLessThanOrEqual(
        PRIORITY_RANK[ordenadas[i].prioridade]
      );
    }

    // Pilha de undo limitada a 50
    expect(state.past.length).toBeLessThanOrEqual(50);

    // ── Persistência: round-trip LocalStorageProvider v2 ─────────────
    const provider = new LocalStorageProvider();
    provider.save({ tasks: state.tasks });
    const carregado = provider.load();
    expect(carregado).not.toBeNull();
    expect(carregado!.tasks).toEqual(state.tasks);
    provider.clear();
    expect(provider.load()).toBeNull();

    /* ── RELATÓRIO ── */
    const linhas = ['', '═'.repeat(74), '  SIMULAÇÃO — 1 SEMANA (06/08/2026 a 12/08/2026) — app pessoal GTD', '═'.repeat(74)];
    linhas.push(
      '  KPI (Total | Caixa entrada | A fazer | Em andamento | Concluídas | Canceladas | Atrasadas)'
    );
    linhas.push('  ' + '─'.repeat(70));
    for (const l of kpiLinhas) linhas.push(`  ${l}`);
    linhas.push('', '  AGENDA DA SEMANA');
    linhas.push('  ' + '─'.repeat(70));
    for (const l of report) linhas.push(`  ${l}`);
    const ta001Final = state.tasks.find((t) => t.id === 'TA-001')!;
    const propostaFinal = state.tasks.find((t) => t.id === 'TA-059')!;
    linhas.push('', `  HISTÓRICO de TA-001 (${ta001Final.titulo}) — final: ${STATUS_LABELS[ta001Final.status]}`);
    linhas.push(timeline(ta001Final));
    linhas.push('', `  HISTÓRICO de TA-059 (${propostaFinal.titulo}) — final: ${STATUS_LABELS[propostaFinal.status]}`);
    linhas.push(timeline(propostaFinal));
    linhas.push('', '  RESUMO: 5 criadas · 5 concluídas · 2 canceladas · 1 excluída · 1 duplicada · 1 reaberta · 1 editada · 1 desfeita');
    linhas.push('  Persistência v2: salvo → carregado (round-trip OK) · pilha de undo ≤ 50');
    linhas.push('═'.repeat(74), '');
    for (const l of linhas) console.log(l);
  });
});
