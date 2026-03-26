const express = require('express');
const router = express.Router();
const {
  getLeads, getLead, createLead, updateLead,
  updateLeadStatus, updateLeadCategory,
  addNote, deleteNote, deleteLead, scanNoteOCR
} = require('../controllers/lead.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/',                          protect, getLeads);
router.post('/',                         protect, createLead);
router.post('/:id/scan-note',            protect, upload.single('image'), scanNoteOCR);
router.post('/:id/notes',                protect, addNote);
router.delete('/:id/notes/:noteId',      protect, deleteNote);
router.patch('/:id/status',              protect, updateLeadStatus);
router.patch('/:id/category',            protect, updateLeadCategory);
router.get('/:id',                       protect, getLead);
router.put('/:id',                       protect, updateLead);
router.delete('/:id',                    protect, deleteLead);

module.exports = router;