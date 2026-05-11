import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
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

const findXlsxFiles = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return findXlsxFiles(entryPath);
      if (entry.isFile() && entry.name.endsWith('.xlsx') && !entry.name.startsWith('~$')) {
        return [entryPath];
      }
      return [];
    }),
  );
  return nested.flat();
};

const fitDir = () => path.resolve(process.cwd(), env.FIT_DIR);

export const importFitCurricula = async () => {
  const directory = fitDir();
  const files = await findXlsxFiles(directory);
  const result = {
    directory,
    totalFiles: files.length,
    imported: 0,
    skipped: 0,
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
      const sourceFileHash = await hashFile(filePath);
      const existing = await prisma.curriculum.findUnique({ where: { sourceFileHash } });
      if (existing) {
        result.skipped += 1;
        result.items.push({ file: filePath, status: 'skipped', curriculumId: existing.id });
        continue;
      }

      const parsed = parseCurriculumWorkbook(filePath);
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

      const curriculum = await prisma.$transaction(async (tx) => {
        const speciality = await tx.speciality.upsert({
          where: { code: parsed.specialityCode },
          create: { code: parsed.specialityCode, name: parsed.specialityName },
          update: { name: parsed.specialityName },
        });

        const created = await tx.curriculum.create({
          data: {
            specialityId: speciality.id,
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
              totalHours: parsedDiscipline.totalHours,
              credits: parsedDiscipline.credits,
              lectureHours: parsedDiscipline.lectureHours,
              practiceHours: parsedDiscipline.practiceHours,
              labHours: parsedDiscipline.labHours,
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
