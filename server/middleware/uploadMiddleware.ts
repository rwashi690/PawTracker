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

// File filter to only allow images
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image.'));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
