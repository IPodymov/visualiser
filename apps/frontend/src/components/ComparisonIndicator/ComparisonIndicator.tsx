import { ArrowDown, ArrowRight, ArrowUp, CircleEqual, Minus } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

type IndicatorState = 'more' | 'less' | 'equal' | 'onlyA' | 'onlyB';

const meta = {
  more: { icon: ArrowUp, className: 'border-blue-200 bg-blue-50 text-blue-800' },
  less: { icon: ArrowDown, className: 'border-amber-200 bg-amber-50 text-amber-800' },
  equal: { icon: CircleEqual, className: 'border-teal-200 bg-teal-50 text-teal-800' },
  onlyA: {
    icon: ArrowRight,
    className: 'border-blue-200 bg-[var(--color-program-a-soft)] text-blue-800',
  },
  onlyB: {
    icon: ArrowRight,
    className: 'border-amber-200 bg-[var(--color-program-b-soft)] text-amber-800',
  },
} satisfies Record<IndicatorState, { icon: typeof Minus; className: string }>;

export const ComparisonIndicator = ({
  state,
  children,
  className,
}: {
  state: IndicatorState;
  children: ReactNode;
  className?: string;
}) => {
  const Icon = meta[state].icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        meta[state].className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
};
