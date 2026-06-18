const fs = require('fs');
const Papa = require('papaparse');
const { detectDatasetType, suggestColumnMapping } = require('../utils/validationEngine');

const detectColumns = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded' });
  }

  const filePath = req.file.path;

  try {
    let headers = [];
    let previewRows = [];

    await new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(filePath);
      Papa.parse(fileStream, {
        header: true,
        preview: 10,
        skipEmptyLines: 'greedy',
        complete: function (results) {
          headers = results.meta.fields || [];
          previewRows = results.data || [];
          resolve();
        },
        error: function (err) {
          reject(err);
        }
      });
    });

    if (!headers || headers.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty or malformed' });
    }

    const detection = detectDatasetType(headers);

    if (!detection.isTransactionDataset) {
      return res.status(422).json({
        error: 'INVALID_DATASET_TYPE',
        message: 'This does not appear to be a transaction dataset.',
        details: {
          missingGroups: detection.missingGroups,
          foundHeaders: headers,
          hint: 'DataWash expects transaction data with order details, payment amounts, and payment mode information.'
        }
      });
    }

    const mappingSuggestion = suggestColumnMapping(headers);

    // Collect first non-empty value for each header from preview rows
    const sampleValues = {};
    for (const header of headers) {
      sampleValues[header] = null;
      for (const row of previewRows) {
        const val = row[header];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          sampleValues[header] = String(val).trim();
          break;
        }
      }
    }

    return res.status(200).json({
      headers,
      suggestedMapping: mappingSuggestion.mapping,
      unmappedCsvColumns: mappingSuggestion.unmappedCsvColumns,
      sampleValues
    });

  } catch (err) {
    console.error('Error in column detection:', err);
    return res.status(500).json({ error: err.message || 'An error occurred during column detection' });
  } finally {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (unlinkErr) {
      console.error('Failed to clean up temp CSV file in detectColumns:', unlinkErr);
    }
  }
};

module.exports = {
  detectColumns
};
