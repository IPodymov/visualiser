import type { ReactNode } from 'react';
import { FileSearch } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

export const EmptyState = ({
  title,
  text,
  action,
  icon,
}: {
  title: string;
  text: string;
  action?: ReactNode;
  icon?: ReactNode;
}) => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-muted text-primary">
        {icon ?? <FileSearch className="h-7 w-7" />}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
      {action}
    </CardContent>
  </Card>
);
