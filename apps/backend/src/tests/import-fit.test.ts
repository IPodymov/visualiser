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

  it('uses filename metadata fallbacks and handles a workbook without a discipline table', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fit-parser-fallback-'));
    const filePath = path.join(tmpDir, '09.04.01-Data-Science-2026.xlsx');
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        ['Уровень образования', 'Магистратура'],
        ['Форма обучения', 'Заочная'],
        ['Год поступления: 2026'],
        ['Профиль'],
      ]),
      'Метаданные',
    );
    XLSX.writeFile(workbook, filePath);

    const parsed = parseCurriculumWorkbook(filePath);

    expect(parsed).toMatchObject({
      specialityCode: '09.04.01',
      specialityName: 'Data Science 2026',
      admissionYear: 2026,
      educationLevel: 'Магистратура',
      educationForm: 'Заочная',
      disciplines: [],
    });
  });

  it('falls back to unknown metadata and filters invalid regular rows', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fit-parser-unknown-'));
    const filePath = path.join(tmpDir, 'UNKNOWN.xlsx');
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        ['Дисциплина', 'Часы'],
        ['AI', 36],
        ['Итого', 72],
        ['Полезная дисциплина', 'нет данных'],
      ]),
      'План',
    );
    XLSX.writeFile(workbook, filePath);

    const parsed = parseCurriculumWorkbook(filePath);

    expect(parsed.specialityCode).toBe('UNKNOWN');
    expect(parsed.specialityName).toBe('Unknown speciality');
    expect(parsed.admissionYear).toBeUndefined();
    expect(parsed.disciplines).toEqual([
      expect.objectContaining({ name: 'Полезная дисциплина', totalHours: undefined }),
    ]);
  });

  it('parses every supported regular workload column', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fit-parser-columns-'));
    const filePath = path.join(tmpDir, '10.05.01-2025.xlsx');
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        [
          'Индекс',
          'Дисциплина',
          'Семестр',
          'Контроль',
          'Всего часов',
          'Кредиты',
          'Лекции',
          'Семинары',
          'Лабораторные',
        ],
        ['Б1.2', 'Защита информации', '3 семестр', 'Экзамен', '144,5', '4,5', 36, 18, 18],
        ['', 'Проектирование систем', 4, '', 72, 2, 18, 18, 0],
      ]),
      'План',
    );
    XLSX.writeFile(workbook, filePath);

    expect(parseCurriculumWorkbook(filePath).disciplines[0]).toMatchObject({
      externalDisciplineCode: 'Б1.2',
      semesterNumber: 3,
      controlForm: 'Экзамен',
      totalHours: 144.5,
      credits: 4.5,
      lectureHours: 36,
      practiceHours: 18,
      labHours: 18,
    });
    expect(parseCurriculumWorkbook(filePath).disciplines[1]).toMatchObject({
      externalDisciplineCode: undefined,
      controlForm: undefined,
      semesterNumber: 4,
    });
  });

  it('skips malformed 1C rows and aggregates duplicate controls and other load types', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fit-parser-1c-branches-'));
    const filePath = path.join(tmpDir, 'branch-cases.xlsx');
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        ['Дисциплина', 'Период контроля', 'Нагрузка', 'Количество'],
        ['', 'Первый семестр', 'Лекции', 10],
        ['AI', 'Первый семестр', 'Лекции', 10],
        ['Итого', 'Первый семестр', 'Лекции', 10],
        ['Алгоритмы', 'неизвестно', 'Лекции', 10],
        ['Алгоритмы', 'Первый семестр', 'Экзамен', null],
        ['Алгоритмы', 'Первый семестр', 'Экзамен', null],
        ['Алгоритмы', 'Первый семестр', 'Практические занятия', 18],
        ['Алгоритмы', 'Первый семестр', 'Самостоятельная работа', 20],
        ['Алгоритмы', 'Первый семестр', 'Иная нагрузка', 5],
        ['Алгоритмы', 'Первый семестр', 'Лекции', null],
      ]),
      'План',
    );
    XLSX.writeFile(workbook, filePath);

    expect(parseCurriculumWorkbook(filePath).disciplines).toEqual([
      expect.objectContaining({
        name: 'Алгоритмы',
        semesterNumber: 1,
        controlForm: 'Экзамен',
        totalHours: 43,
        practiceHours: 18,
        independentHours: 20,
      }),
    ]);
  });

  it('parses a regular table whose evidence is credits rather than total hours', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fit-parser-credit-only-'));
    const filePath = path.join(tmpDir, '09.03.02-credit-only.xlsx');
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        ['Дисциплина', 'ЗЕТ'],
        ['Теория информации', 3],
      ]),
      'План',
    );
    XLSX.writeFile(workbook, filePath);

    expect(parseCurriculumWorkbook(filePath).disciplines[0]).toMatchObject({
      name: 'Теория информации',
      credits: 3,
      totalHours: undefined,
    });
  });

  it('maps blank optional 1C columns to undefined and keeps a workload without control forms', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fit-parser-1c-blank-'));
    const filePath = path.join(tmpDir, '09.03.03-blank.xlsx');
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        ['Блок', 'Шифр', 'Часть', 'Модуль', 'Тип записи', 'Дисциплина', 'Период контроля', 'Нагрузка', 'Количество'],
        ['', '', '', '', '', 'Системный проект', 'Второй семестр', 'Иная нагрузка', 10],
      ]),
      'План',
    );
    XLSX.writeFile(workbook, filePath);

    expect(parseCurriculumWorkbook(filePath).disciplines[0]).toMatchObject({
      name: 'Системный проект',
      externalDisciplineCode: undefined,
      blockName: undefined,
      partName: undefined,
      moduleName: undefined,
      recordType: undefined,
      controlForm: undefined,
      totalHours: 10,
    });
  });
});
