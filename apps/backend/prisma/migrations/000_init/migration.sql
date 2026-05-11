CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "full_name" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "specialities" (
  "id" SERIAL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL
);

CREATE TABLE "curricula" (
  "id" SERIAL PRIMARY KEY,
  "speciality_id" INTEGER NOT NULL REFERENCES "specialities"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "admission_year" INTEGER,
  "education_level" TEXT,
  "education_form" TEXT,
  "profile_name" TEXT,
  "source_file_name" TEXT NOT NULL,
  "source_file_path" TEXT NOT NULL,
  "source_file_hash" TEXT NOT NULL UNIQUE,
  "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "disciplines" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE
);

CREATE TABLE "curriculum_disciplines" (
  "id" SERIAL PRIMARY KEY,
  "curriculum_id" INTEGER NOT NULL REFERENCES "curricula"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "discipline_id" INTEGER NOT NULL REFERENCES "disciplines"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "external_discipline_code" TEXT,
  "semester_number" INTEGER,
  "control_form" TEXT,
  "total_hours" INTEGER,
  "credits" DECIMAL(6, 2),
  "lecture_hours" INTEGER,
  "practice_hours" INTEGER,
  "lab_hours" INTEGER
);

CREATE UNIQUE INDEX "curriculum_disciplines_unique" ON "curriculum_disciplines" ("curriculum_id", "discipline_id", "semester_number", "external_discipline_code");
CREATE INDEX "curricula_speciality_id_idx" ON "curricula" ("speciality_id");
CREATE INDEX "curricula_admission_year_idx" ON "curricula" ("admission_year");
CREATE INDEX "curriculum_disciplines_curriculum_id_idx" ON "curriculum_disciplines" ("curriculum_id");
CREATE INDEX "curriculum_disciplines_discipline_id_idx" ON "curriculum_disciplines" ("discipline_id");

CREATE TABLE "classification_groups" (
  "id" SERIAL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL
);

CREATE TABLE "classification_values" (
  "id" SERIAL PRIMARY KEY,
  "group_id" INTEGER NOT NULL REFERENCES "classification_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "classification_values_group_code_unique" UNIQUE ("group_id", "code")
);

CREATE TABLE "discipline_classifications" (
  "discipline_id" INTEGER NOT NULL REFERENCES "disciplines"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "classification_value_id" INTEGER NOT NULL REFERENCES "classification_values"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "weight" DECIMAL(5, 2),
  PRIMARY KEY ("discipline_id", "classification_value_id")
);

CREATE TABLE "view_history" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "curriculum_id" INTEGER NOT NULL REFERENCES "curricula"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "favorite_curricula" (
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "curriculum_id" INTEGER NOT NULL REFERENCES "curricula"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("user_id", "curriculum_id")
);

CREATE TABLE "download_history" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "curriculum_id" INTEGER REFERENCES "curricula"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "download_type" TEXT NOT NULL,
  "downloaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "view_history_user_viewed_idx" ON "view_history" ("user_id", "viewed_at");
CREATE INDEX "download_history_user_downloaded_idx" ON "download_history" ("user_id", "downloaded_at");
