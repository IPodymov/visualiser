import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        neutral: 'border-border bg-muted text-muted-foreground',
        brand: 'border-blue-200 bg-[var(--color-brand-soft)] text-blue-800',
        shared: 'border-teal-200 bg-[var(--color-shared-soft)] text-teal-800',
        programA: 'border-blue-200 bg-[var(--color-program-a-soft)] text-blue-800',
        programB: 'border-amber-200 bg-[var(--color-program-b-soft)] text-amber-800',
        success: 'border-green-200 bg-green-50 text-green-800',
        warning: 'border-amber-200 bg-amber-50 text-amber-800',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export const Badge = ({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) => (
  <div className={cn(badgeVariants({ variant }), className)} {...props} />
);

export { badgeVariants };
