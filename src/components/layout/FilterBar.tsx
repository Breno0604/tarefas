import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, FilterX } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { COLABORADORES } from '../../data/mockData';
import { PRIORITY_LABELS, STATUS_LABELS } from '../../utils/status';
import type { Filters, PrazoFilter, Priority, TaskStatus } from '../../types';

function MultiSelect<T extends string>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (values: T[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggle = (value: T) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium transition-colors ${
          selected.length > 0
            ? 'border-indigo-400 text-indigo-700 ring-2 ring-indigo-100'
            : 'border-slate-300 text-slate-600 hover:bg-slate-50'
        }`}
      >
        {label}
        {selected.length > 0 && (
          <span className="rounded-full bg-indigo-100 px-1.5 text-xs font-semibold text-indigo-700">
            {selected.length}
          </span>
        )}
        <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-30 mt-1 max-h-64 w-52 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FilterBar() {
  const { state, dispatch } = useApp();
  const { filters } = state;

  const update = (patch: Partial<Filters>) => {
    dispatch({ type: 'SET_FILTERS', filters: patch });
  };

  const statusOptions = (Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => ({
    value: s,
    label: STATUS_LABELS[s],
  }));
  const prioridadeOptions = (Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => ({
    value: p,
    label: PRIORITY_LABELS[p],
  }));
  const responsavelOptions = COLABORADORES.map((c) => ({ value: c.id, label: c.nome }));

  const prazoOptions: { value: PrazoFilter; label: string }[] = [
    { value: 'todas', label: 'Todas as datas' },
    { value: 'vencidas', label: 'Vencidas' },
    { value: 'proximos7', label: 'Próximos 7 dias' },
    { value: 'semPrazo', label: 'Sem prazo' },
  ];

  const hasFilters =
    filters.status.length > 0 ||
    filters.prioridade.length > 0 ||
    filters.responsavel.length > 0 ||
    filters.prazo !== 'todas';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MultiSelect label="Status" options={statusOptions} selected={filters.status} onChange={(v) => update({ status: v })} />
      <MultiSelect label="Prioridade" options={prioridadeOptions} selected={filters.prioridade} onChange={(v) => update({ prioridade: v })} />
      <MultiSelect label="Responsável" options={responsavelOptions} selected={filters.responsavel} onChange={(v) => update({ responsavel: v })} />
      <select
        value={filters.prazo}
        onChange={(e) => update({ prazo: e.target.value as PrazoFilter })}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
      >
        {prazoOptions.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      {hasFilters && (
        <button
          onClick={() => dispatch({ type: 'RESET_FILTERS' })}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
        >
          <FilterX className="h-4 w-4" />
          Limpar
        </button>
      )}
    </div>
  );
}
