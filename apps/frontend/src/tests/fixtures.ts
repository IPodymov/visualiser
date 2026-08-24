import type { EducationPlan } from '../types/plan';
import type { BackendCurriculum, BackendDiscipline } from '../services/api/planMapper';

export const backendDiscipline = (
  overrides: Partial<BackendDiscipline> = {},
): BackendDiscipline => ({
  curriculumDisciplineId: 1,
  disciplineId: 10,
  name: 'Алгоритмы',
  semesterNumber: 1,
  totalHours: 144,
  credits: 4,
  controlForm: 'Экзамен',
  lectureHours: 36,
  practiceHours: 18,
  labHours: 18,
  independentHours: 72,
  ...overrides,
});

export const backendCurriculum = (
  overrides: Partial<BackendCurriculum> = {},
): BackendCurriculum => ({
  id: 1,
  specialityId: 1,
  admissionYear: 2025,
  educationLevel: 'Бакалавриат',
  educationForm: 'Очная',
  profileName: 'Разработка программного обеспечения',
  sourceFileName: 'plan.xlsx',
  sourceFilePath: '/plans/2025/ФИТ/plan.xlsx',
  uploadedAt: '2025-01-01T00:00:00.000Z',
  faculty: { id: 1, name: 'ФИТ', slug: 'fit' },
  speciality: { id: 1, code: '09.03.04', name: 'Программная инженерия' },
  disciplines: [backendDiscipline()],
  ...overrides,
});

export const plan = (overrides: Partial<EducationPlan> = {}): EducationPlan => ({
  id: 1,
  title: 'Разработка программного обеспечения',
  direction: 'Программная инженерия',
  profile: 'Разработка программного обеспечения',
  facultyId: 1,
  faculty: 'ФИТ',
  level: 'Бакалавриат',
  studyForm: 'Очная',
  year: 2025,
  duration: '4 года',
  description: 'Описание программы',
  totalHours: 144,
  credits: 4,
  semesters: 1,
  competencies: [],
  disciplines: [
    {
      id: 1,
      name: 'Алгоритмы',
      module: 'Блок 1',
      semester: 1,
      hours: 144,
      credits: 4,
      controlForm: 'Экзамен',
      lectureHours: 36,
      practiceHours: 18,
      labHours: 18,
      independentHours: 72,
    },
  ],
  sourceFileName: 'plan.xlsx',
  code: '09.03.04',
  uploadedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});
