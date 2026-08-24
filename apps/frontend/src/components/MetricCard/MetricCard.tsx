import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

type MetricTone = 'neutral' | 'brand' | 'programA' | 'programB' | 'shared';

const toneClasses: Record<MetricTone, string> = {
  neutral: 'bg-card',
  brand: 'border-blue-200 bg-[var(--color-brand-soft)]',
  programA: 'border-blue-200 bg-[var(--color-program-a-soft)]',
  programB: 'border-amber-200 bg-[var(--color-program-b-soft)]',
  shared: 'border-teal-200 bg-[var(--color-shared-soft)]',
};

export const MetricCard = ({
  label,
  value,
  note,
  icon,
  tone = 'neutral',
  className,
}: {
  label: string;
  value: string | number;
  note?: string;
  icon?: ReactNode;
  tone?: MetricTone;
  className?: string;
}) => (
  <div
    className={cn('rounded-xl border border-border p-5 shadow-soft', toneClasses[tone], className)}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      {icon && <div className="text-primary">{icon}</div>}
    </div>
    <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{value}</div>
    {note && <p className="mt-2 text-sm leading-5 text-muted-foreground">{note}</p>}
  </div>
);
