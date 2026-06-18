const mongoose = require('mongoose');

const UploadSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  uploadedAt: { type: Date, default: Date.now },
  totalRows: Number,
  validRows: Number,
  invalidRows: Number,
  status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
  countryConfig: Object,   // stores the country code rules used
  dateFormats: [String],   // stores the accepted date formats used
});

module.exports = mongoose.model('Upload', UploadSchema);
