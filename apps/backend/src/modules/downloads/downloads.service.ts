import fs from 'node:fs';
import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/app-error';
import { comparisonService } from '../comparison/comparison.service';
import { curriculaService } from '../curricula/curricula.service';

export class DownloadsService {
  async sourceFile(curriculumId: number, userId?: number) {
    const curriculum = await prisma.curriculum.findUnique({ where: { id: curriculumId } });
    if (!curriculum) throw new AppError(404, 'Curriculum not found');
    if (!fs.existsSync(curriculum.sourceFilePath)) throw new AppError(404, 'Source file not found');

    await this.log(userId, curriculumId, 'SOURCE_CURRICULUM');
    return curriculum;
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
