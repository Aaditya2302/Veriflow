const fs = require('fs');
const Papa = require('papaparse');
const Upload = require('../models/Upload');
const Transaction = require('../models/Transaction');
const { validateRow } = require('../utils/validationEngine');

const handleUpload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded' });
  }

  const filePath = req.file.path;
  let uploadDoc = null;

  try {
    // 1. Parse configuration with fallbacks
    let countryRules = { IN: 10, SG: 8, US: 10 };
    let dateFormats = ["YYYY-MM-DD", "DD/MM/YYYY"];
    let requiredFields = ["order_id", "product_id", "amount", "payment_mode", "country_code"];
    let paymentModes = ["UPI", "card", "cash", "netbanking", "wallet"];

    if (req.body.countryRules) {
      try {
        countryRules = JSON.parse(req.body.countryRules);
      } catch (e) {
        console.warn('Failed to parse countryRules from request body, using default.');
      }
    }
    if (req.body.dateFormats) {
      try {
        dateFormats = JSON.parse(req.body.dateFormats);
      } catch (e) {
        console.warn('Failed to parse dateFormats from request body, using default.');
      }
    }
    if (req.body.requiredFields) {
      try {
        requiredFields = JSON.parse(req.body.requiredFields);
      } catch (e) {
        console.warn('Failed to parse requiredFields from request body, using default.');
      }
    }
    if (req.body.paymentModes) {
      try {
        paymentModes = JSON.parse(req.body.paymentModes);
      } catch (e) {
        console.warn('Failed to parse paymentModes from request body, using default.');
      }
    }

    let confirmedMapping = null;
    if (req.body.confirmedMapping) {
      try {
        confirmedMapping = JSON.parse(req.body.confirmedMapping);
      } catch (e) {
        console.warn('Failed to parse confirmedMapping from request body.');
      }
    }

    // 2. Read and parse CSV using Node.js streaming API
    const rows = await new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(filePath);
      const parsedData = [];
      Papa.parse(fileStream, {
        header: true,
        skipEmptyLines: 'greedy', // skips empty lines and whitespace lines
        chunk: function (results) {
          parsedData.push(...results.data);
        },
        complete: function () {
          resolve(parsedData);
        },
        error: function (err) {
          reject(err);
        }
      });
    });

    // 3. Empty CSV validation
    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: "CSV file is empty or malformed" });
    }

    // 4. Normalize rows according to confirmedMapping
    const normalizedRows = [];
    if (confirmedMapping) {
      for (const row of rows) {
        const normalizedRow = {};
        for (const [standardField, csvColumn] of Object.entries(confirmedMapping)) {
          if (csvColumn && row[csvColumn] !== undefined) {
            normalizedRow[standardField] = row[csvColumn];
          } else {
            normalizedRow[standardField] = undefined;
          }
        }
        normalizedRow._originalData = row;
        normalizedRows.push(normalizedRow);
      }
    } else {
      for (const row of rows) {
        normalizedRows.push(row);
      }
    }

    // 5. Create an Upload document in MongoDB (status: processing)
    uploadDoc = await Upload.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      status: 'processing',
      totalRows: normalizedRows.length,
      validRows: 0,
      invalidRows: 0,
      countryConfig: countryRules,
      dateFormats: dateFormats
    });

    // 6. Loop through and validate rows
    const seenOrderIds = new Set();
    const transactionDocs = [];
    let validCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < normalizedRows.length; i++) {
      const row = normalizedRows[i];
      const validationResult = validateRow(row, {
        countryRules,
        dateFormats,
        requiredFields,
        paymentModes
      }, seenOrderIds);

      if (validationResult.isValid) {
        validCount++;
      } else {
        invalidCount++;
      }

      transactionDocs.push({
        uploadId: uploadDoc._id,
        rowIndex: i + 1, // 1-indexed for row numbers in validation tables
        rowData: row,
        isValid: validationResult.isValid,
        errors: validationResult.errors
      });
    }

    // 6. Bulk insert all Transaction documents
    // For files > 5000 rows, use { ordered: false } for performance
    const insertOptions = transactionDocs.length > 5000 ? { ordered: false } : {};
    await Transaction.insertMany(transactionDocs, insertOptions);

    // 7. Update Upload document with validation stats
    uploadDoc.validRows = validCount;
    uploadDoc.invalidRows = invalidCount;
    uploadDoc.status = 'completed';
    await uploadDoc.save();

    // 8. Return JSON response
    return res.status(200).json({
      uploadId: uploadDoc._id,
      totalRows: rows.length,
      validRows: validCount,
      invalidRows: invalidCount,
      transactions: transactionDocs
    });

  } catch (err) {
    console.error('Error handling CSV upload:', err);
    if (uploadDoc) {
      try {
        uploadDoc.status = 'failed';
        await uploadDoc.save();
      } catch (dbErr) {
        console.error('Failed to set upload status to failed:', dbErr);
      }
    }
    return res.status(500).json({ error: err.message || 'An error occurred during transaction processing' });
  } finally {
    // 9. Cleanup the temp file from uploads/ folder
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (unlinkErr) {
      console.error('Failed to clean up temp CSV file:', unlinkErr);
    }
  }
};

module.exports = {
  handleUpload
};
