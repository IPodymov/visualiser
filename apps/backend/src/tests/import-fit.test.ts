import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import { parseCurriculumWorkbook } from '../modules/curricula/fit-parser';

describe('FIT parser', () => {
  it('parses metadata and discipline rows from xlsx', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fit-parser-'));
    const filePath = path.join(tmpDir, '09.03.04-2024.xlsx');
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Код специальности', '09.03.04'],
      ['Специальность', 'Программная инженерия'],
      ['Год поступления', '2024'],
      [],
      ['Индекс', 'Дисциплина', 'Семестр', 'Форма контроля', 'Всего часов', 'ЗЕТ'],
      ['Б1.О.01', 'Алгоритмы и структуры данных', 1, 'экзамен', 144, 4],
    ]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'План');
    XLSX.writeFile(workbook, filePath);

    const parsed = parseCurriculumWorkbook(filePath);

    expect(parsed.specialityCode).toBe('09.03.04');
    expect(parsed.specialityName).toBe('Программная инженерия');
    expect(parsed.admissionYear).toBe(2024);
    expect(parsed.disciplines).toHaveLength(1);
    expect(parsed.disciplines[0]).toMatchObject({
      name: 'Алгоритмы и структуры данных',
      semesterNumber: 1,
      totalHours: 144,
      credits: 4,
    });
  });
});
