CREATE TABLE "faculties" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "faculties_name_key" ON "faculties"("name");
CREATE UNIQUE INDEX "faculties_slug_key" ON "faculties"("slug");

ALTER TABLE "curricula" ADD COLUMN "faculty_id" INTEGER;
CREATE INDEX "curricula_faculty_id_idx" ON "curricula"("faculty_id");

ALTER TABLE "curricula"
  ADD CONSTRAINT "curricula_faculty_id_fkey"
  FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

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
ON CONFLICT ("slug") DO NOTHING;

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
