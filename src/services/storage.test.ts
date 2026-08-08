import { describe, expect, it } from 'vitest';
import { clearState, loadState, saveState } from './storage';

describe('storage (provider em memória usado nos testes)', () => {
  it('começa com o seed quando ainda não há dados salvos', async () => {
    const salvos = await loadState();
    expect(salvos).not.toBeNull();
    expect(salvos!.tasks.length).toBeGreaterThan(0);
  });

  it('salva e carrega o estado (tarefas + preferências)', async () => {
    const salvos = await loadState();
    const tasks = salvos!.tasks.slice(0, 2);
    await saveState({
      tasks,
      preferencias: { tema: 'escuro', view: 'quadro', kpiCollapsed: true },
    });
    expect(await loadState()).toEqual({
      tasks,
      preferencias: { tema: 'escuro', view: 'quadro', kpiCollapsed: true },
    });
  });

  it('clearState limpa os dados salvos', async () => {
    await saveState({ tasks: [], preferencias: null });
    await clearState();
    expect(await loadState()).toBeNull();
  });
});
