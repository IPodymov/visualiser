import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env';
import { AppError } from '../../shared/app-error';

export class FilesService {
  fitUploadDirectory() {
    return path.resolve(process.cwd(), env.FIT_DIR);
  }

  async uploaded(file?: Express.Multer.File) {
    if (!file) {
      throw new AppError(400, 'A valid XLSX file is required');
    }

    const handle = await fs.open(file.path, 'r');
    const signature = Buffer.alloc(4);
    try {
      await handle.read(signature, 0, signature.length, 0);
    } finally {
      await handle.close();
    }

    const isZipWorkbook = signature.equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    if (!isZipWorkbook) {
      await fs.unlink(file.path).catch(() => undefined);
      throw new AppError(400, 'The uploaded file is not a valid XLSX workbook');
    }

    return {
      fileName: file.filename,
      path: file.filename,
    };
  }
}

export const filesService = new FilesService();
