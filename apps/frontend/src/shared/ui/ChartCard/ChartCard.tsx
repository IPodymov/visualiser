import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';

export const ChartCard = ({
  title,
  description,
  children,
  insight,
  actions,
}: {
  title: string;
  description: string;
  children: ReactNode;
  insight?: ReactNode;
  actions?: ReactNode;
}) => (
  <Card>
    <CardHeader className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <div>
        <CardTitle>{title}</CardTitle>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {actions}
    </CardHeader>
    <CardContent>
      {children}
      {insight && (
        <div className="mt-5 rounded-lg border border-teal-200 bg-[var(--color-shared-soft)] p-4 text-sm leading-6 text-teal-950">
          {insight}
        </div>
      )}
    </CardContent>
  </Card>
);
