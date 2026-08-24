import { Router } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import multer from 'multer';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { filesController } from './files.controller';
import { filesService } from './files.service';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const directory = filesService.fitUploadDirectory();
    fs.mkdirSync(directory, { recursive: true });
    cb(null, directory);
  },
  filename: (_req, _file, cb) => {
    cb(null, `${crypto.randomUUID()}.xlsx`);
  },
});

const allowedWorkbookMimeTypes = new Set([
  'application/octet-stream',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
]);

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
    fields: 0,
  },
  fileFilter: (_req, file, cb) => {
    cb(
      null,
      file.originalname.toLowerCase().endsWith('.xlsx') &&
        allowedWorkbookMimeTypes.has(file.mimetype),
    );
  },
});

export const filesRoutes = Router();

filesRoutes.post('/fit', authMiddleware, upload.single('file'), filesController.uploadFitFile);
