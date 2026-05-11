import type { ReactNode } from 'react';
import { FileSearch } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

export const EmptyState = ({ title, text, action }: { title: string; text: string; action?: ReactNode }) => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-md bg-white/10 text-sky-200">
        <FileSearch className="h-7 w-7" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 max-w-md text-sm text-slate-400">{text}</p>
      </div>
      {action}
    </CardContent>
  </Card>
);
