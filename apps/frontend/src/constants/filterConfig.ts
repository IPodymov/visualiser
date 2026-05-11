import type { SelectFilterConfig } from '../types/filter';

export const planFilterConfig: SelectFilterConfig[] = [
  {
    key: 'faculty',
    label: 'Факультет',
    placeholder: 'Факультет',
    options: [
      { label: 'ФИТ', value: 'ФИТ' },
      { label: 'ФЭиУ', value: 'ФЭиУ' },
      { label: 'Транспортный факультет', value: 'Транспортный факультет' },
      { label: 'Полиграфический институт', value: 'Полиграфический институт' },
      { label: 'Университет', value: 'Университет' },
    ],
  },
  {
    key: 'level',
    label: 'Уровень',
    placeholder: 'Уровень',
    options: [
      { label: 'Бакалавриат', value: 'Бакалавриат' },
      { label: 'Магистратура', value: 'Магистратура' },
      { label: 'Специалитет', value: 'Специалитет' },
    ],
  },
  {
    key: 'studyForm',
    label: 'Форма',
    placeholder: 'Форма',
    options: [
      { label: 'Очная', value: 'Очная' },
      { label: 'Очно-заочная', value: 'Очно-заочная' },
      { label: 'Заочная', value: 'Заочная' },
    ],
  },
  {
    key: 'year',
    label: 'Год',
    placeholder: 'Год',
    options: [
      { label: '2025', value: '2025' },
      { label: '2024', value: '2024' },
      { label: '2023', value: '2023' },
    ],
  },
];
