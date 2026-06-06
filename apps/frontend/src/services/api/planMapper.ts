import type { EducationPlan, PlanVisualization } from '../../types/plan';
import {
  defaultFaculty,
  defaultModule,
  defaultStudyForm,
  educationLevelLabels,
  sourceFacultyMarkers,
} from '../../constants/curriculum';

export type BackendCurriculum = {
  id: number;
  specialityId: number;
  admissionYear: number | null;
  educationLevel: string | null;
  educationForm: string | null;
  profileName: string | null;
  sourceFileName: string;
  uploadedAt: string;
  speciality: {
    id: number;
    code: string;
    name: string;
  };
  semesters?: Array<{
    number: number | null;
    disciplines: BackendDiscipline[];
  }>;
  disciplines?: BackendDiscipline[];
  visualization?: PlanVisualization;
};

export type BackendDiscipline = {
  curriculumDisciplineId?: number;
  disciplineId?: number;
  id?: number;
  name: string;
  semesterNumber: number | null;
  totalHours: number | null;
  credits: string | number | null;
  controlForm?: string | null;
  blockName?: string | null;
  partName?: string | null;
  moduleName?: string | null;
  recordType?: string | null;
  lectureHours?: number | null;
  practiceHours?: number | null;
  labHours?: number | null;
  independentHours?: number | null;
  classifications?: Array<{
    groupCode: string;
    groupName?: string;
    valueName: string;
  }>;
};

export const levelByCode = (code?: string, fallback?: string | null) => {
  if (fallback) return fallback;
  if (code?.includes('.04.')) return educationLevelLabels.master;
  if (code?.includes('.05.')) return educationLevelLabels.specialist;
  return educationLevelLabels.bachelor;
};

export const facultyFromSource = (source?: string) => {
  if (!source) return defaultFaculty;
  if (source.includes('/')) {
    return source.split('/').find((part) => part.includes('Ф')) ?? defaultFaculty;
  }
  const facultyMarker = sourceFacultyMarkers.find((marker) => source.includes(marker));
  if (facultyMarker) return facultyMarker;
  return defaultFaculty;
};

export const asNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value.replace(',', '.')) || 0;
  return 0;
};

const flattenDisciplines = (curriculum: BackendCurriculum) => {
  if (curriculum.semesters?.length) {
    return curriculum.semesters.flatMap((semester) =>
      semester.disciplines.map((discipline) => ({
        ...discipline,
        semesterNumber: discipline.semesterNumber ?? semester.number,
      })),
    );
  }
  return curriculum.disciplines ?? [];
};

const buildCompetencies = (disciplines: BackendDiscipline[]) => {
  const total = Math.max(disciplines.reduce((sum, item) => sum + (item.totalHours ?? 0), 0), 1);
  const byName = (tokens: string[]) =>
    disciplines
      .filter((item) => tokens.some((token) => item.name.toLowerCase().includes(token)))
      .reduce((sum, item) => sum + (item.totalHours ?? 0), 0);

  const scores = [
    { name: 'Математика' as const, raw: byName(['математ', 'алгебр', 'статист']) },
    { name: 'Программирование' as const, raw: byName(['программ', 'разработ', 'алгоритм', 'web', 'веб']) },
    { name: 'Аналитика' as const, raw: byName(['аналит', 'данн', 'модел']) },
    { name: 'Soft Skills' as const, raw: byName(['команд', 'проект', 'коммуникац', 'менедж']) },
    { name: 'Практика' as const, raw: byName(['практик', 'проект', 'исследователь']) },
  ];

  return scores.map((score, index) => ({
    name: score.name,
    value: Math.min(100, Math.max(35, Math.round((score.raw / total) * 280 + 44 + index * 3))),
  }));
};

export const toPlan = (curriculum: BackendCurriculum): EducationPlan => {
  const backendDisciplines = flattenDisciplines(curriculum);
  const disciplines = backendDisciplines.map((item, index) => ({
    id: item.curriculumDisciplineId ?? item.disciplineId ?? item.id ?? index,
    name: item.name,
    module:
      item.moduleName ??
      item.partName ??
      item.blockName ??
      item.classifications?.[0]?.valueName ??
      item.classifications?.[0]?.groupName ??
      defaultModule,
    semester: item.semesterNumber,
    hours: item.totalHours ?? 0,
    credits: asNumber(item.credits),
    controlForm: item.controlForm,
    blockName: item.blockName,
    partName: item.partName,
    moduleName: item.moduleName,
    recordType: item.recordType,
    lectureHours: item.lectureHours,
    practiceHours: item.practiceHours,
    labHours: item.labHours,
    independentHours: item.independentHours,
  }));
  const totalHours = disciplines.reduce((sum, item) => sum + item.hours, 0);
  const credits = Math.round(disciplines.reduce((sum, item) => sum + item.credits, 0));
  const semesters = new Set(disciplines.map((item) => item.semester).filter(Boolean)).size;
  const title = curriculum.profileName || curriculum.speciality.name;

  return {
    id: curriculum.id,
    title,
    faculty: facultyFromSource(curriculum.sourceFileName),
    level: levelByCode(curriculum.speciality.code, curriculum.educationLevel),
    studyForm: curriculum.educationForm ?? defaultStudyForm,
    year: curriculum.admissionYear ?? new Date(curriculum.uploadedAt).getFullYear(),
    duration: semesters > 4 ? '4 года' : semesters > 0 ? '2 года' : 'не указана',
    description: `Учебный план "${title}" по направлению ${curriculum.speciality.code} ${curriculum.speciality.name}. Данные готовы для анализа дисциплин, семестров, часов и ЗЕТ.`,
    totalHours,
    credits,
    semesters,
    competencies: buildCompetencies(backendDisciplines),
    disciplines,
    visualization: curriculum.visualization,
    sourceFileName: curriculum.sourceFileName,
    code: curriculum.speciality.code,
    uploadedAt: curriculum.uploadedAt,
  };
};
