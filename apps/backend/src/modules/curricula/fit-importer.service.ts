import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { parseCurriculumWorkbook } from './fit-parser';
import {
  curriculumValidatorService,
  type CurriculumValidationResult,
} from './curriculum-validator.service';

const hashFile = async (filePath: string) => {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

const facultyNameBySlug: Record<string, string> = {
  fit: 'ФИТ',
  'фит': 'ФИТ',
  feiu: 'ФЭиУ',
  'фэиу': 'ФЭиУ',
  'fakultet-ekonomiki-i-upravleniya': 'Факультет экономики и управления',
  'fakultet-himicheskoy-tehnologii-i-biotehnologii':
    'Факультет химической технологии и биотехнологии',
  'fakultet-mashinostroeniya': 'Факультет машиностроения',
  'fakultet-urbanistiki-i-gorodskogo-hozyaystva':
    'Факультет урбанистики и городского хозяйства',
  'institut-grafiki-i-iskusstva-knigi-imeni-v-a-favorskogo':
    'Институт графики и искусства книги имени В. А. Фаворского',
  'institut-izdatelskogo-dela-i-zhurnalistiki':
    'Институт издательского дела и журналистики',
  'poligraficheskiy-institut': 'Полиграфический институт',
  'transportnyy-fakultet': 'Транспортный факультет',
};

export const getFacultyFromFitPath = (filePath: string) => {
  const normalized = filePath.split(path.sep).join('/');
  const parts = normalized.split('/').filter(Boolean);
  const yearIndex = parts.findIndex((part) => /^20\d{2}(?:\D.*)?$/.test(part));
  const facultySlug = yearIndex >= 0 ? parts[yearIndex + 1]?.toLowerCase() : undefined;

  if (!facultySlug) return { name: 'Университет', slug: 'university' };
  if (facultySlug === 'фит') return { name: facultyNameBySlug[facultySlug], slug: 'fit' };
  if (facultySlug === 'фэиу') return { name: facultyNameBySlug[facultySlug], slug: 'feiu' };
  if (facultyNameBySlug[facultySlug]) {
    return {
      name: facultyNameBySlug[facultySlug],
      slug: facultySlug,
    };
  }

  return {
    name: facultySlug
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
    slug: facultySlug,
  };
};

const supportedWorkbookExtensions = new Set(['.xlsx', '.xls', '.xlsm']);

const findWorkbookFiles = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return findWorkbookFiles(entryPath);
      if (
        entry.isFile() &&
        supportedWorkbookExtensions.has(path.extname(entry.name).toLowerCase()) &&
        !entry.name.startsWith('~$')
      ) {
        return [entryPath];
      }
      return [];
    }),
  );
  return nested.flat();
};

const fitDirs = () =>
  env.FIT_DIR.split(',')
    .map((directory) => directory.trim())
    .filter(Boolean)
    .map((directory) => path.resolve(process.cwd(), directory));

const importAdmissionYear = () => {
  const value = process.env.FIT_IMPORT_ADMISSION_YEAR?.trim();
  if (!value) return undefined;

  const year = Number(value);
  return Number.isInteger(year) ? year : undefined;
};

type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export const importFitCurricula = async () => {
  const directories = fitDirs();
  const files = (
    await Promise.all(
      directories.map(async (directory) => {
        try {
          return await findWorkbookFiles(directory);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
          throw error;
        }
      }),
    )
  )
    .flat()
    .sort((left, right) => left.localeCompare(right));
  const targetAdmissionYear = importAdmissionYear();
  const result = {
    directory: directories.join(', '),
    directories,
    targetAdmissionYear,
    totalFiles: files.length,
    imported: 0,
    skipped: 0,
    ignored: 0,
    failed: 0,
    items: [] as Array<{
      file: string;
      status: string;
      curriculumId?: number;
      reason?: string;
      validation?: CurriculumValidationResult;
    }>,
  };

  for (const filePath of files) {
    try {
      const facultyInfo = getFacultyFromFitPath(filePath);
      const parsed = parseCurriculumWorkbook(filePath);
      if (targetAdmissionYear && parsed.admissionYear !== targetAdmissionYear) {
        result.ignored += 1;
        result.items.push({
          file: filePath,
          status: 'ignored',
          reason: `Admission year ${parsed.admissionYear ?? 'unknown'} does not match ${targetAdmissionYear}`,
        });
        continue;
      }

      const sourceFileHash = await hashFile(filePath);
      const existing = await prisma.curriculum.findUnique({ where: { sourceFileHash } });
      if (existing) {
        const faculty = await prisma.faculty.upsert({
          where: { slug: facultyInfo.slug },
          create: facultyInfo,
          update: { name: facultyInfo.name },
        });

        if (existing.facultyId !== faculty.id) {
          await prisma.curriculum.update({
            where: { id: existing.id },
            data: { facultyId: faculty.id },
          });
        }

        result.skipped += 1;
        result.items.push({ file: filePath, status: 'skipped', curriculumId: existing.id });
        continue;
      }

      const validation = curriculumValidatorService.validateParsed(parsed);
      if (!validation.isValid) {
        result.failed += 1;
        result.items.push({
          file: filePath,
          status: 'failed',
          reason: 'Curriculum validation failed',
          validation,
        });
        continue;
      }

      const curriculum = await prisma.$transaction(async (tx: PrismaTransactionClient) => {
        const faculty = await tx.faculty.upsert({
          where: { slug: facultyInfo.slug },
          create: facultyInfo,
          update: { name: facultyInfo.name },
        });

        const speciality = await tx.speciality.upsert({
          where: { code: parsed.specialityCode },
          create: { code: parsed.specialityCode, name: parsed.specialityName },
          update: { name: parsed.specialityName },
        });

        const created = await tx.curriculum.create({
          data: {
            specialityId: speciality.id,
            facultyId: faculty.id,
            admissionYear: parsed.admissionYear,
            educationLevel: parsed.educationLevel,
            educationForm: parsed.educationForm,
            profileName: parsed.profileName,
            sourceFileName: path.basename(filePath),
            sourceFilePath: filePath,
            sourceFileHash,
          },
        });

        for (const parsedDiscipline of parsed.disciplines) {
          const discipline = await tx.discipline.upsert({
            where: { name: parsedDiscipline.name },
            create: { name: parsedDiscipline.name },
            update: {},
          });

          await tx.curriculumDiscipline.create({
            data: {
              curriculumId: created.id,
              disciplineId: discipline.id,
              externalDisciplineCode: parsedDiscipline.externalDisciplineCode,
              semesterNumber: parsedDiscipline.semesterNumber,
              controlForm: parsedDiscipline.controlForm,
              blockName: parsedDiscipline.blockName,
              partName: parsedDiscipline.partName,
              moduleName: parsedDiscipline.moduleName,
              recordType: parsedDiscipline.recordType,
              totalHours: parsedDiscipline.totalHours,
              credits: parsedDiscipline.credits,
              lectureHours: parsedDiscipline.lectureHours,
              practiceHours: parsedDiscipline.practiceHours,
              labHours: parsedDiscipline.labHours,
              independentHours: parsedDiscipline.independentHours,
            },
          });
        }

        return created;
      });

      result.imported += 1;
      result.items.push({
        file: filePath,
        status: 'imported',
        curriculumId: curriculum.id,
        validation,
      });
    } catch (error) {
      result.failed += 1;
      result.items.push({
        file: filePath,
        status: 'failed',
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
};
