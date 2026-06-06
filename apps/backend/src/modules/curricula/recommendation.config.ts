import type { CurriculumRecommendationRequest } from './curricula.dto';

export type RecommendationCategory = keyof CurriculumRecommendationRequest['weights'];

export const recommendationCategoryLabels: Record<RecommendationCategory, string> = {
  software: 'разработку программного обеспечения',
  web: 'веб-технологии',
  data: 'данные и аналитику',
  ai: 'искусственный интеллект',
  security: 'устойчивость систем',
  systems: 'информационные системы',
  robotics: 'робототехнику и беспилотные системы',
  embedded: 'электронные устройства',
  gamedev: 'игровую индустрию',
  xr: 'VR/AR и смешанную реальность',
  mediaDesign: 'медиа, дизайн и креативные индустрии',
  businessIt: 'бизнес-приложения и 1С',
  management: 'управление и цифровую трансформацию',
  engineering: 'инженерные технологии',
  math: 'математическую базу',
  research: 'исследовательский подход',
};

export const recommendationCategoryTokens: Record<RecommendationCategory, string[]> = {
  software: ['программ', 'разработ', 'алгоритм', 'код', 'информатика', 'инженер', 'software'],
  web: ['web', 'веб', 'frontend', 'backend', 'сайт', 'интернет', 'мобильн'],
  data: ['данн', 'аналит', 'bi', 'статист', 'прогноз', 'большие и открытые данные'],
  ai: ['искусственный интеллект', 'машин', 'интеллектуальн', 'нейрон', 'когнитив', 'моделирован'],
  security: ['безопас', 'защит', 'кибер', 'security', 'csec'],
  systems: ['информационные системы', 'автоматизирован', 'системн', 'администр', 'сети', 'инфраструктур'],
  robotics: ['робот', 'беспилот', 'киберфиз', 'эргономик', 'управление в технических системах'],
  embedded: ['электрон', 'устройств', 'микроконтрол', 'аппарат', 'сапр', 'датчик'],
  gamedev: ['игров', 'game', 'компьютерной индустрии', 'гейм'],
  xr: ['виртуаль', 'дополненн', 'смешанн', 'vr', 'ar', 'реальность'],
  mediaDesign: ['дизайн', 'медиа', 'креатив', 'график', 'издатель', 'реклам', 'арт', 'печатн'],
  businessIt: ['бизнес', 'корпоратив', '1с', 'предприят', 'erp', 'crm', 'эконом'],
  management: ['управлен', 'менедж', 'организац', 'инновац', 'трансформац', 'проект'],
  engineering: ['инженер', 'технолог', 'материал', 'машин', 'оборудован', 'электротех', 'конструирован'],
  math: ['математ', 'алгебр', 'дискрет', 'вероят', 'статист', 'модел', 'foundations'],
  research: ['исслед', 'науч', 'аспиран', 'метод', 'диссертац', 'эксперимент', 'foundations'],
};

export const educationLevelLabels: Record<NonNullable<CurriculumRecommendationRequest['educationLevel']>, string> = {
  bachelor: 'Бакалавриат',
  specialist: 'Специалитет',
  master: 'Магистратура',
  postgraduate: 'Аспирантура',
};

export const studyFormLabels: Record<NonNullable<CurriculumRecommendationRequest['studyForm']>, string> = {
  fullTime: 'Очная',
  partTime: 'Заочная',
  evening: 'Очно-заочная',
};

export const defaultStudyForm = studyFormLabels.fullTime;
export const defaultFaculty = 'Университет';
export const sourceFacultyMarkers = ['ФИТ'];
