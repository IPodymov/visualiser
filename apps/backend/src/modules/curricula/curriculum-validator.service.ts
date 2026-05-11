import type { ParsedCurriculum, ParsedCurriculumDiscipline } from './fit-parser';

export type CurriculumValidationIssue = {
  code: string;
  message: string;
  path?: string;
};

export type CurriculumValidationResult = {
  isValid: boolean;
  errors: CurriculumValidationIssue[];
  warnings: CurriculumValidationIssue[];
  stats: {
    disciplinesCount: number;
    semestersCount: number;
    disciplinesWithoutSemester: number;
    disciplinesWithoutHours: number;
    duplicateDisciplineRows: number;
  };
};

type StoredCurriculum = {
  speciality: {
    code: string;
    name: string;
  };
  admissionYear: number | null;
  educationLevel: string | null;
  educationForm: string | null;
  profileName: string | null;
  disciplines: StoredCurriculumDiscipline[];
};

type StoredCurriculumDiscipline = {
  discipline: {
    name: string;
  };
  externalDisciplineCode: string | null;
  semesterNumber: number | null;
  controlForm: string | null;
  totalHours: number | null;
  credits: { toString(): string } | number | string | null;
  lectureHours: number | null;
  practiceHours: number | null;
  labHours: number | null;
};

const CURRENT_YEAR = new Date().getFullYear();
const MIN_ADMISSION_YEAR = 1990;
const MAX_ADMISSION_YEAR = CURRENT_YEAR + 2;
const MAX_SEMESTER_NUMBER = 12;
const MAX_REASONABLE_HOURS = 5000;
const MAX_REASONABLE_CREDITS = 300;

const normalized = (value: string | null | undefined) => value?.trim().toLowerCase().replace(/\s+/g, ' ');

const issue = (code: string, message: string, path?: string): CurriculumValidationIssue => ({
  code,
  message,
  path,
});

const buildStats = (disciplines: ParsedCurriculumDiscipline[]) => {
  const semesters = new Set(
    disciplines
      .map((discipline) => discipline.semesterNumber)
      .filter((semester): semester is number => typeof semester === 'number'),
  );
  const duplicateKeys = new Set<string>();
  const seenKeys = new Set<string>();
  let duplicateDisciplineRows = 0;

  for (const discipline of disciplines) {
    const key = [
      normalized(discipline.name),
      discipline.semesterNumber ?? '',
      normalized(discipline.externalDisciplineCode),
    ].join('|');

    if (seenKeys.has(key) && !duplicateKeys.has(key)) {
      duplicateDisciplineRows += 1;
      duplicateKeys.add(key);
    }
    seenKeys.add(key);
  }

  return {
    disciplinesCount: disciplines.length,
    semestersCount: semesters.size,
    disciplinesWithoutSemester: disciplines.filter((discipline) => !discipline.semesterNumber).length,
    disciplinesWithoutHours: disciplines.filter((discipline) => !discipline.totalHours).length,
    duplicateDisciplineRows,
  };
};

export class CurriculumValidatorService {
  validateParsed(curriculum: ParsedCurriculum): CurriculumValidationResult {
    const errors: CurriculumValidationIssue[] = [];
    const warnings: CurriculumValidationIssue[] = [];

    if (!curriculum.specialityCode || curriculum.specialityCode === 'UNKNOWN') {
      errors.push(issue('SPECIALITY_CODE_REQUIRED', 'Speciality code is required', 'specialityCode'));
    }

    if (!curriculum.specialityName || curriculum.specialityName === 'Unknown speciality') {
      errors.push(issue('SPECIALITY_NAME_REQUIRED', 'Speciality name is required', 'specialityName'));
    }

    if (
      curriculum.admissionYear &&
      (curriculum.admissionYear < MIN_ADMISSION_YEAR || curriculum.admissionYear > MAX_ADMISSION_YEAR)
    ) {
      errors.push(
        issue(
          'ADMISSION_YEAR_OUT_OF_RANGE',
          `Admission year must be between ${MIN_ADMISSION_YEAR} and ${MAX_ADMISSION_YEAR}`,
          'admissionYear',
        ),
      );
    }

    if (!curriculum.admissionYear) {
      warnings.push(issue('ADMISSION_YEAR_MISSING', 'Admission year was not detected', 'admissionYear'));
    }

    if (curriculum.disciplines.length === 0) {
      errors.push(issue('DISCIPLINES_REQUIRED', 'Curriculum must contain at least one discipline', 'disciplines'));
    }

    curriculum.disciplines.forEach((discipline, index) => {
      this.validateDiscipline(discipline, index, errors, warnings);
    });

    const stats = buildStats(curriculum.disciplines);
    if (stats.duplicateDisciplineRows > 0) {
      warnings.push(
        issue(
          'DUPLICATE_DISCIPLINE_ROWS',
          `Detected ${stats.duplicateDisciplineRows} duplicated discipline row group(s)`,
          'disciplines',
        ),
      );
    }

    if (stats.disciplinesWithoutSemester > 0) {
      warnings.push(
        issue(
          'SEMESTERS_PARTIALLY_MISSING',
          `${stats.disciplinesWithoutSemester} discipline row(s) do not have semester number`,
          'disciplines',
        ),
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats,
    };
  }

  validateStored(curriculum: StoredCurriculum): CurriculumValidationResult {
    return this.validateParsed({
      specialityCode: curriculum.speciality.code,
      specialityName: curriculum.speciality.name,
      admissionYear: curriculum.admissionYear ?? undefined,
      educationLevel: curriculum.educationLevel ?? undefined,
      educationForm: curriculum.educationForm ?? undefined,
      profileName: curriculum.profileName ?? undefined,
      disciplines: curriculum.disciplines.map((item: StoredCurriculumDiscipline) => ({
        name: item.discipline.name,
        externalDisciplineCode: item.externalDisciplineCode ?? undefined,
        semesterNumber: item.semesterNumber ?? undefined,
        controlForm: item.controlForm ?? undefined,
        totalHours: item.totalHours ?? undefined,
        credits: item.credits ? Number(item.credits) : undefined,
        lectureHours: item.lectureHours ?? undefined,
        practiceHours: item.practiceHours ?? undefined,
        labHours: item.labHours ?? undefined,
      })),
    });
  }

  private validateDiscipline(
    discipline: ParsedCurriculumDiscipline,
    index: number,
    errors: CurriculumValidationIssue[],
    warnings: CurriculumValidationIssue[],
  ) {
    const path = `disciplines.${index}`;

    if (!discipline.name?.trim()) {
      errors.push(issue('DISCIPLINE_NAME_REQUIRED', 'Discipline name is required', `${path}.name`));
    }

    if (
      discipline.semesterNumber &&
      (discipline.semesterNumber < 1 || discipline.semesterNumber > MAX_SEMESTER_NUMBER)
    ) {
      errors.push(
        issue(
          'SEMESTER_OUT_OF_RANGE',
          `Semester number must be between 1 and ${MAX_SEMESTER_NUMBER}`,
          `${path}.semesterNumber`,
        ),
      );
    }

    for (const [field, value] of Object.entries({
      totalHours: discipline.totalHours,
      lectureHours: discipline.lectureHours,
      practiceHours: discipline.practiceHours,
      labHours: discipline.labHours,
    })) {
      if (value !== undefined && value < 0) {
        errors.push(issue('NEGATIVE_HOURS', `${field} cannot be negative`, `${path}.${field}`));
      }
      if (value !== undefined && value > MAX_REASONABLE_HOURS) {
        warnings.push(
          issue('HOURS_UNUSUALLY_HIGH', `${field} looks unusually high`, `${path}.${field}`),
        );
      }
    }

    if (discipline.credits !== undefined && discipline.credits < 0) {
      errors.push(issue('NEGATIVE_CREDITS', 'Credits cannot be negative', `${path}.credits`));
    }

    if (discipline.credits !== undefined && discipline.credits > MAX_REASONABLE_CREDITS) {
      warnings.push(issue('CREDITS_UNUSUALLY_HIGH', 'Credits look unusually high', `${path}.credits`));
    }

    const contactHours =
      (discipline.lectureHours ?? 0) + (discipline.practiceHours ?? 0) + (discipline.labHours ?? 0);
    if (discipline.totalHours !== undefined && contactHours > discipline.totalHours) {
      warnings.push(
        issue(
          'CONTACT_HOURS_EXCEED_TOTAL',
          'Lecture, practice and lab hours exceed total hours',
          path,
        ),
      );
    }
  }
}

export const curriculumValidatorService = new CurriculumValidatorService();
