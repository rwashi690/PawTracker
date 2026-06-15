import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const uploadsDir = path.join(process.cwd(), 'uploads/pets');

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

// Use memory storage for compression
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (increased for compression)
  },
});

// Middleware to compress images after upload
export const compressImage = async (req: any, res: any, next: any) => {
  if (!req.file) {
    return next();
  }

  // Ensure directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Only compress images, not PDFs
  if (req.file.mimetype === 'application/pdf') {
    // Save PDF as-is
    const uniqueFilename = `${uuidv4()}.pdf`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    fs.writeFileSync(filePath, req.file.buffer);
    req.file.path = filePath;
    req.file.filename = uniqueFilename;
    return next();
  }

  try {
    const uniqueFilename = `${uuidv4()}.webp`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    // Compress and convert to WebP
    await sharp(req.file.buffer)
      .webp({ quality: 80 })
      .resize(1920, 1920, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .toFile(filePath);

    // Update file info
    req.file.path = filePath;
    req.file.filename = uniqueFilename;
    req.file.mimetype = 'image/webp';
    
    console.log(`Compressed image saved: ${uniqueFilename}`);
    next();
  } catch (error) {
    console.error('Error compressing image:', error);
    return res.status(500).json({ error: 'Failed to compress image' });
  }
};
