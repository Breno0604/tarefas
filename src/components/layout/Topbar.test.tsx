// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import Topbar from './Topbar';
import { renderWithApp } from '../../test/renderWithApp';
import { useApp } from '../../context/AppContext';

function StateProbe() {
  const { state } = useApp();
  return (
    <output data-testid="probe">
      {JSON.stringify({
        view: state.view,
        kpiCollapsed: state.kpiCollapsed,
        filtersOpen: state.filtersOpen,
        favoritas: state.filters.favoritas,
        tema: state.tema,
        modal: state.modal.type,
      })}
    </output>
  );
}

beforeEach(() => localStorage.clear());

describe('Topbar — Nova Tarefa', () => {
  it('sempre exibe o botão Nova Tarefa', () => {
    renderWithApp(<Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />);
    expect(screen.getByRole('button', { name: /Nova Tarefa/ })).toBeInTheDocument();
  });
});

describe('Topbar — campo de busca', () => {
  function SearchHarness({ initial = '' }: { initial?: string }) {
    const [value, setValue] = useState(initial);
    return <Topbar title="Tarefas" search={value} onSearch={setValue} onNewTask={() => {}} />;
  }

  it('não exibe o ícone de limpar quando a busca está vazia', () => {
    renderWithApp(<SearchHarness />);
    expect(screen.queryByRole('button', { name: 'Limpar busca' })).not.toBeInTheDocument();
  });

  it('exibe o ícone de limpar quando a busca tem conteúdo', () => {
    renderWithApp(<SearchHarness initial="login" />);
    expect(screen.getByRole('button', { name: 'Limpar busca' })).toBeInTheDocument();
  });

  it('limpa a busca ao clicar no ícone e esconde o botão', async () => {
    const user = userEvent.setup();
    renderWithApp(<SearchHarness initial="relatório" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('relatório');
    expect(screen.getByRole('button', { name: 'Limpar busca' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpar busca' }));

    expect(input).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Limpar busca' })).not.toBeInTheDocument();
  });

  it('não possui placeholder', () => {
    renderWithApp(<SearchHarness />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('placeholder');
  });

  it('Esc com termo preenchido limpa a busca', () => {
    renderWithApp(<SearchHarness initial="relatório" />);
    const input = screen.getByRole('textbox');

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(input).toHaveValue('');
  });

  it('Esc com busca vazia remove o foco do campo', () => {
    renderWithApp(<SearchHarness />);
    const input = screen.getByRole('textbox');
    input.focus();
    expect(input).toHaveFocus();

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(input).not.toHaveFocus();
  });
});

describe('Topbar — controles do topo', () => {
  it('exibe indicadores, filtros, favoritas e alternância de visualização', () => {
    renderWithApp(<Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />);
    expect(screen.getByRole('button', { name: 'Recolher indicadores' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ocultar filtros' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apenas favoritas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver como Quadro' })).toBeInTheDocument();
  });

  it('alterna a visibilidade dos indicadores', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
        <StateProbe />
      </>
    );

    await user.click(screen.getByRole('button', { name: 'Recolher indicadores' }));
    expect(screen.getByRole('button', { name: 'Expandir indicadores' })).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId('probe').textContent!).kpiCollapsed).toBe(true);
  });

  it('alterna a visibilidade dos filtros', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
        <StateProbe />
      </>
    );

    await user.click(screen.getByRole('button', { name: 'Ocultar filtros' }));
    expect(screen.getByRole('button', { name: 'Mostrar filtros' })).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId('probe').textContent!).filtersOpen).toBe(false);
  });

  it('alterna o filtro de favoritas', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
        <StateProbe />
      </>
    );

    await user.click(screen.getByRole('button', { name: 'Apenas favoritas' }));
    expect(screen.getByRole('button', { name: 'Remover favoritas' })).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId('probe').textContent!).favoritas).toBe(true);
  });

  it('alterna entre Lista e Quadro', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
        <StateProbe />
      </>
    );

    expect(screen.getByRole('button', { name: 'Ver como Quadro' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver como Quadro' }));
    expect(screen.getByRole('button', { name: 'Ver como Lista' })).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId('probe').textContent!).view).toBe('quadro');
  });

  it('alterna o tema claro/escuro aplicando a classe dark', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
        <StateProbe />
      </>
    );

    expect(screen.getByRole('button', { name: 'Ativar tema escuro' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ativar tema escuro' }));

    expect(screen.getByRole('button', { name: 'Ativar tema claro' })).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId('probe').textContent!).tema).toBe('escuro');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('persiste a visualização escolhida no localStorage', async () => {
    const user = userEvent.setup();
    renderWithApp(<Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Ver como Quadro' }));

    expect(localStorage.getItem('tarefas.view')).toBe('quadro');
  });

  it('restaura a visualização salva ao iniciar', () => {
    localStorage.setItem('tarefas.view', 'quadro');
    renderWithApp(
      <>
        <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
        <StateProbe />
      </>
    );

    expect(JSON.parse(screen.getByTestId('probe').textContent!).view).toBe('quadro');
    expect(screen.getByRole('button', { name: 'Ver como Lista' })).toBeInTheDocument();
  });

  it('abre o modal de atalhos pelo botão', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
        <StateProbe />
      </>
    );

    await user.click(screen.getByRole('button', { name: 'Atalhos de teclado' }));

    expect(JSON.parse(screen.getByTestId('probe').textContent!).modal).toBe('shortcuts');
  });
});

describe('Topbar — indicador de notificações', () => {
  function fakeNotification(permission: NotificationPermission) {
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: { permission, requestPermission: vi.fn() },
    });
  }

  function renderTopbar() {
    renderWithApp(<Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />);
  }

  it('com permissão padrão exibe o botão para ativar notificações', () => {
    fakeNotification('default');
    renderTopbar();
    expect(screen.getByRole('button', { name: 'Ativar notificações de lembrete' })).toBeInTheDocument();
    delete (window as { Notification?: unknown }).Notification;
  });

  it('com permissão concedida exibe apenas o ícone com título explicativo', () => {
    fakeNotification('granted');
    renderTopbar();
    expect(screen.getByTitle('Notificações de lembrete ativas')).toBeInTheDocument();
    expect(screen.queryByText('Notificações ativas')).not.toBeInTheDocument();
    delete (window as { Notification?: unknown }).Notification;
  });
});

describe('Topbar — menu "Mais opções"', () => {
  it('abre o menu com as ações secundárias', async () => {
    const user = userEvent.setup();
    renderWithApp(<Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Mais opções' }));

    expect(screen.getByRole('button', { name: 'Tema' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Indicadores' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtros' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Favoritas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Atalhos' })).toBeInTheDocument();
  });

  it('a ação "Filtros" do menu alterna filtersOpen', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
        <StateProbe />
      </>
    );

    await user.click(screen.getByRole('button', { name: 'Mais opções' }));
    await user.click(screen.getByRole('button', { name: 'Filtros' }));

    expect(JSON.parse(screen.getByTestId('probe').textContent!).filtersOpen).toBe(false);
  });

  it('a ação "Atalhos" do menu abre o modal de atalhos', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
        <StateProbe />
      </>
    );

    await user.click(screen.getByRole('button', { name: 'Mais opções' }));
    await user.click(screen.getByRole('button', { name: 'Atalhos' }));

    expect(JSON.parse(screen.getByTestId('probe').textContent!).modal).toBe('shortcuts');
  });

  it('fecha o menu após selecionar uma ação', async () => {
    const user = userEvent.setup();
    renderWithApp(<Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Mais opções' }));
    await user.click(screen.getByRole('button', { name: 'Favoritas' }));

    expect(screen.queryByRole('button', { name: 'Favoritas' })).not.toBeInTheDocument();
  });
});
