const express = require('express');
const router = express.Router();
const {
  getQuotations, getQuotation, createQuotation, updateQuotation,
  updateStatus, deleteQuotation, downloadPDF
} = require('../controllers/quotation.controller');

router.get('/', getQuotations);
router.get('/:id', getQuotation);
router.get('/:id/pdf', downloadPDF);
router.post('/', createQuotation);
router.put('/:id', updateQuotation);
router.patch('/:id/status', updateStatus);
router.delete('/:id', deleteQuotation);

module.exports = router;