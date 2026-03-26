const TDS  = require('../models/TDS.model');
const path = require('path');
const fs   = require('fs');

const tdsDir = path.join(process.cwd(), 'tds');
if (!fs.existsSync(tdsDir)) fs.mkdirSync(tdsDir, { recursive: true });

// helper: human-readable file size
const fmtSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// GET all TDS
const getTDSList = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const filter = {};
    if (status)   filter.status   = status;
    if (category) filter.category = { $regex: category, $options: 'i' };
    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { version:     { $regex: search, $options: 'i' } },
        { tags:        { $in: [new RegExp(search, 'i')] } },
      ];
    }
    const docs = await TDS.find(filter).sort({ createdAt: -1 });
    return res.json({
      success: true,
      data: docs.map(d => ({ ...d.toObject(), fileSizeFormatted: fmtSize(d.fileSize) }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET single TDS
const getTDS = async (req, res) => {
  try {
    const doc = await TDS.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    return res.json({ success: true, data: { ...doc.toObject(), fileSizeFormatted: fmtSize(doc.fileSize) } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST upload TDS
const uploadTDS = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { productName, productCode, category, version, description, tags } = req.body;
    if (!productName) return res.status(400).json({ success: false, message: 'Product name is required' });
    if (!version)     return res.status(400).json({ success: false, message: 'Version is required' });

    const parsedTags = tags
      ? tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const doc = await TDS.create({
      productName,
      productCode:  productCode || '',
      category:     category    || '',
      version,
      description:  description || '',
      fileName:     req.file.originalname,
      storedName:   req.file.filename,
      fileSize:     req.file.size,
      mimeType:     req.file.mimetype,
      tags:         parsedTags,
    });

    return res.status(201).json({
      success: true,
      data: { ...doc.toObject(), fileSizeFormatted: fmtSize(doc.fileSize) }
    });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT update metadata (no file change)
const updateTDS = async (req, res) => {
  try {
    const { productName, productCode, category, version, description, tags, status } = req.body;
    const parsedTags = tags
      ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean))
      : undefined;

    const update = {};
    if (productName !== undefined) update.productName = productName;
    if (productCode !== undefined) update.productCode = productCode;
    if (category    !== undefined) update.category    = category;
    if (version     !== undefined) update.version     = version;
    if (description !== undefined) update.description = description;
    if (status      !== undefined) update.status      = status;
    if (parsedTags  !== undefined) update.tags        = parsedTags;

    const doc = await TDS.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: { ...doc.toObject(), fileSizeFormatted: fmtSize(doc.fileSize) } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE TDS
const deleteTDS = async (req, res) => {
  try {
    const doc = await TDS.findByIdAndDelete(req.params.id);
    if (doc?.storedName) {
      const filePath = path.join(tdsDir, doc.storedName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    return res.json({ success: true, message: 'Document deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET download file
const downloadTDS = async (req, res) => {
  try {
    const doc = await TDS.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });

    const filePath = path.join(tdsDir, doc.storedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    return res.sendFile(filePath);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET unique categories
const getCategories = async (req, res) => {
  try {
    const cats = await TDS.distinct('category');
    return res.json({ success: true, data: cats.filter(Boolean).sort() });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTDSList, getTDS, uploadTDS, updateTDS, deleteTDS, downloadTDS, getCategories };