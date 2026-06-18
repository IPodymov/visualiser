UPDATE "faculties"
SET "name" = CASE "slug"
  WHEN 'fit' THEN 'ФИТ'
  WHEN 'feiu' THEN 'ФЭиУ'
  WHEN 'fakultet-ekonomiki-i-upravleniya' THEN 'Факультет экономики и управления'
  WHEN 'fakultet-himicheskoy-tehnologii-i-biotehnologii' THEN 'Факультет химической технологии и биотехнологии'
  WHEN 'fakultet-mashinostroeniya' THEN 'Факультет машиностроения'
  WHEN 'fakultet-urbanistiki-i-gorodskogo-hozyaystva' THEN 'Факультет урбанистики и городского хозяйства'
  WHEN 'institut-grafiki-i-iskusstva-knigi-imeni-v-a-favorskogo' THEN 'Институт графики и искусства книги имени В. А. Фаворского'
  WHEN 'institut-izdatelskogo-dela-i-zhurnalistiki' THEN 'Институт издательского дела и журналистики'
  WHEN 'poligraficheskiy-institut' THEN 'Полиграфический институт'
  WHEN 'transportnyy-fakultet' THEN 'Транспортный факультет'
  ELSE "name"
END
WHERE "slug" IN (
  'fit',
  'feiu',
  'fakultet-ekonomiki-i-upravleniya',
  'fakultet-himicheskoy-tehnologii-i-biotehnologii',
  'fakultet-mashinostroeniya',
  'fakultet-urbanistiki-i-gorodskogo-hozyaystva',
  'institut-grafiki-i-iskusstva-knigi-imeni-v-a-favorskogo',
  'institut-izdatelskogo-dela-i-zhurnalistiki',
  'poligraficheskiy-institut',
  'transportnyy-fakultet'
);
