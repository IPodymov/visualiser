# Стили и дизайн-система

Текущий интерфейс — светлый аналитический продукт: спокойный фон, белые surfaces, тёмно-синий текст, синий основной action и отдельные цвета программ A/B. Стили состоят из Tailwind utilities, глобальных CSS-токенов и component-level CSS.

## Файлы

```text
apps/frontend/src/app/styles/
├── variables.css    # семантические CSS custom properties
├── globals.css      # reset, base и общие patterns
├── typography.css   # display/page/section typography
├── layout.css       # shell и вертикальный rhythm
└── index.css        # порядок импортов и Tailwind layers
```

Доменные компоненты могут иметь соседний `.css`, но обязаны использовать семантические переменные, а не повторять hex-значения.

## Основные токены

| Роль            | Переменная          | Значение  |
| --------------- | ------------------- | --------- |
| фон страницы    | `--color-page`      | `#f6f8f7` |
| поверхность     | `--color-surface`   | `#ffffff` |
| основной текст  | `--color-ink`       | `#14243b` |
| вторичный текст | `--color-ink-soft`  | `#526174` |
| граница         | `--color-border`    | `#d8e0e7` |
| бренд           | `--color-brand`     | `#2563eb` |
| программа A     | `--color-program-a` | `#2563eb` |
| программа B     | `--color-program-b` | `#c46a08` |
| общее           | `--color-shared`    | `#0f766e` |
| ошибка          | `--color-error`     | `#b42318` |

Также определены soft-surfaces, spacing `--space-1`…`--space-24`, radius `0.75rem`, тени и transition `160ms ease`. HSL-переменные совместимы с Tailwind/shadcn-style primitives.

## Типографика

Основной stack: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

- `.display-title` — hero, до `4.75rem`, не более 16 символов ширины;
- `.page-title` — H1 route-level страницы;
- `.section-title` — заголовок аналитического раздела;
- `.eyebrow` — короткий uppercase-контекст;
- `.lead-copy` — вводное объяснение;
- `.muted-copy` — вторичная подпись.

Не уменьшайте основной текст ради плотности. Компактность достигается иерархией, удалением повторов и управляемым spacing.

## Layout

- минимальная поддерживаемая ширина — 320 px;
- `.page-main` задаёт вертикальные поля страницы;
- `.page-stack` разделяет крупные смысловые блоки;
- `.section-grid` управляет внутренней сеткой;
- `.container` ограничивает строку и выравнивает header, main и footer;
- desktop-сетки схлопываются в одну колонку на mobile.

Фон `app-shell` содержит очень мягкие brand/shared radial accents. Это не dark theme и не glassmorphism: читаемость данных важнее декоративного эффекта.

## Компонентные правила

- сначала ищите primitive или доменный эквивалент в `apps/frontend/src/shared/ui`, `apps/frontend/src/entities/*/ui`, `apps/frontend/src/features/*/ui` и `apps/frontend/src/widgets`;
- используйте `PageHeader`, `PageSection`, `SectionHeader`, `NextAction` для композиции страницы;
- для метрики используйте `MetricCard`, для графика — `ChartCard`;
- loading/error/empty собирайте через `InterfaceState`;
- варианты button/badge/card добавляйте централизованно;
- A/B цвета не меняются между selector, chart, badge, delta и таблицей;
- error/success/warning не смешиваются с цветами программ.

## Motion

Анимация короткая и функциональная: появление, feedback выбора, drawer/dialog. `prefers-reduced-motion: reduce` почти полностью отключает animation и smooth scroll. Не добавляйте motion, который задерживает чтение результата.

## Доступность

- контраст текста и controls должен соответствовать WCAG AA;
- focus ring видим на ссылках, кнопках и полях;
- icon-only control получает `aria-label`;
- tooltip доступен через hover и focus;
- dialog/drawer управляет focus и закрывается ожидаемым способом;
- status не передаётся только цветом;
- график сопровождается заголовком, единицей и числовой интерпретацией.

## Добавление нового визуального паттерна

1. Найдите существующий компонент и проверьте дизайн-спецификацию.
2. Определите семантическую роль, состояния и mobile-вариант.
3. Переиспользуйте токены; новый token добавляйте только при повторяемой системной роли.
4. Добавьте interaction/accessibility tests.
5. Проверьте desktop, 390 px и reduced motion.
6. Обновите документацию, если изменился общий паттерн.
