import type { ComponentProps } from 'react';
import { Button } from '../ui/button';
import { cn } from '../../utils/cn';

export const GradientButton = ({ className, ...props }: ComponentProps<typeof Button>) => (
  <Button
    className={cn(
      'bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500 text-white shadow-glow hover:scale-[1.02] hover:from-sky-300 hover:to-violet-400',
      className,
    )}
    {...props}
  />
);
