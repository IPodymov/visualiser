import './CompareTable.css';
import { ComparisonIndicator } from '../ComparisonIndicator/ComparisonIndicator';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import type { PlanComparison } from '../../types/plan';

const fieldMeta: Record<string, { label: string; explanation: string }> = {
  semesterNumber: {
    label: 'Семестр',
    explanation: 'Дисциплина появляется в программах в разное время.',
  },
  controlForm: {
    label: 'Форма контроля',
    explanation: 'Результат по дисциплине проверяется разными способами.',
  },
  totalHours: {
    label: 'Всего часов',
    explanation: 'На дисциплину отведён разный объём учебной работы.',
  },
  credits: {
    label: 'ЗЕТ',
    explanation: 'Дисциплина имеет разный вес в общей трудоёмкости программ.',
  },
  lectureHours: {
    label: 'Лекции',
    explanation: 'Отличается объём теоретических аудиторных занятий.',
  },
  practiceHours: {
    label: 'Практики',
    explanation: 'Отличается объём практических аудиторных занятий.',
  },
  labHours: { label: 'Лабораторные', explanation: 'Отличается объём лабораторной работы.' },
  independentHours: {
    label: 'Самостоятельная работа',
    explanation: 'Отличается объём работы вне аудиторных занятий.',
  },
};

const numericFields = new Set([
  'semesterNumber',
  'totalHours',
  'credits',
  'lectureHours',
  'practiceHours',
  'labHours',
  'independentHours',
]);

const isMissing = (value: unknown) => value === null || value === undefined || value === '';

const semesterUnit = (value: number) => {
  const remainder100 = value % 100;
  const remainder10 = value % 10;
  if (remainder100 >= 11 && remainder100 <= 14) return 'семестров';
  if (remainder10 === 1) return 'семестр';
  if (remainder10 >= 2 && remainder10 <= 4) return 'семестра';
  return 'семестров';
};

const formatValue = (field: string, value: unknown) => {
  if (value === null || value === undefined || value === '') return 'не указано';
  if (field === 'semesterNumber') return `${value} семестр`;
  if (field === 'totalHours' || field.endsWith('Hours')) return `${value} ч.`;
  if (field === 'credits') return `${value} ЗЕТ`;
  return String(value);
};

const Direction = ({
  field,
  firstValue,
  secondValue,
}: {
  field: string;
  firstValue: unknown;
  secondValue: unknown;
}) => {
  if (isMissing(firstValue) && isMissing(secondValue)) {
    return <ComparisonIndicator state="equal">Оба значения не указаны</ComparisonIndicator>;
  }
  if (isMissing(firstValue)) {
    return <ComparisonIndicator state="onlyB">Указано только в программе B</ComparisonIndicator>;
  }
  if (isMissing(secondValue)) {
    return <ComparisonIndicator state="onlyA">Указано только в программе A</ComparisonIndicator>;
  }
  if (!numericFields.has(field)) return <Badge variant="warning">Разные значения</Badge>;
  const first = Number(firstValue);
  const second = Number(secondValue);
  if (!Number.isFinite(first) || !Number.isFinite(second)) {
    return <Badge variant="warning">Разные значения</Badge>;
  }
  if (first === second) return <ComparisonIndicator state="equal">Одинаково</ComparisonIndicator>;
  if (field === 'semesterNumber') {
    const difference = Math.abs(first - second);
    return first < second ? (
      <ComparisonIndicator state="less">
        В программе A на {difference} {semesterUnit(difference)} раньше
      </ComparisonIndicator>
    ) : (
      <ComparisonIndicator state="more">
        В программе A на {difference} {semesterUnit(difference)} позже
      </ComparisonIndicator>
    );
  }
  return first > second ? (
    <ComparisonIndicator state="more">В программе A больше</ComparisonIndicator>
  ) : (
    <ComparisonIndicator state="less">В программе A меньше</ComparisonIndicator>
  );
};

export const CompareTable = ({ comparison }: { comparison: PlanComparison }) => {
  const rows = comparison.commonDisciplines.filter((item) => item.differences.length > 0);

  if (!rows.length)
    return (
      <div className="compare-table__empty">
        У общих дисциплин не найдено различий по семестру, форме контроля и видам нагрузки.
      </div>
    );

  const flatRows = rows.flatMap((item) =>
    item.differences.map((difference) => ({ discipline: item.name, ...difference })),
  );

  return (
    <>
      <div className="hidden lg:block">
        <Table className="compare-table">
          <TableHeader>
            <TableRow>
              <TableHead>Дисциплина</TableHead>
              <TableHead>Параметр</TableHead>
              <TableHead>Программа A</TableHead>
              <TableHead>Программа B</TableHead>
              <TableHead>Разница</TableHead>
              <TableHead>Как читать</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flatRows.map((row) => {
              const meta = fieldMeta[row.field] ?? {
                label: row.field,
                explanation: 'Параметр различается в двух учебных планах.',
              };
              return (
                <TableRow key={`${row.discipline}-${row.field}`}>
                  <TableCell className="font-medium">{row.discipline}</TableCell>
                  <TableCell>
                    <Badge>{meta.label}</Badge>
                  </TableCell>
                  <TableCell>{formatValue(row.field, row.firstValue)}</TableCell>
                  <TableCell>{formatValue(row.field, row.secondValue)}</TableCell>
                  <TableCell>
                    <Direction
                      field={row.field}
                      firstValue={row.firstValue}
                      secondValue={row.secondValue}
                    />
                  </TableCell>
                  <TableCell className="max-w-64 text-sm text-muted-foreground">
                    {meta.explanation}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="compare-table__mobile lg:hidden">
        {rows.map((item) => (
          <article key={item.name}>
            <h4>{item.name}</h4>
            {item.differences.map((difference) => {
              const meta = fieldMeta[difference.field] ?? {
                label: difference.field,
                explanation: 'Параметр различается.',
              };
              return (
                <div key={difference.field} className="compare-table__mobile-diff">
                  <div className="compare-table__mobile-label">
                    <Badge>{meta.label}</Badge>
                    <Direction
                      field={difference.field}
                      firstValue={difference.firstValue}
                      secondValue={difference.secondValue}
                    />
                  </div>
                  <dl>
                    <div>
                      <dt>Программа A</dt>
                      <dd>{formatValue(difference.field, difference.firstValue)}</dd>
                    </div>
                    <div>
                      <dt>Программа B</dt>
                      <dd>{formatValue(difference.field, difference.secondValue)}</dd>
                    </div>
                  </dl>
                  <p>{meta.explanation}</p>
                </div>
              );
            })}
          </article>
        ))}
      </div>
    </>
  );
};
