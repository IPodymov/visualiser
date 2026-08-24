import { describe, expect, it } from 'vitest';
import { curriculumValidatorService } from '../modules/curricula/curriculum-validator.service';

describe('curriculum validator', () => {
  it('accepts a structurally valid curriculum', () => {
    const result = curriculumValidatorService.validateParsed({
      specialityCode: '09.03.04',
      specialityName: 'Программная инженерия',
      admissionYear: 2025,
      educationLevel: 'Бакалавриат',
      educationForm: 'Очная',
      disciplines: [
        {
          name: 'Алгоритмы и структуры данных',
          semesterNumber: 1,
          totalHours: 144,
          credits: 4,
          lectureHours: 36,
          practiceHours: 36,
          labHours: 36,
        },
      ],
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.stats.disciplinesCount).toBe(1);
  });

  it('rejects curriculum without speciality code and disciplines', () => {
    const result = curriculumValidatorService.validateParsed({
      specialityCode: 'UNKNOWN',
      specialityName: 'Unknown speciality',
      admissionYear: 2025,
      disciplines: [],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual([
      'SPECIALITY_CODE_REQUIRED',
      'SPECIALITY_NAME_REQUIRED',
      'DISCIPLINES_REQUIRED',
    ]);
  });

  it('rejects impossible semester and negative values', () => {
    const result = curriculumValidatorService.validateParsed({
      specialityCode: '09.03.04',
      specialityName: 'Программная инженерия',
      admissionYear: 2025,
      disciplines: [
        {
          name: 'Bad discipline',
          semesterNumber: 99,
          totalHours: -1,
          credits: -2,
        },
      ],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual([
      'SEMESTER_OUT_OF_RANGE',
      'NEGATIVE_HOURS',
      'NEGATIVE_CREDITS',
    ]);
  });

  it('reports metadata, duplicate, missing-semester and suspicious workload warnings', () => {
    const result = curriculumValidatorService.validateParsed({
      specialityCode: '09.03.04',
      specialityName: 'Программная инженерия',
      admissionYear: 1989,
      disciplines: [
        {
          name: '  ',
          externalDisciplineCode: 'B1',
          semesterNumber: -1,
          totalHours: 6_000,
          lectureHours: 6_001,
          practiceHours: 6_002,
          labHours: 6_003,
          credits: 301,
        },
        { name: 'Проект', externalDisciplineCode: 'B2' },
        { name: 'Проект', externalDisciplineCode: 'B2' },
        { name: 'Проект', externalDisciplineCode: 'B2' },
      ],
    });

    expect(result.errors.map((item) => item.code)).toContain('ADMISSION_YEAR_OUT_OF_RANGE');
    expect(result.errors.map((item) => item.code)).toContain('DISCIPLINE_NAME_REQUIRED');
    expect(result.warnings.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        'HOURS_UNUSUALLY_HIGH',
        'CREDITS_UNUSUALLY_HIGH',
        'CONTACT_HOURS_EXCEED_TOTAL',
        'DUPLICATE_DISCIPLINE_ROWS',
        'SEMESTERS_PARTIALLY_MISSING',
      ]),
    );
    expect(result.stats).toMatchObject({
      duplicateDisciplineRows: 1,
      disciplinesWithoutSemester: 3,
      disciplinesWithoutHours: 3,
    });
  });

  it('warns when admission year is missing and maps nullable stored fields', () => {
    const result = curriculumValidatorService.validateStored({
      speciality: { code: '09.03.04', name: 'Программная инженерия' },
      admissionYear: null,
      educationLevel: null,
      educationForm: null,
      profileName: null,
      disciplines: [
        {
          discipline: { name: 'Алгоритмы' },
          externalDisciplineCode: null,
          semesterNumber: null,
          controlForm: null,
          blockName: null,
          partName: null,
          moduleName: null,
          recordType: null,
          totalHours: null,
          credits: null,
          lectureHours: null,
          practiceHours: null,
          labHours: null,
          independentHours: null,
        },
      ],
    });

    expect(result.isValid).toBe(true);
    expect(result.warnings.map((item) => item.code)).toEqual([
      'ADMISSION_YEAR_MISSING',
      'SEMESTERS_PARTIALLY_MISSING',
    ]);
  });

  it('maps numeric-like stored credits and all optional fields', () => {
    const result = curriculumValidatorService.validateStored({
      speciality: { code: '09.03.04', name: 'Программная инженерия' },
      admissionYear: 2025,
      educationLevel: 'Бакалавриат',
      educationForm: 'Очная',
      profileName: 'Разработка ПО',
      disciplines: [
        {
          discipline: { name: 'Алгоритмы' },
          externalDisciplineCode: 'Б1.1',
          semesterNumber: 1,
          controlForm: 'Экзамен',
          blockName: 'Блок 1',
          partName: 'Обязательная часть',
          moduleName: 'Модуль',
          recordType: 'Дисциплина',
          totalHours: 144,
          credits: { toString: () => '4.5' },
          lectureHours: 36,
          practiceHours: 18,
          labHours: 18,
          independentHours: 72,
        },
      ],
    });

    expect(result).toMatchObject({ isValid: true, errors: [], warnings: [] });
  });

  it('rejects an admission year too far in the future', () => {
    const result = curriculumValidatorService.validateParsed({
      specialityCode: '09.03.04',
      specialityName: 'Программная инженерия',
      admissionYear: 9999,
      disciplines: [{ name: 'Алгоритмы', semesterNumber: 1, totalHours: 36 }],
    });

    expect(result.errors.map((item) => item.code)).toContain('ADMISSION_YEAR_OUT_OF_RANGE');
  });
});
