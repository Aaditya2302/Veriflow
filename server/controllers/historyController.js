const Upload = require('../models/Upload');
const Transaction = require('../models/Transaction');

// GET /api/history - returns all upload metadata records sorted by uploadedAt descending
const getHistory = async (req, res) => {
  try {
    const history = await Upload.find().sort({ uploadedAt: -1 });
    return res.status(200).json(history);
  } catch (err) {
    console.error('Error fetching history:', err);
    return res.status(500).json({ error: err.message || 'An error occurred fetching history' });
  }
};

// GET /api/history/:uploadId - returns details of a specific upload + its transaction items
const getUploadDetail = async (req, res) => {
  try {
    const { uploadId } = req.params;
    const upload = await Upload.findById(uploadId);
    if (!upload) {
      return res.status(404).json({ error: 'Upload record not found' });
    }

    const transactions = await Transaction.find({ uploadId }).sort({ rowIndex: 1 });
    return res.status(200).json({
      upload,
      transactions
    });
  } catch (err) {
    console.error('Error fetching upload details:', err);
    return res.status(500).json({ error: err.message || 'An error occurred fetching upload details' });
  }
};

module.exports = {
  getHistory,
  getUploadDetail
};
