import type { ReactNode } from 'react';
import { Card, CardContent } from '../ui/card';

type Props = {
  icon: ReactNode;
  label: string;
  value: string | number;
};

export const StatsCard = ({ icon, label, value }: Props) => (
  <Card className="overflow-hidden">
    <CardContent className="flex items-center gap-4 p-5">
      <div className="grid h-11 w-11 place-items-center rounded-md bg-gradient-to-br from-sky-400/20 to-violet-500/20 text-sky-200">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-sm text-slate-400">{label}</div>
      </div>
    </CardContent>
  </Card>
);
