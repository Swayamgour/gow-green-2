const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
// const cors = require('cors');

const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Middleware ───────────────────────────────────────────────────────────────



app.use(express.json());
app.use((req, res, next) => {
  if (req.path === '/api/executives' && req.method === 'POST') {
    console.log('EXEC POST intercepted');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Auth:', req.headers['authorization'] ? 'present' : 'missing');
  }
  next();
});
app.use(express.urlencoded({ extended: true }));

// ─── Static files ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/moms', express.static(path.join(__dirname, 'moms')));
app.use('/quotations', express.static(path.join(__dirname, 'quotations')));
app.use('/tds', express.static(path.join(__dirname, 'tds')));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/executives', require('./routes/executive.routes'));
app.use('/api/leads', require('./routes/lead.routes'));
app.use('/api/mom', require('./routes/mom.routes'));
app.use('/api/customers', require('./routes/Customer.routes'));   // capital 
app.use('/api/products', require('./routes/product.routes'));    // needs to be created
app.use('/api/quotations', require('./routes/quotation.routes'));
app.use('/api/tds', require('./routes/tds.routes'));
app.use('/api/reports', require('./routes/reports.routes'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CRM API is running' });
});

app.post('/api/test-exec', require('./middleware/auth.middleware').protect, async (req, res) => {
  try {
    const Executive = require('./models/Executive.model');
    const AuthUser = require('./models/AuthUser.model');

    const exec = await Executive.create({
      name: 'Test Exec', phone: '9999999999',
      email: `test${Date.now()}@test.com`, status: 'active'
    });

    await AuthUser.create({
      name: exec.name, email: exec.email,
      password: 'test@123', role: 'executive'
    });

    await Executive.deleteOne({ _id: exec._id });
    await AuthUser.deleteOne({ email: exec.email });

    res.json({ success: true, message: 'Both models work with auth' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ─── MongoDB + Server start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });