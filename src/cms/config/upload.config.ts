import * as fs from 'fs';
import multer, { diskStorage } from 'multer';
import * as path from 'path';

export const multerConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '../../tmp');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      // Sanitize filename và thêm timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    // Chỉ chấp nhận file video
    const allowedMimes = [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'video/webm',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB limit
  },
};
