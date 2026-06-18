const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  uploadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Upload' },
  rowIndex: Number,
  rowData: Object,         // the full raw row as key-value pairs
  isValid: Boolean,
  errors: [String],        // list of error messages for this row
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
