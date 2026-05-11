import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import './CompareTable.css';
import type { PlanComparison } from '../../types/plan';

export const CompareTable = ({ comparison }: { comparison: PlanComparison }) => {
  const rows = comparison.commonDisciplines
    .filter((item) => item.differences.length > 0)
    .slice(0, 40);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Дисциплина</TableHead>
          <TableHead>Поле</TableHead>
          <TableHead>{comparison.firstPlan.title}</TableHead>
          <TableHead>{comparison.secondPlan.title}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.flatMap((item) =>
          item.differences.map((difference) => (
            <TableRow key={`${item.name}-${difference.field}`}>
              <TableCell className="font-medium text-white">{item.name}</TableCell>
              <TableCell>{difference.field}</TableCell>
              <TableCell>{String(difference.firstValue ?? '—')}</TableCell>
              <TableCell>{String(difference.secondValue ?? '—')}</TableCell>
            </TableRow>
          )),
        )}
      </TableBody>
    </Table>
  );
};
