const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const { v4: uuidv4 } = require('uuid');
const fs       = require('fs');
const {
  getTDSList, getTDS, uploadTDS, updateTDS,
  deleteTDS, downloadTDS, getCategories
} = require('../controllers/tds.controller');

// ── Storage: save files in /tds directory ──────────────
const tdsDir = path.join(process.cwd(), 'tds');
if (!fs.existsSync(tdsDir)) fs.mkdirSync(tdsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tdsDir),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg', 'image/png', 'image/jpg',
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only PDF, Word, Excel and image files are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB
});

router.get('/',               getTDSList);
router.get('/categories',     getCategories);
router.get('/:id',            getTDS);
router.get('/:id/download',   downloadTDS);
router.post('/', upload.single('file'), uploadTDS);
router.put('/:id',            updateTDS);
router.delete('/:id',         deleteTDS);

module.exports = router;