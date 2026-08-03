import { colaboradorResumo } from '../../utils/tasks';

interface AvatarProps {
  nome: string;
  cor: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_CLS: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-14 w-14 text-base',
};

export default function Avatar({ nome, cor, size = 'md' }: AvatarProps) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${SIZE_CLS[size]}`}
      style={{ backgroundColor: cor }}
      aria-hidden
    >
      {colaboradorResumo(nome).iniciais}
    </span>
  );
}
