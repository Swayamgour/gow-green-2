const PDFDocument = require('pdfkit');
const fs = require('fs');

// ── helpers ──────────────────────────────────────────────────
const clean = (s) => (s || '').replace(/[^\x20-\x7E]/g, '');
const money  = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

// Color palette
const PRIMARY   = '#1a3c6e';
const ACCENT    = '#2563eb';
const LIGHT_BG  = '#f0f4ff';
const TABLE_HD  = '#1e3a5f';
const ALT_ROW   = '#f7f9ff';
const TEXT_DARK = '#111827';
const TEXT_MID  = '#374151';
const TEXT_GREY = '#6b7280';
const GREEN     = '#166534';
const GREEN_BG  = '#dcfce7';

const generateQuotationPDF = (quotation, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        autoFirstPage: false,
        bufferPages: true,
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      doc.addPage();

      const PW = doc.page.width;   // 595
      const PH = doc.page.height;  // 842
      const ML = 36, MR = 36;
      const CW = PW - ML - MR;     // content width

      let y = 0;

      // ── TOP HEADER BAND ─────────────────────────────────────
      doc.rect(0, 0, PW, 80).fill(PRIMARY);

      // Company name
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20)
        .text('GLOW GREEN', ML, 20, { width: CW * 0.6 });
      doc.fillColor('#93c5fd').font('Helvetica').fontSize(9)
        .text('Professional Sales Solutions', ML, 44);

      // QUOTATION label on right
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(26)
        .text('QUOTATION', ML + CW * 0.55, 18, { width: CW * 0.45, align: 'right' });
      doc.fillColor('#93c5fd').font('Helvetica').fontSize(9)
        .text(`No: ${clean(quotation.quotationNo)}`, ML + CW * 0.55, 50, { width: CW * 0.45, align: 'right' });

      y = 90;

      // ── INFO STRIP ──────────────────────────────────────────
      doc.rect(ML, y, CW, 56).fill(LIGHT_BG);

      // Left: Bill To
      doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(8)
        .text('BILL TO', ML + 10, y + 8);
      doc.fillColor(TEXT_DARK).font('Helvetica-Bold').fontSize(11)
        .text(clean(quotation.customerName), ML + 10, y + 20, { width: CW * 0.5 - 10 });
      if (quotation.customerAddress) {
        doc.fillColor(TEXT_MID).font('Helvetica').fontSize(8.5)
          .text(clean(quotation.customerAddress), ML + 10, y + 34, { width: CW * 0.5 - 10, lineBreak: false });
      }

      // Right: Quotation meta
      const metaX = ML + CW * 0.55;
      const metaW = CW * 0.45;
      const metaItems = [
        ['Date',       fmtDate(quotation.date)],
        ['Valid Till', fmtDate(quotation.validTill)],
        ['Series',     clean(quotation.series || 'GG')],
        ['Status',     (quotation.status || 'draft').toUpperCase()],
      ];
      metaItems.forEach(([label, val], i) => {
        const row = y + 8 + i * 11;
        doc.fillColor(TEXT_GREY).font('Helvetica').fontSize(7.5).text(label + ':', metaX, row, { width: metaW * 0.4 });
        doc.fillColor(TEXT_DARK).font('Helvetica-Bold').fontSize(7.5).text(val, metaX + metaW * 0.4, row, { width: metaW * 0.6 });
      });

      y += 66;

      // Contact row
      const contacts = [];
      if (quotation.customerPhone) contacts.push(`📞 ${quotation.customerPhone}`);
      if (quotation.customerEmail) contacts.push(`✉ ${quotation.customerEmail}`);
      if (quotation.customerGST)   contacts.push(`GST: ${quotation.customerGST}`);
      if (contacts.length) {
        doc.fillColor(TEXT_GREY).font('Helvetica').fontSize(8)
          .text(contacts.join('   |   '), ML, y, { width: CW });
        y += 14;
      }

      y += 6;

      // ── ITEMS TABLE ─────────────────────────────────────────
      const cols = {
        sr:   { x: ML,        w: 28  },
        desc: { x: ML + 28,   w: 200 },
        hsn:  { x: ML + 228,  w: 60  },
        qty:  { x: ML + 288,  w: 45  },
        unit: { x: ML + 333,  w: 38  },
        rate: { x: ML + 371,  w: 68  },
        amt:  { x: ML + 439,  w: 84  },
      };

      // Table header
      const TH = 18;
      doc.rect(ML, y, CW, TH).fill(TABLE_HD);
      const hdrs = ['Sr', 'Description', 'HSN', 'Qty', 'Unit', 'Rate (₹)', 'Amount (₹)'];
      const cKeys = ['sr', 'desc', 'hsn', 'qty', 'unit', 'rate', 'amt'];
      const aligns = ['center', 'left', 'center', 'center', 'center', 'right', 'right'];
      hdrs.forEach((h, i) => {
        const c = cols[cKeys[i]];
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8)
          .text(h, c.x + 3, y + 5, { width: c.w - 6, align: aligns[i] });
      });
      y += TH;

      // Rows
      const items = quotation.items || [];
      items.forEach((item, idx) => {
        const rowH = 18;
        if (idx % 2 === 1) doc.rect(ML, y, CW, rowH).fill(ALT_ROW);

        const vals = [
          String(item.srNo || idx + 1),
          clean(item.description),
          clean(item.hsnCode),
          String(item.quantity),
          clean(item.unit),
          money(item.rate).replace('Rs. ', ''),
          money(item.amount).replace('Rs. ', ''),
        ];
        vals.forEach((v, i) => {
          const c = cols[cKeys[i]];
          doc.fillColor(TEXT_DARK).font(i === 1 ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5)
            .text(v, c.x + 3, y + 4, { width: c.w - 6, align: aligns[i], lineBreak: false });
        });

        // row border
        doc.moveTo(ML, y + rowH).lineTo(ML + CW, y + rowH)
          .strokeColor('#e5e7eb').lineWidth(0.4).stroke();
        y += rowH;
      });

      // vertical dividers
      const dividers = [ML, cols.desc.x, cols.hsn.x, cols.qty.x, cols.unit.x, cols.rate.x, cols.amt.x, ML + CW];
      const tableTop = y - items.length * 18 - TH;
      dividers.forEach(x => {
        doc.moveTo(x, tableTop).lineTo(x, y)
          .strokeColor('#cbd5e1').lineWidth(0.4).stroke();
      });

      // outer border
      doc.rect(ML, tableTop, CW, y - tableTop)
        .strokeColor('#94a3b8').lineWidth(0.8).stroke();

      y += 6;

      // ── TOTALS BLOCK ────────────────────────────────────────
      const totW = 220;
      const totX = ML + CW - totW;

      const addTotRow = (label, value, bold = false, bgColor = null, textColor = TEXT_DARK) => {
        const rh = 16;
        if (bgColor) doc.rect(totX, y, totW, rh).fill(bgColor);
        doc.fillColor(TEXT_GREY).font('Helvetica').fontSize(8.5)
          .text(label, totX + 6, y + 4, { width: totW * 0.55 });
        doc.fillColor(textColor).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 9.5 : 8.5)
          .text(value, totX + totW * 0.55, y + 4, { width: totW * 0.42, align: 'right' });
        doc.moveTo(totX, y + rh).lineTo(totX + totW, y + rh)
          .strokeColor('#e5e7eb').lineWidth(0.4).stroke();
        y += rh;
      };

      addTotRow('Subtotal', money(quotation.subtotal));

      if (quotation.discountValue > 0) {
        const dLabel = quotation.discountType === 'percent'
          ? `Discount (${quotation.discountValue}%)`
          : 'Discount';
        addTotRow(dLabel, `- ${money(quotation.discountAmount)}`);
      }

      if (quotation.taxType !== 'none' && quotation.taxRate > 0) {
        const tLabel = quotation.taxType === 'igst'
          ? `IGST (${quotation.taxRate}%)`
          : `GST (${quotation.taxRate}%)`;
        addTotRow(tLabel, money(quotation.taxAmount));
      }

      addTotRow('GRAND TOTAL', money(quotation.grandTotal), true, GREEN_BG, GREEN);
      doc.rect(totX, y - 16 * (quotation.discountValue > 0 ? 3 : 2), totW,
        16 * (quotation.discountValue > 0 ? 3 : 2) + 16)
        .strokeColor('#94a3b8').lineWidth(0.8).stroke();

      y += 14;

      // ── TERMS & NOTES ────────────────────────────────────────
      if (quotation.terms) {
        doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(9).text('Terms & Conditions', ML, y);
        y += 12;
        doc.fillColor(TEXT_MID).font('Helvetica').fontSize(8.5)
          .text(clean(quotation.terms), ML, y, { width: CW * 0.65, lineBreak: true });
        y += 14;
      }

      if (quotation.notes) {
        doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(9).text('Notes', ML, y);
        y += 12;
        doc.fillColor(TEXT_MID).font('Helvetica').fontSize(8.5)
          .text(clean(quotation.notes), ML, y, { width: CW * 0.65 });
        y += 14;
      }

      // ── SIGNATURE ────────────────────────────────────────────
      const sigY = Math.max(y + 10, PH - 90);
      doc.moveTo(ML + CW - 140, sigY + 30).lineTo(ML + CW, sigY + 30)
        .strokeColor('#374151').lineWidth(0.8).stroke();
      doc.fillColor(TEXT_GREY).font('Helvetica').fontSize(8)
        .text('Authorised Signatory', ML + CW - 140, sigY + 34, { width: 140, align: 'center' });
      doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(8.5)
        .text('GLOW GREEN', ML + CW - 140, sigY + 44, { width: 140, align: 'center' });

      // ── FOOTER BAND ──────────────────────────────────────────
      doc.rect(0, PH - 28, PW, 28).fill(PRIMARY);
      doc.fillColor('#93c5fd').font('Helvetica').fontSize(7.5)
        .text('Thank you for your business!', ML, PH - 19, { width: CW / 2 });
      doc.fillColor('#93c5fd').font('Helvetica').fontSize(7.5)
        .text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, ML + CW / 2, PH - 19, { width: CW / 2, align: 'right' });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateQuotationPDF };