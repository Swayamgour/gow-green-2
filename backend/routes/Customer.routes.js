const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const {
  getCustomers, getCustomer, createCustomer, updateCustomer,
  deleteCustomer, addNote, exportExcel, importExcel, downloadTemplate
} = require('../controllers/Customer.controller');
const { protect } = require('../middleware/auth.middleware');

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', protect, getCustomers);
router.get('/export', exportExcel);
router.get('/template', downloadTemplate);
router.get('/:id', getCustomer);
router.post('/', createCustomer);
router.post('/import', upload.single('file'), importExcel);
router.post('/:id/notes', addNote);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;