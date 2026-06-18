const express = require('express');
const router = express.Router();
const { getHistory, getUploadDetail } = require('../controllers/historyController');

// GET /api/history
router.get('/', getHistory);

// GET /api/history/:uploadId
router.get('/:uploadId', getUploadDetail);

module.exports = router;
