const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

/**
 * Validates a single transaction row.
 * @param {Object} row - The transaction data row.
 * @param {Object} config - Configuration object.
 * @param {Object} config.countryRules - Country rules { IN: 10, SG: 8, US: 10, UK: 11 }
 * @param {Array<string>} config.dateFormats - Accepted date formats
 * @param {Array<string>} [config.requiredFields] - Fields that must be present
 * @param {Array<string>} [config.paymentModes] - Permitted payment modes
 * @param {Set<string>} seenOrderIds - Set of order IDs seen so far in this file
 * @returns {Object} { isValid: boolean, errors: Array<string> }
 */
function validateRow(row, config, seenOrderIds) {
  const errors = [];

  // 1. Config Defaults
  const countryRules = config.countryRules || { IN: 10, SG: 8, US: 10 };
  const dateFormats = config.dateFormats || ["YYYY-MM-DD", "DD/MM/YYYY"];
  const paymentModes = config.paymentModes || ["UPI", "card", "cash", "netbanking", "wallet"];
  const requiredFields = config.requiredFields || ["order_id", "product_id", "amount", "payment_mode", "country_code"];

  // Normalize payment modes to lowercase for case-insensitive check
  const allowedPaymentModes = paymentModes.map(mode => mode.toLowerCase());

  // 2. Required Fields Check
  for (const field of requiredFields) {
    const val = row[field];
    if (val === undefined || val === null || String(val).trim() === '') {
      errors.push(`missing required field: ${field}`);
    }
  }

  // 3. Order ID Check
  const orderId = row.order_id ? String(row.order_id).trim() : '';
  if (!orderId) {
    // Check if order_id is required but missing, prompt specifies:
    // order_id → must not be empty → "order_id is required"
    if (!errors.includes('missing required field: order_id')) {
      errors.push("order_id is required");
    }
  } else {
    // 4. Duplicate order_id Detection
    if (seenOrderIds.has(orderId)) {
      errors.push("duplicate order_id");
    } else {
      seenOrderIds.add(orderId);
    }
  }

  // 5. Phone validation
  const countryCode = row.country_code ? String(row.country_code).trim().toUpperCase() : '';
  const phoneVal = row.phone !== undefined && row.phone !== null ? String(row.phone).trim() : '';

  if (!phoneVal) {
    errors.push("missing phone number");
  } else {
    // Strip all non-numeric chars from phone
    const cleanedPhone = phoneVal.replace(/\D/g, '');
    if (!/^\d+$/.test(phoneVal)) {
      errors.push(
        `phone number must contain digits only`
      );
    }

    if (!countryCode) {
      // If country code is empty but phone is present, it's an error
      errors.push(`unsupported country code: ${countryCode}`);
    } else if (!(countryCode in countryRules)) {
      // If country code is not in rules
      errors.push(`unsupported country code: ${countryCode}`);
    } else {
      // Check length matches expected
      const expectedLength = countryRules[countryCode];
      if (cleanedPhone.length !== expectedLength) {
        errors.push(`invalid phone number for country ${countryCode}. Expected ${expectedLength} digits`);
      }
    }
  }

  // 6. Date validation
  // Check order_date and any other date fields in the row (keys containing "date", case-insensitive)
  for (const key of Object.keys(row)) {
    if (key === '_originalData') continue;
    if (key.toLowerCase().includes('date')) {
      const dateVal = row[key] !== undefined && row[key] !== null ? String(row[key]).trim() : '';
      if (dateVal) {
        let isDateValid = false;
        for (const format of dateFormats) {
          if (dayjs(dateVal, format, true).isValid()) {
            isDateValid = true;
            break;
          }
        }
        if (!isDateValid) {
          errors.push(`invalid date format: ${dateVal}`);
        }
      }
    }
  }

  // 7. Amount check
  if (row.amount !== undefined && row.amount !== null && String(row.amount).trim() !== '') {
    const amountVal = Number(row.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      errors.push("invalid amount: must be a positive number");
    }
  }

  // 8. Payment mode check
  const payMode = row.payment_mode ? String(row.payment_mode).trim().toLowerCase() : '';
  if (payMode && !allowedPaymentModes.includes(payMode)) {
    errors.push(`invalid payment mode: ${row.payment_mode}`);
  }

  // 9. Email validation
  const emailVal = row.email !== undefined && row.email !== null ? String(row.email).trim() : '';
  if (emailVal) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      errors.push("invalid email format");
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

const transactionSignature = {
  orderIdentifiers: [
    "order_id", "orderid", "order_no", "txn_id", "transaction_id",
    "order_number", "ref_id", "reference_id", "invoice_id"
  ],
  amountIdentifiers: [
    "amount", "order_value", "price", "total", "cost", "value",
    "transaction_amount", "txn_amount", "order_amount", "grand_total"
  ],
  paymentIdentifiers: [
    "payment_mode", "pay_mode", "payment", "method", "payment_method",
    "mode_of_payment", "payment_type", "pay_type", "transaction_type"
  ]
};

function detectDatasetType(headers) {
  // normalize headers: lowercase + trim + remove special chars
  const normalized = headers.map(h => h.toLowerCase().trim().replace(/[^a-z0-9_]/g, ''));

  const results = {
    hasOrderColumn: false,
    hasAmountColumn: false,
    hasPaymentColumn: false,
    matchedColumns: {
      order: null,
      amount: null,
      payment: null
    }
  };

  // check each group
  for (let i = 0; i < headers.length; i++) {
    const originalHeader = headers[i];
    const header = normalized[i];
    if (transactionSignature.orderIdentifiers.includes(header)) {
      results.hasOrderColumn = true;
      results.matchedColumns.order = originalHeader;
    }
    if (transactionSignature.amountIdentifiers.includes(header)) {
      results.hasAmountColumn = true;
      results.matchedColumns.amount = originalHeader;
    }
    if (transactionSignature.paymentIdentifiers.includes(header)) {
      results.hasPaymentColumn = true;
      results.matchedColumns.payment = originalHeader;
    }
  }

  // must match at least 2 out of 3 signature groups to be considered a transaction file
  const matchCount = [
    results.hasOrderColumn,
    results.hasAmountColumn,
    results.hasPaymentColumn
  ].filter(Boolean).length;

  return {
    isTransactionDataset: matchCount >= 2,
    matchCount,
    matchedColumns: results.matchedColumns,
    missingGroups: {
      order: !results.hasOrderColumn,
      amount: !results.hasAmountColumn,
      payment: !results.hasPaymentColumn
    }
  };
}

const columnAliases = {
  order_id: [
    "order_id", "orderid", "order_no", "txn_id", "transaction_id",
    "order_number", "ref_id", "reference_id", "invoice_id", "receipt_id"
  ],
  product_id: [
    "product_id", "prod_id", "item_id", "sku", "product_code",
    "item_code", "product_no", "prod_code", "article_id"
  ],
  amount: [
    "amount", "order_value", "price", "total", "cost", "value",
    "transaction_amount", "txn_amount", "order_amount", "grand_total",
    "net_amount", "bill_amount", "invoice_amount", "payable"
  ],
  payment_mode: [
    "payment_mode", "pay_mode", "payment", "method", "payment_method",
    "mode_of_payment", "payment_type", "pay_type", "transaction_type",
    "payment_channel"
  ],
  country_code: [
    "country_code", "country", "region", "cc", "nation",
    "country_id", "geo", "location_code"
  ],
  phone: [
    "phone", "mobile", "contact", "phone_number", "mob",
    "cell", "telephone", "contact_no", "phone_no", "mobile_no",
    "contact_number", "whatsapp"
  ],
  order_date: [
    "order_date", "date", "txn_date", "created_at", "timestamp",
    "transaction_date", "purchase_date", "booking_date", "invoice_date",
    "order_time", "created_on"
  ],
  email: [
    "email", "email_id", "mail", "email_address",
    "customer_email", "user_email", "contact_email"
  ]
};

function suggestColumnMapping(csvHeaders) {
  const normalized = csvHeaders.map(h => h.toLowerCase().trim().replace(/[^a-z0-9_]/g, ''));
  const mapping = {};
  const usedHeaders = new Set();

  // for each expected field, find best matching CSV header
  for (const [expectedField, aliases] of Object.entries(columnAliases)) {
    for (let i = 0; i < normalized.length; i++) {
      if (aliases.includes(normalized[i]) && !usedHeaders.has(csvHeaders[i])) {
        mapping[expectedField] = {
          mappedTo: csvHeaders[i],       // original header from CSV
          confidence: 'auto',            // auto-detected
          index: i
        };
        usedHeaders.add(csvHeaders[i]);
        break;
      }
    }
    // if no match found, leave it as null (user must manually map)
    if (!mapping[expectedField]) {
      mapping[expectedField] = {
        mappedTo: null,
        confidence: 'manual',
        index: null
      };
    }
  }

  // also track unmapped CSV columns (extras that don't match any expected field)
  const mappedCsvHeaders = Object.values(mapping)
    .filter(m => m.mappedTo)
    .map(m => m.mappedTo);

  const unmappedCsvColumns = csvHeaders.filter(h => !mappedCsvHeaders.includes(h));

  return { mapping, unmappedCsvColumns, csvHeaders };
}

module.exports = {
  validateRow,
  detectDatasetType,
  suggestColumnMapping
};
