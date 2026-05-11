import * as React from 'react';
import { cn } from '../../utils/cn';

export const Badge = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'inline-flex items-center rounded-md border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-100 transition-colors',
      className,
    )}
    {...props}
  />
);
