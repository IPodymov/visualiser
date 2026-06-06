import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import './CompareTable.css';
import type { PlanComparison } from '../../types/plan';

const fieldMeta: Record<string, { label: string; explanation: string }> = {
  semesterNumber: {
    label: 'Семестр',
    explanation:
      'Показывает, когда дисциплина появляется в учебном плане. Более ранний семестр означает, что навык начнут развивать раньше.',
  },
  controlForm: {
    label: 'Форма контроля',
    explanation:
      'Показывает, как будут проверять результат: экзамен, зачет, проект или другая форма аттестации.',
  },
  totalHours: {
    label: 'Всего часов',
    explanation:
      'Показывает общую нагрузку по дисциплине. Больше часов обычно означает более подробное изучение темы.',
  },
  credits: {
    label: 'ЗЕТ',
    explanation:
      'Зачетные единицы отражают вес дисциплины в программе и влияют на общую учебную нагрузку.',
  },
  lectureHours: {
    label: 'Лекции',
    explanation:
      'Больше лекций означает больший акцент на теории, понятиях и объяснении материала преподавателем.',
  },
  practiceHours: {
    label: 'Практики',
    explanation:
      'Больше практик означает больше аудиторного разбора задач, кейсов и упражнений.',
  },
  labHours: {
    label: 'Лабораторные',
    explanation:
      'Больше лабораторных обычно означает больше работы с инструментами, кодом, оборудованием или экспериментами.',
  },
  independentHours: {
    label: 'Самостоятельная работа',
    explanation:
      'Показывает объем работы вне занятий: подготовка, домашние задания, проекты и изучение материалов.',
  },
};

const formatValue = (field: string, value: unknown) => {
  if (value === null || value === undefined || value === '') return 'не указано';
  if (field === 'semesterNumber') return `${value} семестр`;
  if (field === 'totalHours' || field.endsWith('Hours')) return `${value} ч.`;
  if (field === 'credits') return `${value} ЗЕТ`;
  return String(value);
};

export const CompareTable = ({ comparison }: { comparison: PlanComparison }) => {
  const rows = comparison.commonDisciplines
    .filter((item) => item.differences.length > 0)
    .slice(0, 40);

  if (!rows.length) {
    return (
      <div className="compare-table__empty">
        У общих дисциплин не найдено различий по семестру, форме контроля и нагрузке.
      </div>
    );
  }

  return (
    <Table className="compare-table">
      <TableHeader>
        <TableRow>
          <TableHead>Дисциплина</TableHead>
          <TableHead>Что отличается</TableHead>
          <TableHead>{comparison.firstPlan.title}</TableHead>
          <TableHead>{comparison.secondPlan.title}</TableHead>
          <TableHead>Что это значит</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.flatMap((item) =>
          item.differences.map((difference) => {
            const meta = fieldMeta[difference.field] ?? {
              label: difference.field,
              explanation: 'Различие показывает, что дисциплина устроена по-разному в двух планах.',
            };

            return (
            <TableRow key={`${item.name}-${difference.field}`}>
              <TableCell className="font-medium text-white">{item.name}</TableCell>
              <TableCell>
                <span className="compare-table__field">{meta.label}</span>
              </TableCell>
              <TableCell>{formatValue(difference.field, difference.firstValue)}</TableCell>
              <TableCell>{formatValue(difference.field, difference.secondValue)}</TableCell>
              <TableCell className="compare-table__explanation">{meta.explanation}</TableCell>
            </TableRow>
            );
          }),
        )}
      </TableBody>
    </Table>
  );
};
