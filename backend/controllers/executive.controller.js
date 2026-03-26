const Executive = require('../models/Executive.model');
const fs = require('fs');
const path = require('path');

// ─── GET all executives ───────────────────────────────────────────────────────
const getAllExecutives = async (req, res) => {
  try {
    const executives = await Executive.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: executives });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET single executive ─────────────────────────────────────────────────────
const getExecutiveById = async (req, res) => {
  try {
    const executive = await Executive.findById(req.params.id).select('-password');
    if (!executive) {
      return res.status(404).json({ success: false, message: 'Executive not found' });
    }
    res.status(200).json({ success: true, data: executive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── CREATE executive ─────────────────────────────────────────────────────────
const createExecutive = async (req, res) => {
  try {
    const AuthUser = require('../models/AuthUser.model');
    const name     = req.body?.name     || '';
    const phone    = req.body?.phone    || '';
    const email    = req.body?.email    || '';
    const password = req.body?.password || '';

    if (!name || !phone || !email || !password) {
      return res.status(400).json({
        success: false,
        message: `Missing fields — name:${!!name} phone:${!!phone} email:${!!email} password:${!!password}`,
      }); // <-- fixed: was missing closing ) and ;
    }

    const existingAuth = await AuthUser.findOne({ email: email.toLowerCase() });
    if (existingAuth) {
      return res.status(400).json({ success: false, message: 'This email is already registered as a user account. Please use a different email.' });
    }

    const executiveData = {
      name:   name.trim(),
      phone:  phone.trim(),
      email:  email.trim().toLowerCase(),
      status: 'active',
    };

    if (req.file) {
      executiveData.avatar = `uploads/${req.file.filename}`;
    }

    const executive = await Executive.create(executiveData);
    console.log('Executive created:', executive._id);

    await AuthUser.create({
      name:          executive.name,
      email:         executive.email,
      password:      password,
      plainPassword: password,
      role:          'executive',
    });
    console.log('AuthUser created');

    return res.status(201).json({ success: true, data: executive });
  } catch (err) {
    console.error('createExecutive error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── UPDATE executive ─────────────────────────────────────────────────────────
const updateExecutive = async (req, res) => {
  try {
    const executive = await Executive.findById(req.params.id);
    if (!executive) {
      return res.status(404).json({ success: false, message: 'Executive not found' });
    }

    const { name, phone, email, password, status } = req.body;

    if (req.file) {
      const fileData = fs.readFileSync(req.file.path);
      executive.avatar = `data:${req.file.mimetype};base64,${fileData.toString('base64')}`;
      fs.unlinkSync(req.file.path);
    }

    if (name     !== undefined) executive.name     = name;
    if (phone    !== undefined) executive.phone    = phone;
    if (email    !== undefined) executive.email    = email;
    if (password !== undefined) executive.password = password;
    if (status   !== undefined) executive.status   = status;

    await executive.save();

    const { password: _, ...data } = executive.toObject();
    res.status(200).json({ success: true, message: 'Executive updated', data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE executive ─────────────────────────────────────────────────────────
const deleteExecutive = async (req, res) => {
  try {
    const executive = await Executive.findById(req.params.id);
    if (!executive) {
      return res.status(404).json({ success: false, message: 'Executive not found' });
    }
    await executive.deleteOne();
    res.status(200).json({ success: true, message: 'Executive deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── UPDATE executive password ────────────────────────────────────────────────
const updateExecutivePassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const executive = await Executive.findById(req.params.id);
    if (!executive) {
      return res.status(404).json({ success: false, message: 'Executive not found' });
    }

    const AuthUser = require('../models/AuthUser.model');
    const authUser = await AuthUser.findOne({ email: executive.email });
    if (!authUser) {
      return res.status(404).json({ success: false, message: 'Login account not found for this executive' });
    }

    authUser.password      = password;
    authUser.plainPassword = password;
    await authUser.save();

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── VIEW executive password ──────────────────────────────────────────────────
const viewExecutivePassword = async (req, res) => {
  try {
    const executive = await Executive.findById(req.params.id);
    if (!executive) {
      return res.status(404).json({ success: false, message: 'Executive not found' });
    }

    const AuthUser = require('../models/AuthUser.model');
    const authUser = await AuthUser.findOne({ email: executive.email }).select('+password');
    if (!authUser) {
      return res.status(404).json({ success: false, message: 'Login account not found for this executive' });
    }

    if (authUser.plainPassword) {
      return res.json({ success: true, password: authUser.plainPassword });
    }

    return res.json({ success: true, password: '(Password was set before this feature was added — use Change Password to reset it)' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllExecutives,
  getExecutiveById,
  createExecutive,
  updateExecutive,
  deleteExecutive,
  updateExecutivePassword,
  viewExecutivePassword,
};