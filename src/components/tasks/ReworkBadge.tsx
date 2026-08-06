import { RotateCcw } from 'lucide-react';

interface ReworkBadgeProps {
  qtd: number;
}

export default function ReworkBadge({ qtd }: ReworkBadgeProps) {
  if (qtd <= 0) return null;
  const texto = `retornou ${qtd} ${qtd === 1 ? 'vez' : 'vezes'}`;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
      <RotateCcw className="h-3 w-3" />
      {texto}
    </span>
  );
}
