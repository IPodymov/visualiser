import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import type { Discipline } from '../../types/plan';

export const DisciplineTable = ({ disciplines }: { disciplines: Discipline[] }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Дисциплина</TableHead>
        <TableHead>Модуль</TableHead>
        <TableHead>Семестр</TableHead>
        <TableHead className="text-right">Часы</TableHead>
        <TableHead className="text-right">ЗЕТ</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {disciplines.map((discipline) => (
        <TableRow key={`${discipline.id}-${discipline.name}`}>
          <TableCell className="font-medium text-white">{discipline.name}</TableCell>
          <TableCell>{discipline.module}</TableCell>
          <TableCell>{discipline.semester ?? 'не указан'}</TableCell>
          <TableCell className="text-right">{discipline.hours}</TableCell>
          <TableCell className="text-right">{discipline.credits}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
