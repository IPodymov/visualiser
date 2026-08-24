import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export const PageHeader = ({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  breadcrumbs?: ReactNode;
  actions?: ReactNode;
}) => (
  <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
    <div>
      {breadcrumbs}
      {eyebrow && <div className="eyebrow mt-5">{eyebrow}</div>}
      <h1 className="page-title mt-3">{title}</h1>
      <p className="lead-copy mt-5">{description}</p>
    </div>
    {actions && <div className="flex flex-wrap gap-3 lg:justify-end">{actions}</div>}
  </header>
);

export const PageSection = ({
  children,
  className,
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) => (
  <section className={cn('section-grid', className)} aria-labelledby={labelledBy}>
    {children}
  </section>
);

export const SectionHeader = ({
  eyebrow,
  title,
  description,
  action,
  id,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  id?: string;
}) => (
  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
    <div>
      {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
      <h2 id={id} className="section-title">
        {title}
      </h2>
      {description && (
        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{description}</p>
      )}
    </div>
    {action}
  </div>
);

export const NextAction = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <section
    className={cn('rounded-2xl bg-[var(--color-surface-strong)] p-6 text-white md:p-10', className)}
  >
    {children}
  </section>
);
