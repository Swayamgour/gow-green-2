const Quotation = require('../models/Quotation.model');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require("pdfkit");

// ✅ Puppeteer FIX (Render compatible)
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

const quotationsDir = path.join(process.cwd(), 'quotations');
if (!fs.existsSync(quotationsDir)) fs.mkdirSync(quotationsDir, { recursive: true });

// ── compute totals helper ──────────────────────────────────
const computeTotals = (items = [], discountType, discountValue, taxType, taxRate) => {
  const subtotal = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  let discountAmount = 0;
  if (discountType === 'percent') discountAmount = (subtotal * Number(discountValue || 0)) / 100;
  else discountAmount = Number(discountValue || 0);

  const afterDiscount = subtotal - discountAmount;
  const taxAmount = taxType !== 'none' ? (afterDiscount * Number(taxRate || 0)) / 100 : 0;
  const grandTotal = afterDiscount + taxAmount;

  return { subtotal, discountAmount, taxAmount, grandTotal };
};

// GET all quotations
const getQuotations = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { quotationNo: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }
    const quotations = await Quotation.find(filter)
      .populate('preparedBy', 'name')
      .sort({ createdAt: -1 });
    return res.json({ success: true, data: quotations });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET single
const getQuotation = async (req, res) => {
  try {
    const q = await Quotation.findById(req.params.id).populate('preparedBy', 'name');
    if (!q) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: q });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST create + generate PDF
const createQuotation = async (req, res) => {
  try {
    const body = req.body;
    if (!body.preparedBy) body.preparedBy = null;

    // Recalculate amounts per item
    const items = (body.items || []).map((item, i) => ({
      ...item,
      srNo: i + 1,
      amount: Number(item.quantity || 0) * Number(item.rate || 0),
    }));

    const totals = computeTotals(items, body.discountType, body.discountValue, body.taxType, body.taxRate);

    const quotation = await Quotation.create({
      ...body,
      items,
      ...totals,
    });

    // Generate PDF
    const fileName = `QT_${quotation.quotationNo.replace(/[^a-zA-Z0-9]/g, '_')}_${uuidv4().slice(0, 8)}.pdf`;
    const filePath = path.join(quotationsDir, fileName);
    await generateQuotationPDF(quotation.toObject(), filePath);
    quotation.pdfPath = fileName;
    await quotation.save();

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return res.status(201).json({
      success: true,
      data: quotation,
      pdfUrl: `${baseUrl}/quotations/${fileName}`,
    });
  } catch (err) {
    console.error('Create quotation error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT update + regenerate PDF
const updateQuotation = async (req, res) => {
  try {
    const body = req.body;
    if (!body.preparedBy) body.preparedBy = null;
    const items = (body.items || []).map((item, i) => ({
      ...item,
      srNo: i + 1,
      amount: Number(item.quantity || 0) * Number(item.rate || 0),
    }));
    const totals = computeTotals(items, body.discountType, body.discountValue, body.taxType, body.taxRate);

    const existing = await Quotation.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });

    // Delete old PDF
    if (existing.pdfPath) {
      const oldPath = path.join(quotationsDir, existing.pdfPath);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    Object.assign(existing, { ...body, items, ...totals });
    await existing.save();

    // Regenerate PDF
    const fileName = `QT_${existing.quotationNo.replace(/[^a-zA-Z0-9]/g, '_')}_${uuidv4().slice(0, 8)}.pdf`;
    const filePath = path.join(quotationsDir, fileName);
    await generateQuotationPDF(existing.toObject(), filePath);
    existing.pdfPath = fileName;
    await existing.save();

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return res.json({
      success: true,
      data: existing,
      pdfUrl: `${baseUrl}/quotations/${fileName}`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH status
const updateStatus = async (req, res) => {
  try {
    const q = await Quotation.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    return res.json({ success: true, data: q });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE
const deleteQuotation = async (req, res) => {
  try {
    const q = await Quotation.findByIdAndDelete(req.params.id);
    if (q?.pdfPath) {
      const p = path.join(quotationsDir, q.pdfPath);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    return res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


const generatePriceListHTML = (data) => {
  return `
  <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 20px;
      }

      .price-container {
        width: 95%;
        margin: auto;
      }

      /* TOP GREEN HEADER */
      .main-header {
        background: #8cc63f;
        color: #fff;
        text-align: center;
        font-weight: bold;
        padding: 10px;
        font-size: 18px;
      }

      /* ORANGE SUB HEADER */
      .sub-header {
        background: #f47c20;
        color: #fff;
        text-align: center;
        font-weight: bold;
        padding: 6px;
        margin-top: 5px;
      }

      /* TABLE */
      .price-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 5px;
      }

      /* HEADERS */
      .price-table th {
        background: #8cc63f;
        color: #000;
        border: 1px solid #000;
        padding: 6px;
        font-size: 13px;
      }

      /* CELLS */
      .price-table td {
        border: 1px solid #000;
        padding: 6px;
        text-align: center;
        font-size: 12px;
      }

      /* ALTERNATE ROW COLOR */
      .price-table tbody tr:nth-child(even) {
        background: #dfe8d6;
      }

      /* IMAGE */
      .img-cell img {
        width: 120px;
        height: auto;
      }

      /* PRICE */
      .price {
        font-weight: bold;
      }
    </style>
  </head>

  <body>

    <div class="price-container">

      <div class="main-header">
        PRICE LIST OF GLOW GREEN LED PRODUCTS
      </div>

      <div class="sub-header">
        FLOOD LIGHT DOB SERIES (S)
      </div>

      <table class="price-table">
        <thead>
          <tr>
            <th>Picture</th>
            <th>Product Code</th>
            <th>Series</th>
            <th>Wattage</th>
            <th>Length (mm)</th>
            <th>Breadth (mm)</th>
            <th>Height (mm)</th>
            <th>Weight (Kg)</th>
            <th>Surge</th>
            <th>OEM PRICE</th>
          </tr>
        </thead>

        <tbody>
          ${data.map((item, i) => `
            <tr>
              ${i === 0 ? `
                <td rowspan="${data.length}" class="img-cell">
                  <img src="${item.image || 'https://via.placeholder.com/120'}" />
                </td>
              ` : ""}

              <td>${item.code}</td>
              <td>DFL (S) Series</td>
              <td>${item.watt}</td>
              <td>${item.length}</td>
              <td>${item.breadth}</td>
              <td>${item.height}</td>
              <td>${item.weight}</td>
              <td>${item.surge}</td>
              <td class="price">${item.price}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

    </div>

  </body>
  </html>
  `;
};

const generatePricePDF = async (data, filePath) => {
  const isProd = process.env.NODE_ENV === "production";

  let browser;

  if (isProd) {
    const puppeteer = require("puppeteer-core");
    const chromium = require("@sparticuz/chromium");

    browser = await puppeteer.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } else {
    const puppeteer = require("puppeteer");

    browser = await puppeteer.launch({
      headless: true,
    });
  }

  const page = await browser.newPage();

  const html = generatePriceListHTML(data);

  await page.setContent(html, { waitUntil: "networkidle0" });

  await page.pdf({
    path: filePath,
    format: "A4",
    printBackground: true,
  });

  await browser.close();
};






const downloadPDF = async (req, res) => {
  try {
    // 👉 DB se data lao
    const quotations = await Quotation.find();

    const data = quotations.map(q => ({
      code: q.productCode || q.quotationNo,
      watt: q.watt || "-",
      length: q.length || "-",
      breadth: q.breadth || "-",
      height: q.height || "-",
      weight: q.weight || "-",
      surge: q.surge || "-",
      price: q.grandTotal || 0,
    }));

    // 👉 simple HTML template
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 20px; }
            h2 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Price List</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Code</th>
                <th>Watt</th>
                <th>Length</th>
                <th>Breadth</th>
                <th>Height</th>
                <th>Weight</th>
                <th>Surge</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((d, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${d.code}</td>
                  <td>${d.watt}</td>
                  <td>${d.length}</td>
                  <td>${d.breadth}</td>
                  <td>${d.height}</td>
                  <td>${d.weight}</td>
                  <td>${d.surge}</td>
                  <td>₹ ${d.price}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // 👉 Puppeteer launch (Render compatible)
    const browser = await puppeteer.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const fileName = `price_list_${Date.now()}.pdf`;
    const filePath = path.join(quotationsDir, fileName);

    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    return res.json({
      success: true,
      pdfUrl: `${baseUrl}/quotations/${fileName}`,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};


module.exports = { getQuotations, getQuotation, createQuotation, updateQuotation, updateStatus, deleteQuotation, downloadPDF };