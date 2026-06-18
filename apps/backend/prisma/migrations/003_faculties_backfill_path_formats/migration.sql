WITH parsed_faculties AS (
  SELECT DISTINCT
    LOWER(SUBSTRING("source_file_path" FROM '20[0-9]{2}[^/]*/([^/]+)')) AS slug
  FROM "curricula"
),
normalized_faculties AS (
  SELECT
    CASE
      WHEN slug = 'фит' THEN 'fit'
      WHEN slug = 'фэиу' THEN 'feiu'
      WHEN slug IS NULL OR slug = '' THEN 'university'
      ELSE slug
    END AS slug,
    CASE
      WHEN slug IN ('fit', 'фит') THEN 'ФИТ'
      WHEN slug IN ('feiu', 'фэиу') THEN 'ФЭиУ'
      WHEN slug IS NULL OR slug = '' THEN 'Университет'
      ELSE INITCAP(REPLACE(slug, '-', ' '))
    END AS name
  FROM parsed_faculties
)
INSERT INTO "faculties" ("name", "slug")
SELECT name, slug
FROM normalized_faculties
ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name";

UPDATE "curricula"
SET "faculty_id" = "faculties"."id"
FROM "faculties"
WHERE "faculties"."slug" = COALESCE(
  CASE
    WHEN LOWER(SUBSTRING("curricula"."source_file_path" FROM '20[0-9]{2}[^/]*/([^/]+)')) = 'фит' THEN 'fit'
    WHEN LOWER(SUBSTRING("curricula"."source_file_path" FROM '20[0-9]{2}[^/]*/([^/]+)')) = 'фэиу' THEN 'feiu'
    ELSE LOWER(SUBSTRING("curricula"."source_file_path" FROM '20[0-9]{2}[^/]*/([^/]+)'))
  END,
  'university'
);
