import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { AppProvider } from '../context/AppContext';
import { ToastProvider } from '../context/ToastContext';

/** Renderiza o componente dentro dos providers reais (Toast + App). */
export function renderWithApp(ui: ReactElement): RenderResult {
  return render(
    <ToastProvider>
      <AppProvider>{ui}</AppProvider>
    </ToastProvider>
  );
}
