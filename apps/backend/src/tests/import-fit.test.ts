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

  it('aggregates 1C workload rows by discipline and semester', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fit-parser-1c-'));
    const filePath = path.join(tmpDir, '09.03.01-2025.xlsx');
    const workbook = XLSX.utils.book_new();
    const meta = XLSX.utils.aoa_to_sheet([
      ['Наименование', 'Содержание'],
      ['Направление (специальность)', 'Информатика и вычислительная техника'],
      ['Код специальности', '09.03.01'],
      ['Профиль (специализация)', 'Системная и программная инженерия'],
      ['Форма обучения', 'Очная'],
      ['Год набора', '2025 - 2026'],
    ]);
    const plan = XLSX.utils.aoa_to_sheet([
      ['Блок', 'Шифр', 'Часть', 'Модуль', 'Тип записи', 'Дисциплина', 'Период контроля', 'Нагрузка', 'Количество', 'Ед. изм.', 'ЗЕТ'],
      ['Блок 1 Дисциплины (модули)', 'Б1.1.1', 'Обязательная часть', 'Модуль 1', 'Обязательная часть', 'Алгоритмы', 'Первый семестр', 'Экзамен', null, 'Часы'],
      ['Блок 1 Дисциплины (модули)', 'Б1.1.1', 'Обязательная часть', 'Модуль 1', 'Обязательная часть', 'Алгоритмы', 'Первый семестр', 'Лекции', '36,00', 'Часы', '1,00'],
      ['Блок 1 Дисциплины (модули)', 'Б1.1.1', 'Обязательная часть', 'Модуль 1', 'Обязательная часть', 'Алгоритмы', 'Первый семестр', 'Практические занятия', '18,00', 'Часы', '0,50'],
      ['Блок 1 Дисциплины (модули)', 'Б1.1.1', 'Обязательная часть', 'Модуль 1', 'Обязательная часть', 'Алгоритмы', 'Первый семестр', 'СРС', '54,00', 'Часы', '1,50'],
      ['Блок 1 Дисциплины (модули)', 'Б1.1.1', 'Обязательная часть', 'Модуль 1', 'Обязательная часть', 'Алгоритмы', 'Второй семестр', 'Зачет', null, 'Часы'],
      ['Блок 1 Дисциплины (модули)', 'Б1.1.1', 'Обязательная часть', 'Модуль 1', 'Обязательная часть', 'Алгоритмы', 'Второй семестр', 'Лабораторные работы', '72,00', 'Часы', '2,00'],
    ]);
    XLSX.utils.book_append_sheet(workbook, meta, 'Лист1');
    XLSX.utils.book_append_sheet(workbook, plan, 'Лист2');
    XLSX.writeFile(workbook, filePath);

    const parsed = parseCurriculumWorkbook(filePath);

    expect(parsed.specialityName).toBe('Информатика и вычислительная техника');
    expect(parsed.disciplines).toHaveLength(2);
    expect(parsed.disciplines[0]).toMatchObject({
      name: 'Алгоритмы',
      semesterNumber: 1,
      controlForm: 'Экзамен',
      totalHours: 108,
      credits: 3,
      lectureHours: 36,
      practiceHours: 18,
      independentHours: 54,
      moduleName: 'Модуль 1',
    });
    expect(parsed.disciplines[1]).toMatchObject({
      semesterNumber: 2,
      controlForm: 'Зачет',
      totalHours: 72,
      credits: 2,
      labHours: 72,
    });
  });
});
