const Lead = require('../models/Lead.model');
const Customer = require('../models/Customer.model');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// ── Helper: auto-create customer when lead is won ─────────────────────────────
const autoCreateCustomer = async (lead) => {
  try {
    const orConditions = [];

    if (lead.phone) orConditions.push({ omobile: lead.phone });
    if (lead.email) orConditions.push({ oemail: lead.email });

    const existing = orConditions.length > 0
      ? await Customer.findOne({ $or: orConditions })
      : null;

    if (!existing) {

      const customerData = {
        name: lead.leadName || lead.name || 'Unknown',
        pname: lead.company || '',
        code: lead.code || '',

        // ✅ Address
        add1: lead.address || '',
        city: lead.city || '',
        state: lead.state || '',
        pin: lead.pin || '',

        // ✅ Owner (MAIN CONTACT)
        oname: lead.leadName || lead.name || '',
        omobile: lead.phone || '',
        oemail: lead.email || '',

        // ✅ Basic
        source: lead.leadSource || lead.source || '',
        activeyn: 'Y',

        // ✅ Optional mapping
        gstin: lead.gstin || '',
        panno: lead.panNo || '',

        // ✅ Assigned (optional)
        smanid: lead.assignedTo?._id || lead.assignedTo || '',

        // ✅ Default values
        tp: 'D', // default type
        margin: 0,
        freight: 0
      };

      await Customer.create(customerData);

      console.log('✅ Auto-customer created:', customerData.name);

    } else {
      console.log('ℹ️ Customer already exists, skipping');
    }

  } catch (err) {
    console.error('❌ Auto-customer creation failed:', err.message);
    console.error('❌ Lead data:', lead);
  }
};

const logActivity = async (leadId, action, details = '', changedBy = 'System') => {
  try {
    await Lead.findByIdAndUpdate(leadId, {
      $push: {
        activityLog: {
          action,
          details,
          changedBy,
          timestamp: new Date(),
        }
      }
    });
  } catch (err) {
    console.error('Activity log failed:', err.message);
  }
};

// GET all leads
const getLeads = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) filter.leadStatus = { $in: req.query.status.split(',') };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      filter.$or = [
        { leadName: { $regex: req.query.search, $options: 'i' } },
        { company: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Executive sees only their assigned leads
    if (req.user && req.user.role === 'executive') {
      const Executive = require('../models/Executive.model');
      const exec = await Executive.findOne({ email: req.user.email });
      if (exec) {
        filter.assignedTo = exec._id;
      } else {
        return res.json({ success: true, data: [] });
      }
    }

    const leads = await Lead.find(filter)
      .populate('assignedTo', 'name phone email')
      .sort({ createdAt: -1 })
      .select('-__v');

    return res.json({ success: true, data: leads });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET single lead
const getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name phone');
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    return res.json({ success: true, data: lead });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST create lead
const createLead = async (req, res) => {
  try {
    const leadData = { ...req.body };
    if (!leadData.assignedTo) leadData.assignedTo = null;

    // Executive auto-assigns to themselves
    if (req.user && req.user.role === 'executive') {
      const Executive = require('../models/Executive.model');
      const exec = await Executive.findOne({ email: req.user.email });
      if (exec) leadData.assignedTo = exec._id;
    }

    const lead = await Lead.create(leadData);
    await logActivity(lead._id, 'Lead Created', `Lead "${lead.leadName}" was created`, req.user?.name || 'Admin');
    return res.status(201).json({ success: true, data: lead });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT update lead (full update — also handles status change to won)
const updateLead = async (req, res) => {
  try {
    const prevLead = await Lead.findById(req.params.id);
    if (!prevLead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const prevStatus = prevLead.leadStatus;

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name phone');

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    // Auto-create customer if status changed to won
    if (lead.leadStatus === 'won' && prevStatus !== 'won') {
      await autoCreateCustomer(lead);
    }

    // Log field changes
    const changes = [];
    if (req.body.leadStatus && req.body.leadStatus !== prevStatus) {
      changes.push(`Status changed from "${prevStatus}" to "${req.body.leadStatus}"`);
    }
    if (req.body.leadName) changes.push(`Name updated to "${req.body.leadName}"`);
    if (req.body.followUpDate) changes.push(`Follow-up date set to ${new Date(req.body.followUpDate).toLocaleDateString('en-IN')}`);
    if (req.body.assignedTo) changes.push(`Assigned to updated`);
    if (req.body.remarks !== undefined && req.body.remarks !== prevLead.remarks) {
      const newRemarkText = String(req.body.remarks).trim();
      const prevRemarkText = String(prevLead.remarks || '').trim();
      if (newRemarkText.length > prevRemarkText.length) {
        const addedText = newRemarkText.slice(prevRemarkText.length).trim();
        changes.push(`Remark added: "${addedText.slice(0, 120)}${addedText.length > 120 ? '…' : ''}"`);
      } else {
        changes.push('Remarks updated');
      }
    }
    if (req.body.expectedValue) changes.push(`Expected value updated to ₹${Number(req.body.expectedValue).toLocaleString('en-IN')}`);
    if (changes.length > 0) {
      await logActivity(lead._id, 'Lead Updated', changes.join(' | '), req.user?.name || 'Admin');
    }

    return res.json({ success: true, data: lead });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH update lead status only (inline status change from table)
const updateLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

    const prevLead = await Lead.findById(req.params.id);
    if (!prevLead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const prevStatus = prevLead.leadStatus;

    prevLead.leadStatus = status;
    await prevLead.save();
    await logActivity(req.params.id, 'Status Changed', `Status changed from "${prevStatus}" to "${status}"`, req.user?.name || 'Admin');

    // Auto-create customer if status changed to won
    if (status === 'won' && prevStatus !== 'won') {
      const populatedLead = await Lead.findById(req.params.id).populate('assignedTo', 'name phone email');
      await autoCreateCustomer(populatedLead);
    }

    return res.json({ success: true, data: prevLead });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH update lead category only
const updateLeadCategory = async (req, res) => {
  try {
    const { category } = req.body;
    if (!['new', 'routine', 'closed'].includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { category },
      { new: true }
    ).populate('assignedTo', 'name phone');
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    await logActivity(req.params.id, 'Category Changed', `Category changed to "${category}"`, req.user?.name || 'Admin');
    return res.json({ success: true, data: lead });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST add note to lead
const addNote = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Note text is required' });
    }
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { $push: { notes: { text: text.trim(), createdAt: new Date() } } },
      { new: true }
    ).populate('assignedTo', 'name phone');
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    await logActivity(
      req.params.id,
      'Note Added',
      `Note: "${text.trim().slice(0, 120)}${text.trim().length > 120 ? '…' : ''}"`,
      req.user?.name || 'System'
    );

    return res.json({ success: true, data: lead });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE note from lead
const deleteNote = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { $pull: { notes: { _id: req.params.noteId } } },
      { new: true }
    );
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    await logActivity(req.params.id, 'Note Deleted', 'A note was removed', req.user?.name || 'Admin');
    return res.json({ success: true, data: lead });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE lead
const deleteLead = async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const scanNoteOCR = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    // Step 1 — OCR via OCR.space (base64)
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';
    const base64String = `data:${mimeType};base64,${base64Image}`;

    const formData = new FormData();
    formData.append('base64Image', base64String);
    formData.append('apikey', process.env.OCR_SPACE_API_KEY);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');

    const ocrRes = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body: formData });
    const ocrData = await ocrRes.json();
    console.log('OCR Response:', JSON.stringify(ocrData, null, 2));
    const rawText = ocrData?.ParsedResults?.[0]?.ParsedText || '';
    if (!rawText.trim()) {
      fs.unlinkSync(req.file.path);
      return res.status(422).json({ success: false, message: 'Could not extract text from image. Please try a clearer image.' });
    }

    // Step 2 — Clean up with Groq
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a transcription assistant. Clean up the OCR-extracted handwritten text. Fix spelling, punctuation and formatting. Return only the cleaned note text — no explanations, no preamble.',
          },
          {
            role: 'user',
            content: `Clean up this OCR text into a readable note:\n\n${rawText}`,
          },
        ],
        max_tokens: 500,
      }),
    });

    const groqData = await groqRes.json();
    const cleanText = groqData?.choices?.[0]?.message?.content?.trim() || rawText.trim();

    // Cleanup uploaded file
    fs.unlinkSync(req.file.path);

    return res.json({ success: true, text: cleanText });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('scanNoteOCR error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getLeads, getLead, createLead, updateLead,
  updateLeadStatus, updateLeadCategory,
  addNote, deleteNote, deleteLead, scanNoteOCR,
};