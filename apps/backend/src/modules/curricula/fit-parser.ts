import * as path from 'node:path';
import * as XLSX from 'xlsx';

export type ParsedCurriculumDiscipline = {
  name: string;
  externalDisciplineCode?: string;
  semesterNumber?: number;
  controlForm?: string;
  blockName?: string;
  partName?: string;
  moduleName?: string;
  recordType?: string;
  totalHours?: number;
  credits?: number;
  lectureHours?: number;
  practiceHours?: number;
  labHours?: number;
  independentHours?: number;
};

export type ParsedCurriculum = {
  specialityCode: string;
  specialityName: string;
  admissionYear?: number;
  educationLevel?: string;
  educationForm?: string;
  profileName?: string;
  disciplines: ParsedCurriculumDiscipline[];
};

const normalize = (value: unknown) => String(value ?? '').trim();

const normalizeHeader = (value: unknown) =>
  normalize(value)
    .toLowerCase()
    .replaceAll('\n', ' ')
    .replace(/\s+/g, ' ');

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = normalize(value).replace(',', '.').match(/\d+(\.\d+)?/);
  return normalized ? Number(normalized[0]) : undefined;
};

const findValueNear = (rows: unknown[][], patterns: RegExp[], options?: { exact?: boolean }) => {
  for (const row of rows) {
    for (let index = 0; index < row.length; index += 1) {
      const cell = normalize(row[index]);
      const matches = options?.exact
        ? patterns.some((pattern) => pattern.test(normalizeHeader(cell)))
        : patterns.some((pattern) => pattern.test(cell));
      if (matches) {
        const right = normalize(row[index + 1]);
        const sameCell = cell.split(':').slice(1).join(':').trim();
        return right || sameCell || undefined;
      }
    }
  }
  return undefined;
};

const inferMetadata = (rows: unknown[][], filePath: string) => {
  const fileBaseName = path.basename(filePath, path.extname(filePath));
  const allText = rows.flat().map(normalize).join(' ');
  const code =
    findValueNear(rows, [/^код специальности$/, /^направление.*код$/], { exact: true }) ??
    allText.match(/\b\d{2}\.\d{2}\.\d{2}\b/)?.[0] ??
    fileBaseName.match(/\b\d{2}\.\d{2}\.\d{2}\b/)?.[0] ??
    'UNKNOWN';

  const specialityName =
    findValueNear(rows, [/^направление \(специальность\)$/, /^специальность$/, /^направление подготовки$/], {
      exact: true,
    }) ??
    fileBaseName.replace(code, '').replace(/[_-]+/g, ' ').trim() ??
    'Unknown speciality';

  return {
    specialityCode: code,
    specialityName: specialityName || 'Unknown speciality',
    admissionYear:
      toNumber(findValueNear(rows, [/год\s+поступления/i, /год\s+набора/i])) ??
      toNumber(fileBaseName.match(/\b20\d{2}\b/)?.[0]),
    educationLevel: findValueNear(rows, [/^уровень образования$/, /^уровень$/, /^квалификация$/], { exact: true }),
    educationForm: findValueNear(rows, [/форма\s+обучения/i]),
    profileName: findValueNear(rows, [/профиль/i, /специализация/i]),
  };
};

const findHeaderRowIndex = (rows: unknown[][]) =>
  rows.findIndex((row) => {
    const headers = row.map(normalizeHeader);
    return (
      headers.some((header) => /дисциплин|предмет|модул/.test(header)) &&
      headers.some((header) => /час|зет|зачет|кредит|семестр/.test(header))
    );
  });

const findIndex = (headers: string[], patterns: RegExp[]) =>
  headers.findIndex((header) => patterns.some((pattern) => pattern.test(header)));

const semesterWords = new Map([
  ['первый', 1],
  ['первом', 1],
  ['второй', 2],
  ['втором', 2],
  ['третий', 3],
  ['третьем', 3],
  ['четвертый', 4],
  ['четвертом', 4],
  ['четвертый', 4],
  ['пятый', 5],
  ['пятом', 5],
  ['шестой', 6],
  ['шестом', 6],
  ['седьмой', 7],
  ['седьмом', 7],
  ['восьмой', 8],
  ['восьмом', 8],
  ['девятый', 9],
  ['девятом', 9],
  ['десятый', 10],
  ['десятом', 10],
  ['одиннадцатый', 11],
  ['одиннадцатом', 11],
  ['двенадцатый', 12],
  ['двенадцатом', 12],
]);

const toSemesterNumber = (value: unknown) => {
  const number = toNumber(value);
  if (number) return Math.trunc(number);

  const text = normalizeHeader(value).replace('ё', 'е');
  for (const [word, semester] of semesterWords) {
    if (text.includes(word)) return semester;
  }
  return undefined;
};

const isControlLoad = (value: string) =>
  /экзамен|зач[её]т|курсов|контрольн|аттеста|защита|собеседован|просмотр/i.test(value);

const addUnique = (values: string[], value?: string) => {
  if (value && !values.includes(value)) values.push(value);
};

const sum = (left?: number, right?: number) => {
  if (right === undefined) return left;
  return Math.round(((left ?? 0) + right) * 100) / 100;
};

const parseOneCRows = (rows: unknown[][]): ParsedCurriculumDiscipline[] | undefined => {
  const headerRowIndex = rows.findIndex((row) => {
    const headers = row.map(normalizeHeader);
    return (
      headers.includes('дисциплина') &&
      headers.includes('период контроля') &&
      headers.includes('нагрузка') &&
      headers.includes('количество')
    );
  });

  if (headerRowIndex < 0) return undefined;

  const headers = rows[headerRowIndex].map(normalizeHeader);
  const indexes = {
    block: findIndex(headers, [/^блок$/]),
    code: findIndex(headers, [/^шифр$/, /^код$/, /индекс/]),
    part: findIndex(headers, [/^часть$/]),
    module: findIndex(headers, [/^модуль$/]),
    recordType: findIndex(headers, [/^тип записи$/]),
    name: findIndex(headers, [/^дисциплина$/]),
    semester: findIndex(headers, [/^период контроля$/, /семестр/]),
    load: findIndex(headers, [/^нагрузка$/]),
    amount: findIndex(headers, [/^количество$/]),
    credits: findIndex(headers, [/^зет$/, /зачетн/, /кредит/]),
  };

  const grouped = new Map<
    string,
    ParsedCurriculumDiscipline & { controlForms: string[] }
  >();

  for (const row of rows.slice(headerRowIndex + 1)) {
    const name = normalize(row[indexes.name]);
    const semesterNumber = toSemesterNumber(row[indexes.semester]);
    const load = indexes.load >= 0 ? normalize(row[indexes.load]) : '';
    const amount = indexes.amount >= 0 ? toNumber(row[indexes.amount]) : undefined;
    const credits = indexes.credits >= 0 ? toNumber(row[indexes.credits]) : undefined;

    if (!name || name.length <= 2 || /итого|всего/i.test(name) || !semesterNumber) continue;

    const externalDisciplineCode = indexes.code >= 0 ? normalize(row[indexes.code]) || undefined : undefined;
    const key = [externalDisciplineCode ?? '', name, semesterNumber].join('|');
    const current =
      grouped.get(key) ??
      ({
        name,
        externalDisciplineCode,
        semesterNumber,
        blockName: indexes.block >= 0 ? normalize(row[indexes.block]) || undefined : undefined,
        partName: indexes.part >= 0 ? normalize(row[indexes.part]) || undefined : undefined,
        moduleName: indexes.module >= 0 ? normalize(row[indexes.module]) || undefined : undefined,
        recordType: indexes.recordType >= 0 ? normalize(row[indexes.recordType]) || undefined : undefined,
        controlForms: [],
      } satisfies ParsedCurriculumDiscipline & { controlForms: string[] });

    if (isControlLoad(load)) {
      addUnique(current.controlForms, load);
    } else if (amount !== undefined) {
      current.totalHours = sum(current.totalHours, amount);
      current.credits = sum(current.credits, credits);

      if (/лекц/i.test(load)) current.lectureHours = sum(current.lectureHours, amount);
      else if (/лаб/i.test(load)) current.labHours = sum(current.labHours, amount);
      else if (/практ|семинар/i.test(load)) current.practiceHours = sum(current.practiceHours, amount);
      else if (/срс|самостоят/i.test(load)) current.independentHours = sum(current.independentHours, amount);
    }

    grouped.set(key, current);
  }

  return [...grouped.values()].map(({ controlForms, ...discipline }) => ({
    ...discipline,
    controlForm: controlForms.join(', ') || undefined,
  }));
};

const parseRows = (rows: unknown[][]): ParsedCurriculumDiscipline[] => {
  const oneCRows = parseOneCRows(rows);
  if (oneCRows) return oneCRows;

  const headerRowIndex = findHeaderRowIndex(rows);
  if (headerRowIndex < 0) return [];

  const headers = rows[headerRowIndex].map(normalizeHeader);
  const indexes = {
    code: findIndex(headers, [/^код$/, /индекс/, /шифр/]),
    name: findIndex(headers, [/дисциплин/, /предмет/, /модул/]),
    semester: findIndex(headers, [/семестр/, /^сем\./]),
    control: findIndex(headers, [/контрол/, /экзамен/, /зачет/]),
    total: findIndex(headers, [/всего.*час/, /общ.*час/, /^час/]),
    credits: findIndex(headers, [/зет/, /зачетн/, /кредит/]),
    lectures: findIndex(headers, [/лекц/]),
    practice: findIndex(headers, [/практ/, /семинар/]),
    labs: findIndex(headers, [/лаб/]),
  };

  return rows
    .slice(headerRowIndex + 1)
    .map((row) => {
      const name = normalize(row[indexes.name]);
      return {
        name,
        externalDisciplineCode: indexes.code >= 0 ? normalize(row[indexes.code]) || undefined : undefined,
        semesterNumber: indexes.semester >= 0 ? toSemesterNumber(row[indexes.semester]) : undefined,
        controlForm: indexes.control >= 0 ? normalize(row[indexes.control]) || undefined : undefined,
        totalHours: indexes.total >= 0 ? toNumber(row[indexes.total]) : undefined,
        credits: indexes.credits >= 0 ? toNumber(row[indexes.credits]) : undefined,
        lectureHours: indexes.lectures >= 0 ? toNumber(row[indexes.lectures]) : undefined,
        practiceHours: indexes.practice >= 0 ? toNumber(row[indexes.practice]) : undefined,
        labHours: indexes.labs >= 0 ? toNumber(row[indexes.labs]) : undefined,
      };
    })
    .filter((discipline) => discipline.name.length > 2 && !/итого|всего/i.test(discipline.name));
};

export const parseCurriculumWorkbook = (filePath: string): ParsedCurriculum => {
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const rows = workbook.SheetNames.flatMap((sheetName) =>
    XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
      header: 1,
      blankrows: false,
      raw: false,
    }),
  );

  return {
    ...inferMetadata(rows, filePath),
    disciplines: parseRows(rows),
  };
};
