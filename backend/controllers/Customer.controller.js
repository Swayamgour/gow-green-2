const Customer = require('../models/Customer.model');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// GET all customers
const getCustomers = async (req, res) => {
  try {
    const { category, status, search, date, fromDate, toDate } = req.query;

    const filter = {};

    // ✅ Executive filter - using sman_id or smanid field
    if (req.user && req.user.role === 'executive') {
      const Executive = require('../models/Executive.model');
      const exec = await Executive.findOne({ email: req.user.email });
      if (exec) {
        // Use the appropriate field from your schema
        // Option 1: If you have a field that stores executive ID
        filter.sman_id = exec._id.toString(); // or exec.some identifier
        // Option 2: Or filter by salesmanname if that matches
        // filter.salemanname = exec.name;
      } else {
        return res.json({ success: true, data: [] });
      }
    }

    // ✅ Category & Status
    if (category) filter.category = category;
    if (status) filter.status = status;

    // ✅ Search
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { pname: { $regex: search, $options: 'i' } }, // Using pname instead of company
        { omobile: { $regex: search, $options: 'i' } }, // Using omobile instead of phone
        { oemail: { $regex: search, $options: 'i' } }, // Using oemail instead of email
        { city: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } }
      ];
    }

    // ✅ Date Filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // 👉 Today
    if (date === "today") {
      filter.createdAt = {
        $gte: today,
        $lt: tomorrow
      };
    }

    // 👉 Yesterday
    if (date === "yesterday") {
      filter.createdAt = {
        $gte: yesterday,
        $lt: today
      };
    }

    // 👉 Between Dates
    if (fromDate && toDate) {
      filter.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }

    // ✅ Remove populate since assignedTo doesn't exist
    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 });

    // If you need executive details, you can add them manually
    // Or modify the response to include executive info from your fields
    const enhancedCustomers = customers.map(customer => ({
      ...customer.toObject(),
      executiveInfo: {
        sman_id: customer.sman_id,
        smanid: customer.smanid,
        salemanname: customer.salemanname
      }
    }));

    return res.json({ success: true, data: enhancedCustomers });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET single customer
const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('assignedTo', 'name phone');
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    return res.json({ success: true, data: customer });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST create customer
const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    return res.status(201).json({ success: true, data: customer });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT update customer
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    return res.json({ success: true, data: customer });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE customer
const deleteCustomer = async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST add note
const addNote = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Note text required' });
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { $push: { notes: { text, createdAt: new Date() } } },
      { new: true }
    );
    return res.json({ success: true, data: customer });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


// const ExcelJS = require('exceljs');
// const Customer = require('../models/Customer');
//

// Export all customers to Excel
const exportExcel = async (req, res) => {
  try {
    const { category, status, search, date, fromDate, toDate } = req.query;

    const filter = {};

    // ✅ Category & Status
    if (category) filter.category = category;
    if (status) filter.status = status;

    // ✅ Search - Updated to match your schema fields
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { pname: { $regex: search, $options: 'i' } },
        { omobile: { $regex: search, $options: 'i' } },
        { oemail: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { stname: { $regex: search, $options: 'i' } }
      ];
    }

    // ✅ DATE FILTER
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date === "today") {
      filter.createdAt = { $gte: today, $lt: tomorrow };
    }

    if (date === "yesterday") {
      filter.createdAt = { $gte: yesterday, $lt: today };
    }

    if (fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);

      filter.createdAt = {
        $gte: start,
        $lte: end
      };
    }

    // ✅ APPLY FILTER HERE - Remove populate since assignedTo doesn't exist
    const customers = await Customer.find(filter).sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Customers');

    // Define columns matching your Excel structure
    sheet.columns = [
      { header: 'id', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'tp', key: 'tp', width: 8 },
      { header: 'Code', key: 'code', width: 15 },
      { header: 'GSTIN', key: 'gstin', width: 20 },
      { header: 'Pname', key: 'pname', width: 25 },
      { header: 'Add1', key: 'add1', width: 30 },
      { header: 'Add2', key: 'add2', width: 30 },
      { header: 'City', key: 'city', width: 15 },
      { header: 'Pin', key: 'pin', width: 10 },
      { header: 'OName', key: 'oname', width: 20 },
      { header: 'Omobile', key: 'omobile', width: 15 },
      { header: 'Ophone', key: 'ophone', width: 15 },
      { header: 'Oemail', key: 'oemail', width: 25 },
      { header: 'AMobile', key: 'amobile', width: 15 },
      { header: 'APhone', key: 'aphone', width: 15 },
      { header: 'AEmail', key: 'aemail', width: 25 },
      { header: 'Smobile', key: 'smobile', width: 15 },
      { header: 'Sphone', key: 'sphone', width: 15 },
      { header: 'Semail', key: 'semail', width: 25 },
      { header: 'StName', key: 'stname', width: 15 },
      { header: 'StCode', key: 'stcode', width: 8 },
      { header: 'PanNo', key: 'panno', width: 15 },
      { header: 'Margin', key: 'margin', width: 10 },
      { header: 'BillAdd', key: 'billadd', width: 30 },
      { header: 'DespAdd', key: 'despadd', width: 30 },
      { header: 'BillAdd2', key: 'billadd2', width: 30 },
      { header: 'BillAdd3', key: 'billadd3', width: 30 },
      { header: 'DespAdd2', key: 'despadd2', width: 30 },
      { header: 'DespAdd3', key: 'despadd3', width: 30 },
      { header: 'gstnBill', key: 'gstnbill', width: 20 },
      { header: 'gstnShip', key: 'gstnship', width: 20 },
      { header: 'AgentId', key: 'agentid', width: 10 },
      { header: 'SvrPost', key: 'svrpost', width: 8 },
      { header: 'Grp', key: 'grp', width: 15 },
      { header: 'AccNo', key: 'accno', width: 20 },
      { header: 'Benif_Name', key: 'benif_name', width: 25 },
      { header: 'BankName', key: 'bankname', width: 20 },
      { header: 'BranchName', key: 'branchname', width: 20 },
      { header: 'BranchAdd', key: 'branchadd', width: 30 },
      { header: 'ifsc_Code', key: 'ifsc_code', width: 15 },
      { header: 'JOBWORK', key: 'jobwork', width: 8 },
      { header: 'Active', key: 'active', width: 8 },
      { header: 'sman_id', key: 'sman_id', width: 10 },
      { header: 'ShipPanno', key: 'shippanno', width: 15 },
      { header: 'State', key: 'state', width: 15 },
      { header: 'Disp_StateName', key: 'disp_statename', width: 15 },
      { header: 'Disp_StateCode', key: 'disp_statecode', width: 8 },
      { header: 'Disp_pin', key: 'disp_pin', width: 10 },
      { header: 'Freight', key: 'freight', width: 10 },
      { header: 'ShippingName', key: 'shippingname', width: 25 },
      { header: 'ConPerson', key: 'conperson', width: 20 },
      { header: 'SmanId', key: 'smanid', width: 10 },
      { header: 'Salemanname', key: 'salemanname', width: 20 },
      { header: 'ActiveYN', key: 'activeyn', width: 8 },
      { header: 'Created At', key: 'createdAt', width: 20 } // Added Created At
    ];

    // Style the header row
    sheet.getRow(1).eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' }
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add data rows
    customers.forEach((c) => {
      sheet.addRow({
        id: c.id || '',
        name: c.name || '',
        tp: c.tp || '',
        code: c.code || '',
        gstin: c.gstin || '',
        pname: c.pname || '',
        add1: c.add1 || '',
        add2: c.add2 || '',
        city: c.city || '',
        pin: c.pin || '',
        oname: c.oname || '',
        omobile: c.omobile || '',
        ophone: c.ophone || '',
        oemail: c.oemail || '',
        amobile: c.amobile || '',
        aphone: c.aphone || '',
        aemail: c.aemail || '',
        smobile: c.smobile || '',
        sphone: c.sphone || '',
        semail: c.semail || '',
        stname: c.stname || '',
        stcode: c.stcode || '',
        panno: c.panno || '',
        margin: c.margin || 0,
        billadd: c.billadd || '',
        despadd: c.despadd || '',
        billadd2: c.billadd2 || '',
        billadd3: c.billadd3 || '',
        despadd2: c.despadd2 || '',
        despadd3: c.despadd3 || '',
        gstnbill: c.gstnbill || '',
        gstnship: c.gstnship || '',
        agentid: c.agentid || '',
        svrpost: c.svrpost || '',
        grp: c.grp || '',
        accno: c.accno || '',
        benif_name: c.benif_name || '',
        bankname: c.bankname || '',
        branchname: c.branchname || '',
        branchadd: c.branchadd || '',
        ifsc_code: c.ifsc_code || '',
        jobwork: c.jobwork || '',
        active: c.active || '',
        sman_id: c.sman_id || '',
        shippanno: c.shippanno || '',
        state: c.state || '',
        disp_statename: c.disp_statename || '',
        disp_statecode: c.disp_statecode || '',
        disp_pin: c.disp_pin || '',
        freight: c.freight || 0,
        shippingname: c.shippingname || '',
        conperson: c.conperson || '',
        smanid: c.smanid || '',
        salemanname: c.salemanname || '',
        activeyn: c.activeyn || 'Y',
        createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : ''
      });
    });

    // Add summary row with filter information
    sheet.addRow([]);
    sheet.addRow(['Filter Summary:']);
    sheet.addRow([`Total Records: ${customers.length}`]);
    if (category) sheet.addRow([`Category: ${category}`]);
    if (status) sheet.addRow([`Status: ${status}`]);
    if (search) sheet.addRow([`Search: ${search}`]);
    if (date) sheet.addRow([`Date Filter: ${date}`]);
    if (fromDate && toDate) sheet.addRow([`Date Range: ${fromDate} to ${toDate}`]);
    sheet.addRow([`Exported On: ${new Date().toLocaleString('en-IN')}`]);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=customers.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Export Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// GET export to Excel


// POST import from Excel
// Import customers from Excel
const importExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const sheet = workbook.worksheets[0];

    const customers = [];
    const errors = [];
    let rowNum = 0;

    sheet.eachRow((row, rowNumber) => {
      rowNum = rowNumber;
      if (rowNumber === 1) return; // Skip header row

      try {
        // Get values from each column
        const customer = {
          id: row.getCell(1).value || null,
          name: row.getCell(2).value?.toString().trim() || '',
          tp: row.getCell(3).value?.toString().trim() || '',
          code: row.getCell(4).value?.toString().trim() || '',
          gstin: row.getCell(5).value?.toString().trim() || '',
          pname: row.getCell(6).value?.toString().trim() || '',
          add1: row.getCell(7).value?.toString().trim() || '',
          add2: row.getCell(8).value?.toString().trim() || '',
          city: row.getCell(9).value?.toString().trim() || '',
          pin: row.getCell(10).value?.toString().trim() || '',
          oname: row.getCell(11).value?.toString().trim() || '',
          omobile: row.getCell(12).value?.toString().trim() || '',
          ophone: row.getCell(13).value?.toString().trim() || '',
          oemail: row.getCell(14).value?.toString().trim() || '',
          amobile: row.getCell(15).value?.toString().trim() || '',
          aphone: row.getCell(16).value?.toString().trim() || '',
          aemail: row.getCell(17).value?.toString().trim() || '',
          smobile: row.getCell(18).value?.toString().trim() || '',
          sphone: row.getCell(19).value?.toString().trim() || '',
          semail: row.getCell(20).value?.toString().trim() || '',
          stname: row.getCell(21).value?.toString().trim() || '',
          stcode: row.getCell(22).value?.toString().trim() || '',
          panno: row.getCell(23).value?.toString().trim() || '',
          margin: parseFloat(row.getCell(24).value) || 0,
          billadd: row.getCell(25).value?.toString().trim() || '',
          despadd: row.getCell(26).value?.toString().trim() || '',
          billadd2: row.getCell(27).value?.toString().trim() || '',
          billadd3: row.getCell(28).value?.toString().trim() || '',
          despadd2: row.getCell(29).value?.toString().trim() || '',
          despadd3: row.getCell(30).value?.toString().trim() || '',
          gstnbill: row.getCell(31).value?.toString().trim() || '',
          gstnship: row.getCell(32).value?.toString().trim() || '',
          agentid: row.getCell(33).value?.toString().trim() || '',
          svrpost: row.getCell(34).value?.toString().trim() || '',
          grp: row.getCell(35).value?.toString().trim() || '',
          accno: row.getCell(36).value?.toString().trim() || '',
          benif_name: row.getCell(37).value?.toString().trim() || '',
          bankname: row.getCell(38).value?.toString().trim() || '',
          branchname: row.getCell(39).value?.toString().trim() || '',
          branchadd: row.getCell(40).value?.toString().trim() || '',
          ifsc_code: row.getCell(41).value?.toString().trim() || '',
          jobwork: row.getCell(42).value?.toString().trim() || '',
          active: row.getCell(43).value?.toString().trim() || '',
          sman_id: row.getCell(44).value?.toString().trim() || '',
          shippanno: row.getCell(45).value?.toString().trim() || '',
          state: row.getCell(46).value?.toString().trim() || '',
          disp_statename: row.getCell(47).value?.toString().trim() || '',
          disp_statecode: row.getCell(48).value?.toString().trim() || '',
          disp_pin: row.getCell(49).value?.toString().trim() || '',
          freight: parseFloat(row.getCell(50).value) || 0,
          shippingname: row.getCell(51).value?.toString().trim() || '',
          conperson: row.getCell(52).value?.toString().trim() || '',
          smanid: row.getCell(53).value?.toString().trim() || '',
          salemanname: row.getCell(54).value?.toString().trim() || '',
          activeyn: row.getCell(55).value?.toString().trim() || 'Y'
        };

        // Validate required fields
        if (!customer.name) {
          errors.push(`Row ${rowNumber}: Name is required`);
          return;
        }

        customers.push(customer);

      } catch (e) {
        errors.push(`Row ${rowNumber}: ${e.message}`);
      }
    });

    // Insert customers if any
    if (customers.length > 0) {
      await Customer.insertMany(customers, { ordered: false });
    }

    // Clean up uploaded file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      success: true,
      imported: customers.length,
      totalRows: rowNum - 1,
      errors: errors
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET download Excel template
// Download Excel template
const downloadTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Customers');

    // Define columns with headers
    const headers = [
      'id', 'Name', 'tp', 'Code', 'GSTIN', 'Pname', 'Add1', 'Add2', 'City', 'Pin',
      'OName', 'Omobile', 'Ophone', 'Oemail', 'AMobile', 'APhone', 'AEmail',
      'Smobile', 'Sphone', 'Semail', 'StName', 'StCode', 'PanNo', 'Margin',
      'BillAdd', 'DespAdd', 'BillAdd2', 'BillAdd3', 'DespAdd2', 'DespAdd3',
      'gstnBill', 'gstnShip', 'AgentId', 'SvrPost', 'Grp', 'AccNo', 'Benif_Name',
      'BankName', 'BranchName', 'BranchAdd', 'ifsc_Code', 'JOBWORK', 'Active',
      'sman_id', 'ShipPanno', 'State', 'Disp_StateName', 'Disp_StateCode',
      'Disp_pin', 'Freight', 'ShippingName', 'ConPerson', 'SmanId', 'Salemanname', 'ActiveYN'
    ];

    sheet.columns = headers.map(header => ({
      header: header,
      key: header.toLowerCase().replace(/[^a-z0-9]/g, ''),
      width: header.includes('Add') ? 30 :
        header.includes('Name') ? 25 :
          header.includes('Email') ? 25 : 15
    }));

    // Style header row
    sheet.getRow(1).eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' }
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add sample data from your provided example
    sheet.addRow([
      146, // id
      'AKSHAT AUTOLINE PVT LTD', // Name
      'D', // tp
      '110824', // Code
      '09AABCA8972B1ZO', // GSTIN
      'AKSHAT AUTOLINE PVT LTD', // Pname
      '10TH KM MILE STONE, DELHI', // Add1
      'ROAD,NEAR PARTAPUR POLICE,STATION ,MEERUT - 250103', // Add2
      'MEERUT', // City
      '250103', // Pin
      'MR. SHOBHIT GUPTA', // OName
      '9045045390', // Omobile
      '', // Ophone
      'shobhit@tejasledlighting.com', // Oemail
      '', // AMobile
      '', // APhone
      '', // AEmail
      '7055078690', // Smobile
      '', // Sphone
      'purchase@akshatauto.com', // Semail
      'UTTAR PRADESH', // StName
      '09', // StCode
      'AABCA8972B', // PanNo
      0, // Margin
      '10TH KM MILE STONE, DELHI', // BillAdd
      '', // DespAdd
      '', // BillAdd2
      '', // BillAdd3
      'ROAD,NEAR PARTAPUR POLICE,STATION,MEERUT - 250103', // DespAdd2
      '', // DespAdd3
      '09AABCA8972B1ZO', // gstnBill
      '', // gstnShip
      '', // AgentId
      'N', // SvrPost
      'SUNDRY DEBTORS', // Grp
      '', // AccNo
      '', // Benif_Name
      '', // BankName
      '', // BranchName
      '', // BranchAdd
      '', // ifsc_Code
      '', // JOBWORK
      '', // Active
      '17', // sman_id
      'AABCA8972B', // ShipPanno
      '', // State
      'UTTAR PRADESH', // Disp_StateName
      '09', // Disp_StateCode
      '250103', // Disp_pin
      '', // Freight
      'AKSHAT AUTOLINE PVT LTD', // ShippingName
      '', // ConPerson
      '17', // SmanId
      'NON ROUTINE OEM', // Salemanname
      'Y' // ActiveYN
    ]);

    // Add a second empty row for user to fill
    const emptyRow = Array(headers.length).fill('');
    sheet.addRow(emptyRow);

    // Add instructions at the bottom
    // sheet.addRow([]);
    // sheet.addRow(['Instructions:']);
    // sheet.addRow(['1. First row is sample data - you can delete it']);
    // sheet.addRow(['2. Fields marked with * are required']);
    // sheet.addRow(['3. Do not change the header row']);
    // sheet.addRow(['4. You can add multiple rows of data']);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=customer_template.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, addNote, exportExcel, importExcel, downloadTemplate };