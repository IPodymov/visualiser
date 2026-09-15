import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env';
import { AppError } from '../../shared/app-error';

export class FilesService {
  fitUploadDirectory() {
    return path.resolve(process.cwd(), env.FIT_DIR);
  }

  uploadedFilePath(file: Express.Multer.File) {
    const fileName = path.basename(file.filename);
    const uploadDirectory = this.fitUploadDirectory();

    return path.resolve(uploadDirectory, fileName);
  }

  async uploaded(file?: Express.Multer.File) {
    if (!file) {
      throw new AppError(400, 'A valid XLSX file is required');
    }

    const filePath = this.uploadedFilePath(file);
    const handle = await fs.open(filePath, 'r');
    const signature = Buffer.alloc(4);
    try {
      await handle.read(signature, 0, signature.length, 0);
    } finally {
      await handle.close();
    }

    const isZipWorkbook = signature.equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    if (!isZipWorkbook) {
      await fs.unlink(filePath).catch(() => undefined);
      throw new AppError(400, 'The uploaded file is not a valid XLSX workbook');
    }

    const fileName = path.basename(file.filename);
    return {
      fileName,
      path: fileName,
    };
  }
}

export const filesService = new FilesService();
