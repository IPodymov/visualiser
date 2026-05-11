import path from 'node:path';
import { env } from '../../config/env';

export class FilesService {
  fitUploadDirectory() {
    return path.resolve(process.cwd(), env.FIT_DIR);
  }

  uploaded(file?: Express.Multer.File) {
    return {
      fileName: file?.filename,
      path: file?.path,
    };
  }
}

export const filesService = new FilesService();
