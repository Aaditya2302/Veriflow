const express = require('express');
const router = express.Router();
const upload = require('../middleware/multerConfig');
const { handleUpload } = require('../controllers/uploadController');
const { detectColumns } = require('../controllers/detectController');

// POST /api/upload/detect
router.post('/detect', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, detectColumns);

// POST /api/upload
// Wrap multer in a custom handler to capture errors (like invalid file extension or size limits)
router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, handleUpload);

module.exports = router;
