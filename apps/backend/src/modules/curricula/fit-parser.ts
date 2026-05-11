import * as path from 'node:path';
import * as XLSX from 'xlsx';

export type ParsedCurriculumDiscipline = {
  name: string;
  externalDisciplineCode?: string;
  semesterNumber?: number;
  controlForm?: string;
  totalHours?: number;
  credits?: number;
  lectureHours?: number;
  practiceHours?: number;
  labHours?: number;
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

const findValueNear = (rows: unknown[][], patterns: RegExp[]) => {
  for (const row of rows) {
    for (let index = 0; index < row.length; index += 1) {
      const cell = normalize(row[index]);
      if (patterns.some((pattern) => pattern.test(cell))) {
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
    findValueNear(rows, [/код\s+специальности/i, /направление.*код/i]) ??
    allText.match(/\b\d{2}\.\d{2}\.\d{2}\b/)?.[0] ??
    fileBaseName.match(/\b\d{2}\.\d{2}\.\d{2}\b/)?.[0] ??
    'UNKNOWN';

  const specialityName =
    findValueNear(rows, [/специальность/i, /направление подготовки/i]) ??
    fileBaseName.replace(code, '').replace(/[_-]+/g, ' ').trim() ??
    'Unknown speciality';

  return {
    specialityCode: code,
    specialityName: specialityName || 'Unknown speciality',
    admissionYear:
      toNumber(findValueNear(rows, [/год\s+поступления/i, /год\s+набора/i])) ??
      toNumber(fileBaseName.match(/\b20\d{2}\b/)?.[0]),
    educationLevel: findValueNear(rows, [/уровень/i, /квалификация/i]),
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

const parseRows = (rows: unknown[][]): ParsedCurriculumDiscipline[] => {
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
        semesterNumber: indexes.semester >= 0 ? toNumber(row[indexes.semester]) : undefined,
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
