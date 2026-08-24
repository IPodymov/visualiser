import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  env: { FIT_DIR: '' },
  parse: vi.fn(),
  validate: vi.fn(),
  prisma: {
    curriculum: { findUnique: vi.fn(), update: vi.fn() },
    faculty: { upsert: vi.fn() },
    $transaction: vi.fn(),
  },
  tx: {
    faculty: { upsert: vi.fn() },
    speciality: { upsert: vi.fn() },
    curriculum: { create: vi.fn() },
    discipline: { upsert: vi.fn() },
    curriculumDiscipline: { create: vi.fn() },
  },
}));

vi.mock('../config/env', () => ({ env: mocks.env }));
vi.mock('../config/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('../modules/curricula/fit-parser', () => ({ parseCurriculumWorkbook: mocks.parse }));
vi.mock('../modules/curricula/curriculum-validator.service', () => ({
  curriculumValidatorService: { validateParsed: mocks.validate },
}));

import {
  getFacultyFromFitPath,
  importFitCurricula,
} from '../modules/curricula/fit-importer.service';

const validParsed = (admissionYear = 2025) => ({
  specialityCode: '09.03.04',
  specialityName: 'Программная инженерия',
  admissionYear,
  educationLevel: 'Бакалавриат',
  educationForm: 'Очная',
  profileName: 'Разработка ПО',
  disciplines: [
    {
      name: 'Алгоритмы',
      externalDisciplineCode: 'Б1.1',
      semesterNumber: 1,
      controlForm: 'Экзамен',
      blockName: 'Блок 1',
      partName: 'Обязательная часть',
      moduleName: 'Модуль',
      recordType: 'Дисциплина',
      totalHours: 144,
      credits: 4,
      lectureHours: 36,
      practiceHours: 18,
      labHours: 18,
      independentHours: 72,
    },
  ],
});

const validValidation = {
  isValid: true,
  errors: [],
  warnings: [],
  stats: {
    disciplinesCount: 1,
    semestersCount: 1,
    disciplinesWithoutSemester: 0,
    disciplinesWithoutHours: 0,
    duplicateDisciplineRows: 0,
  },
};

describe('FIT importer', () => {
  let root: string;
  const previousAdmissionYear = process.env.FIT_IMPORT_ADMISSION_YEAR;

  beforeEach(() => {
    vi.clearAllMocks();
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'eduplan-fit-import-'));
    mocks.env.FIT_DIR = root;
    delete process.env.FIT_IMPORT_ADMISSION_YEAR;
    mocks.parse.mockReturnValue(validParsed());
    mocks.validate.mockReturnValue(validValidation);
    mocks.prisma.curriculum.findUnique.mockResolvedValue(null);
    mocks.prisma.faculty.upsert.mockResolvedValue({ id: 10 });
    mocks.tx.faculty.upsert.mockResolvedValue({ id: 10 });
    mocks.tx.speciality.upsert.mockResolvedValue({ id: 20 });
    mocks.tx.curriculum.create.mockResolvedValue({ id: 30 });
    mocks.tx.discipline.upsert.mockResolvedValue({ id: 40 });
    mocks.tx.curriculumDiscipline.create.mockResolvedValue({ id: 50 });
    mocks.prisma.$transaction.mockImplementation(async (callback: (tx: typeof mocks.tx) => unknown) =>
      callback(mocks.tx),
    );
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
    if (previousAdmissionYear === undefined) delete process.env.FIT_IMPORT_ADMISSION_YEAR;
    else process.env.FIT_IMPORT_ADMISSION_YEAR = previousAdmissionYear;
  });

  it('derives stable faculty identities from FIT directory layouts', () => {
    expect(getFacultyFromFitPath('/plans/no-year/plan.xlsx')).toEqual({
      name: 'Университет',
      slug: 'university',
    });
    expect(getFacultyFromFitPath('/plans/2025/фит/plan.xlsx')).toEqual({ name: 'ФИТ', slug: 'fit' });
    expect(getFacultyFromFitPath('/plans/2025/фэиу/plan.xlsx')).toEqual({ name: 'ФЭиУ', slug: 'feiu' });
    expect(getFacultyFromFitPath('/plans/2025/transportnyy-fakultet/plan.xlsx')).toEqual({
      name: 'Транспортный факультет',
      slug: 'transportnyy-fakultet',
    });
    expect(getFacultyFromFitPath('/plans/2025/new-digital-school/plan.xlsx')).toEqual({
      name: 'New Digital School',
      slug: 'new-digital-school',
    });
  });

  it('returns an empty result for missing directories and parses admission-year settings', async () => {
    mocks.env.FIT_DIR = `${path.join(root, 'missing-one')}, ${path.join(root, 'missing-two')}`;

    const withoutYear = await importFitCurricula();
    expect(withoutYear).toMatchObject({ totalFiles: 0, targetAdmissionYear: undefined });

    process.env.FIT_IMPORT_ADMISSION_YEAR = 'invalid';
    const invalidYear = await importFitCurricula();
    expect(invalidYear.targetAdmissionYear).toBeUndefined();

    process.env.FIT_IMPORT_ADMISSION_YEAR = ' 2025 ';
    const withYear = await importFitCurricula();
    expect(withYear.targetAdmissionYear).toBe(2025);
  });

  it('recurses through workbooks and records ignored, skipped, imported and failed outcomes', async () => {
    const directory = path.join(root, '2025', 'fit', 'nested');
    fs.mkdirSync(directory, { recursive: true });
    const names = [
      'a-ignored.xlsx',
      'aa-ignored-unknown.xlsx',
      'b-existing-same.XLSX',
      'c-existing-move.xlsm',
      'd-invalid.xls',
      'e-import.xlsx',
      'f-error.xlsx',
      'g-unknown-error.xlsx',
    ];
    names.forEach((name, index) => fs.writeFileSync(path.join(directory, name), `file-${index}`));
    fs.writeFileSync(path.join(directory, '~$temporary.xlsx'), 'ignored');
    fs.writeFileSync(path.join(directory, 'notes.txt'), 'ignored');
    process.env.FIT_IMPORT_ADMISSION_YEAR = '2025';

    mocks.parse.mockImplementation((filePath: string) => {
      const name = path.basename(filePath);
      if (name === 'a-ignored.xlsx') return validParsed(2024);
      if (name === 'aa-ignored-unknown.xlsx') return { ...validParsed(), admissionYear: undefined };
      if (name === 'f-error.xlsx') throw new Error('Parser failed');
      if (name === 'g-unknown-error.xlsx') throw 'unknown failure';
      return validParsed();
    });
    mocks.prisma.curriculum.findUnique
      .mockResolvedValueOnce({ id: 1, facultyId: 10 })
      .mockResolvedValueOnce({ id: 2, facultyId: 99 })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mocks.prisma.faculty.upsert
      .mockResolvedValueOnce({ id: 10 })
      .mockResolvedValueOnce({ id: 10 });
    mocks.validate
      .mockReturnValueOnce({ ...validValidation, isValid: false, errors: [{ code: 'INVALID' }] })
      .mockReturnValueOnce(validValidation);

    const result = await importFitCurricula();

    expect(result).toMatchObject({
      totalFiles: 8,
      ignored: 2,
      skipped: 2,
      imported: 1,
      failed: 3,
    });
    expect(result.items.map((item) => item.status)).toEqual([
      'ignored',
      'ignored',
      'skipped',
      'skipped',
      'failed',
      'imported',
      'failed',
      'failed',
    ]);
    expect(result.items[0].reason).toContain('does not match 2025');
    expect(result.items[1].reason).toContain('Admission year unknown');
    expect(result.items[6].reason).toBe('Parser failed');
    expect(result.items[7].reason).toBe('Unknown error');
    expect(mocks.prisma.curriculum.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { facultyId: 10 },
    });
    expect(mocks.tx.curriculum.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        specialityId: 20,
        facultyId: 10,
        sourceFileName: 'e-import.xlsx',
      }),
    });
    expect(mocks.tx.curriculumDiscipline.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        curriculumId: 30,
        disciplineId: 40,
        independentHours: 72,
      }),
    });
  });

  it('propagates unexpected directory read errors', async () => {
    const fileInsteadOfDirectory = path.join(root, 'not-a-directory');
    fs.writeFileSync(fileInsteadOfDirectory, 'content');
    mocks.env.FIT_DIR = fileInsteadOfDirectory;

    await expect(importFitCurricula()).rejects.toMatchObject({ code: 'ENOTDIR' });
  });
});
