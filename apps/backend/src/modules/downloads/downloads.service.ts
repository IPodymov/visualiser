import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../shared/app-error';
import { comparisonService } from '../comparison/comparison.service';
import { curriculaService } from '../curricula/curricula.service';

export class DownloadsService {
  async sourceFile(curriculumId: number, userId?: number) {
    const curriculum = await prisma.curriculum.findUnique({ where: { id: curriculumId } });
    if (!curriculum) throw new AppError(404, 'Curriculum not found');
    if (!fs.existsSync(curriculum.sourceFilePath)) throw new AppError(404, 'Source file not found');
    const realFilePath = fs.realpathSync(curriculum.sourceFilePath);
    const isInsideAllowedDirectory = env.FIT_DIR.split(',')
      .map((directory) => directory.trim())
      .filter(Boolean)
      .map((directory) => path.resolve(process.cwd(), directory))
      .some((directory) => {
        const realDirectory = fs.existsSync(directory) ? fs.realpathSync(directory) : directory;
        const relativePath = path.relative(realDirectory, realFilePath);
        return relativePath !== '' && !relativePath.startsWith('..');
      });
    if (!isInsideAllowedDirectory) throw new AppError(404, 'Source file not found');

    await this.log(userId, curriculumId, 'SOURCE_CURRICULUM');
    return { ...curriculum, sourceFilePath: realFilePath };
  }

  async disciplineMap(curriculumId: number, userId?: number) {
    const data = await curriculaService.getById(curriculumId);
    await this.log(userId, curriculumId, 'DISCIPLINE_MAP');
    return data;
  }

  async comparison(firstCurriculumId: number, secondCurriculumId: number, userId?: number) {
    const data = await comparisonService.compare(firstCurriculumId, secondCurriculumId);
    await this.log(userId, firstCurriculumId, 'COMPARISON_RESULT');
    await this.log(userId, secondCurriculumId, 'COMPARISON_RESULT');
    return data;
  }

  private log(userId: number | undefined, curriculumId: number | undefined, downloadType: string) {
    return prisma.downloadHistory.create({
      data: {
        userId,
        curriculumId,
        downloadType,
      },
    });
  }
}

export const downloadsService = new DownloadsService();
