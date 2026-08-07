import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Aplica o tema salvo antes do primeiro paint (evita flash de tema claro).
if (typeof localStorage !== 'undefined' && localStorage.getItem('tarefas.tema') === 'escuro') {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
