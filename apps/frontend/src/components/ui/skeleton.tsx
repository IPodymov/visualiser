import type * as React from 'react';
import { cn } from '../../utils/cn';

export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('animate-pulse rounded-md bg-white/10', className)} {...props} />
);
