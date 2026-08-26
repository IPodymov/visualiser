import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle, RotateCcw } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { Card, CardContent } from '@shared/ui/card';
import { Skeleton } from '@shared/ui/skeleton';

export const LoadingState = ({
  label = 'Загружаем данные',
  rows = 3,
}: {
  label?: string;
  rows?: number;
}) => (
  <div role="status" aria-live="polite" aria-label={label} className="grid gap-3">
    <span className="visually-hidden">{label}</span>
    {Array.from({ length: rows }).map((_, index) => (
      <Skeleton key={index} className="h-24" />
    ))}
  </div>
);

export const ErrorState = ({
  title,
  text,
  onRetry,
}: {
  title: string;
  text: string;
  onRetry?: () => void;
}) => (
  <Card role="alert" className="border-red-200 bg-[var(--color-error-soft)]">
    <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
      <AlertCircle className="h-6 w-6 shrink-0 text-[var(--color-error)]" />
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
      {onRetry && (
        <Button type="button" variant="outline" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" />
          Повторить
        </Button>
      )}
    </CardContent>
  </Card>
);

export const SuccessState = ({ children }: { children: ReactNode }) => (
  <div
    role="status"
    className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900"
  >
    <CheckCircle2 className="h-4 w-4" />
    {children}
  </div>
);

export const InlineLoading = ({ label }: { label: string }) => (
  <span role="status" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
    <LoaderCircle className="h-4 w-4 animate-spin" />
    {label}
  </span>
);
