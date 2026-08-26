import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export type BreadcrumbItem = { label: string; to?: string };

export const Breadcrumbs = ({ items }: { items: BreadcrumbItem[] }) => (
  <nav aria-label="Хлебные крошки">
    <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 && <ChevronRight className="h-4 w-4" aria-hidden="true" />}
          {item.to ? (
            <Link className="hover:text-foreground hover:underline" to={item.to}>
              {item.label}
            </Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);
