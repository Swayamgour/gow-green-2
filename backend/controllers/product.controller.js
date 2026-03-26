const Product = require('../models/Product.model');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const getProducts = async (req, res) => {
  try {
    const { type, status, search } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
    const products = await Product.find(filter).sort({ type: 1, name: 1 });
    return res.json({ success: true, data: products });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const getProduct = async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: p });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const createProduct = async (req, res) => {
  try {
    const {
      name,
      code,
      type,
      hsn,
      image,
      price,
      status,

      rmDetails,
      smDetails,
      fmDetails
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: "Name and Type are required"
      });
    }

    // ✅ Base object
    const productData = {
      name,
      code,
      type,
      hsn,
      image,
      price,
      status
    };

    // ✅ Type-based data attach
    if (type === 'RM') {
      productData.rmDetails = rmDetails || {};
    }

    if (type === 'SM') {
      productData.smDetails = smDetails || {};
    }

    if (type === 'FM') {
      productData.fmDetails = fmDetails || {};
    }

    const product = await Product.create(productData);

    return res.status(201).json({
      success: true,
      data: product
    });

  } catch (err) {
    console.error("CREATE PRODUCT ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: product });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Deleted' });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const importProducts = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    const { type } = req.body; // 👈 IMPORTANT

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(req.file.path);

    const results = { created: 0, skipped: 0, errors: [] };

    for (const ws of wb.worksheets) {

      const rows = [];
      ws.eachRow((row, i) => {
        if (i > 1) rows.push(row.values);
      });

      for (const vals of rows) {
        try {
          const name = String(vals[2] || '').trim();
          if (!name) continue;

          // ✅ Duplicate check
          const existing = await Product.findOne({ name, type });
          if (existing) {
            results.skipped++;
            continue;
          }

          let productData = {
            name,
            code: String(vals[3] || '').trim(),
            type,
            hsn: String(vals[8] || '').trim(),
            price: Number(vals[9]) || 0,
            status: 'Active'
          };

          // ================= RM =================
          if (type === 'RM') {
            productData.rmDetails = {
              category1: String(vals[4] || '').trim(),
              category2: String(vals[5] || '').trim(),
              category3: String(vals[6] || '').trim(),
              unit: String(vals[7] || '').trim(),
              minQty: Number(vals[10]) || 0,
              maxQty: Number(vals[11]) || 0
            };
          }

          // ================= SM =================
          if (type === 'SM') {
            productData.smDetails = {
              category1: String(vals[3] || '').trim(),
              category2: String(vals[4] || '').trim(),
              category3: String(vals[5] || '').trim(),
              category4: String(vals[6] || '').trim(),
              category5: String(vals[7] || '').trim(),
              minQty: Number(vals[10]) || 0,
              maxQty: Number(vals[11]) || 0
            };
          }

          // ================= FM =================
          if (type === 'FM') {
            productData.fmDetails = {
              category1: String(vals[4] || '').trim(),
              category2: String(vals[5] || '').trim(),
              category3: String(vals[6] || '').trim(),
              brandName: String(vals[7] || '').trim(),
              reOrderQty: Number(vals[10]) || 0,
              weightPerBox: Number(vals[11]) || 0,
              qtyPerBox: Number(vals[12]) || 0,
              fgCost: Number(vals[13]) || 0
            };
          }

          await Product.create(productData);
          results.created++;

        } catch (e) {
          results.errors.push(e.message);
        }
      }
    }

    // ✅ delete file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.json({ success: true, data: results });

  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

const exportProducts = async (req, res) => {
  try {
    let { type } = req.query;

    type = type?.trim(); // ✅ fix

    // console.log(type)

    if (type === 'All' || !type) {
      type = '';
    }

    const filter = {};
    if (type) {
      filter.type = type.toUpperCase();
    }

    const products = await Product.find(filter).sort({ type: 1, name: 1 });

    const workbook = new ExcelJS.Workbook();

    const types = type ? [type.toUpperCase()] : ['RM', 'FM', 'SM'];

    types.forEach((t) => {
      const sheet = workbook.addWorksheet(`${t} Products`);

      sheet.columns = [
        { header: '#', key: 'sr', width: 5 },
        { header: 'Name', key: 'name', width: 28 },
        { header: 'Code', key: 'code', width: 14 },
        { header: 'Category', key: 'category', width: 16 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'HSN', key: 'hsn', width: 12 },
        { header: 'Price (₹)', key: 'price', width: 14 },
        { header: 'Stock', key: 'stock', width: 12 },
        { header: 'Description', key: 'description', width: 36 },
        { header: 'Status', key: 'status', width: 12 },
      ];

      const filteredProducts = products.filter(
        (p) => (p.type || '').toUpperCase() === t
      );

      filteredProducts.forEach((p, index) => {
        sheet.addRow({
          sr: index + 1,
          name: p.name,
          code: p.code,
          category: p.category,
          unit: p.unit,
          hsn: p.hsn,
          price: p.price,
          stock: p.stock,
          description: p.description,
          status: p.status,
        });
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Products_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("EXPORT ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


const getTemplate = async (req, res) => {
  try {
    const { type } = req.query;

    const wb = new ExcelJS.Workbook();

    const styleHeader = (sheet) => {
      const row = sheet.getRow(1);
      row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A3C6E' }
      };
    };

    // ================= RM =================
    if (!type || type === 'RM') {
      const rmSheet = wb.addWorksheet('RM Products');
      rmSheet.columns = [
        { header: '#', key: 'sr', width: 5 },
        { header: 'Product Name *', key: 'name', width: 28 },
        { header: 'Code', key: 'code', width: 14 },
        { header: 'Category1', key: 'category1', width: 16 },
        { header: 'Category2', key: 'category2', width: 16 },
        { header: 'Category3', key: 'category3', width: 16 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'HSN', key: 'hsn', width: 12 },
        { header: 'Price', key: 'price', width: 14 },
        { header: 'MinQty', key: 'minQty', width: 10 },
        { header: 'MaxQty', key: 'maxQty', width: 10 },
      ];
      styleHeader(rmSheet);
    }

    // ================= SM =================
    if (!type || type === 'SM') {
      const smSheet = wb.addWorksheet('SM Products');
      smSheet.columns = [
        { header: '#', key: 'sr', width: 5 },
        { header: 'Product Name *', key: 'name', width: 28 },
        { header: 'Category_sfg_1', key: 'cat1', width: 16 },
        { header: 'Category_sfg_2', key: 'cat2', width: 16 },
        { header: 'Category_sfg_3', key: 'cat3', width: 16 },
        { header: 'Category_sfg_4', key: 'cat4', width: 16 },
        { header: 'Category_sfg_5', key: 'cat5', width: 16 },
        { header: 'HSN', key: 'hsn', width: 12 },
        { header: 'Price', key: 'price', width: 14 },
        { header: 'MinQty', key: 'minQty', width: 10 },
        { header: 'MaxQty', key: 'maxQty', width: 10 },
      ];
      styleHeader(smSheet);
    }

    // ================= FM =================
    if (!type || type === 'FM') {
      const fmSheet = wb.addWorksheet('FM Products');
      fmSheet.columns = [
        { header: '#', key: 'sr', width: 5 },
        { header: 'Product Name *', key: 'name', width: 28 },
        { header: 'Category1', key: 'category1', width: 16 },
        { header: 'Category2', key: 'category2', width: 16 },
        { header: 'Category3', key: 'category3', width: 16 },
        { header: 'BrandName', key: 'brand', width: 16 },
        { header: 'HSN', key: 'hsn', width: 12 },
        { header: 'Price', key: 'price', width: 14 },
        { header: 'ReOrderQty', key: 'reorder', width: 12 },
        { header: 'Weight_Per_Box', key: 'weight', width: 14 },
        { header: 'Qty_Per_Box', key: 'qtyBox', width: 14 },
        { header: 'FG Cost', key: 'fgCost', width: 14 },
      ];
      styleHeader(fmSheet);
    }

    // ✅ Send file
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        `attachment; filename=${type || 'All'}_Template.xlsx`,
    });

    await wb.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("TEMPLATE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, importProducts, exportProducts, getTemplate };