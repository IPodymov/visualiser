import { BookOpen, CalendarRange, Clock3, WalletCards } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import type { Discipline } from '../../types/plan';

const formatValue = (value: number | null | undefined, unit = '') => value ? `${value}${unit}` : '—';

export const DisciplineTable = ({ disciplines }: { disciplines: Discipline[] }) => (
  <>
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Дисциплина</TableHead>
            <TableHead>Модуль</TableHead>
            <TableHead>Контроль</TableHead>
            <TableHead className="text-right">Часы</TableHead>
            <TableHead className="text-right">ЗЕТ</TableHead>
            <TableHead className="text-right">Л / П / Лаб</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {disciplines.map((discipline) => (
            <TableRow key={`${discipline.id}-${discipline.name}-${discipline.semester ?? 0}`}>
              <TableCell className="font-medium">{discipline.name}</TableCell>
              <TableCell className="max-w-64 text-muted-foreground">{discipline.module}</TableCell>
              <TableCell>{discipline.controlForm || 'Не указано'}</TableCell>
              <TableCell className="text-right">{formatValue(discipline.hours)}</TableCell>
              <TableCell className="text-right">{formatValue(discipline.credits)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatValue(discipline.lectureHours)} / {formatValue(discipline.practiceHours)} / {formatValue(discipline.labHours)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    <div className="grid gap-3 md:hidden">
      {disciplines.map((discipline) => (
        <article key={`${discipline.id}-${discipline.name}-${discipline.semester ?? 0}`} className="rounded-lg border border-border bg-card p-4">
          <h4 className="font-semibold leading-6 text-foreground">{discipline.name}</h4>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{discipline.module}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarRange className="h-3.5 w-3.5" />Семестр</dt><dd className="mt-1 font-medium">{discipline.semester ?? '—'}</dd></div>
            <div><dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><BookOpen className="h-3.5 w-3.5" />Контроль</dt><dd className="mt-1 font-medium">{discipline.controlForm || 'Не указано'}</dd></div>
            <div><dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />Нагрузка</dt><dd className="mt-1 font-medium">{discipline.hours || '—'} ч.</dd></div>
            <div><dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><WalletCards className="h-3.5 w-3.5" />ЗЕТ</dt><dd className="mt-1 font-medium">{discipline.credits || '—'}</dd></div>
          </dl>
        </article>
      ))}
    </div>
  </>
);
