const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const {
  getProducts, getProduct, createProduct, updateProduct,
  deleteProduct, importProducts, exportProducts, getTemplate
} = require('../controllers/product.controller');

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', getProducts);
router.get('/export', exportProducts);
router.get('/template', getTemplate);
router.get('/:id', getProduct);
router.post('/', createProduct);
router.post('/import', upload.single('file'), importProducts);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;