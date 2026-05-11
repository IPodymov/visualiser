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
});
