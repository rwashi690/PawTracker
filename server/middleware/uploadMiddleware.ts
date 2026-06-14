import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const uploadsDir = path.join(process.cwd(), 'uploads/pets');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Upload destination:', uploadsDir);
    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      console.log('Creating uploads directory:', uploadsDir);
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    console.log('Generated filename:', uniqueFilename);
    cb(null, uniqueFilename);
  },
});

// File filter to allow images (jpeg/png/webp/heic/heif) and PDFs
const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  const allowed = new Set([
    'image/jpeg',
    'image/jpg',
    'image/pjpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
  ]);
  if (allowed.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed types: JPG, PNG, WEBP, HEIC, HEIF, or PDF.'));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
