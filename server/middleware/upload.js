const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadDir } = require('../config/jwt');

const uploadPath = path.join(__dirname, '..', uploadDir);
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadPath),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedExt = /\.(jpe?g|png|gif|webp|pdf|doc|docx|xls|xlsx|csv|txt|ppt|pptx|rtf|odt|ods|zip|rar|7z|mp4|mp3|wav|xml|json)$/i;
  const ext = allowedExt.test(path.extname(file.originalname));
  if (ext) cb(null, true);
  else cb(new Error('File type not supported. Use documents, images, PDF, Word, Excel, or reports.'), false);
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

module.exports = upload;
