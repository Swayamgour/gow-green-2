const express = require('express');
const router = express.Router();
const {
  exportLeads, exportCustomers, exportProducts,
  exportQuotations, exportMaster
} = require('../controllers/reports.controller');

router.get('/leads', exportLeads);
router.get('/customers', exportCustomers);
router.get('/products', exportProducts);
router.get('/quotations', exportQuotations);
router.get('/master', exportMaster);

module.exports = router;