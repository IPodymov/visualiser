import { Router } from 'express';
import fs from 'node:fs';
import multer from 'multer';
import path from 'node:path';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { filesController } from './files.controller';
import { filesService } from './files.service';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const directory = filesService.fitUploadDirectory();
    fs.mkdirSync(directory, { recursive: true });
    cb(null, directory);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname) || '.xlsx';
    cb(null, `${Date.now()}-${file.originalname.replace(extension, '')}${extension}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    cb(null, file.originalname.endsWith('.xlsx'));
  },
});

export const filesRoutes = Router();

filesRoutes.post('/fit', authMiddleware, upload.single('file'), filesController.uploadFitFile);
