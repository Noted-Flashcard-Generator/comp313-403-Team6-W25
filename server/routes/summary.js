const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const Summary = require('../models/Summary');
const checkSubscriptionLimit = require('../middleware/checkSubscriptionLimit');

const router = express.Router();

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: './summary/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Serve PDF files statically
router.use('/summary', express.static(path.join(__dirname, '../summary')));

// 1. Upload PDF and create initial record
router.post('/upload', authenticateToken, checkSubscriptionLimit,upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    // Create a new summary record with empty summary/extractedText
    const summary = new Summary({
      originalFileName: req.file.originalname,
      storedFilePath: `/summary/${req.file.filename}`,
      extractedText: "",
      summary: "",
      userId: req.user.userId
    });

    // Save to MongoDB
    await summary.save();

    // Return the file path and summary ID
    res.json({
      success: true,
      filePath: `/summary/${req.file.filename}`,
      summaryId: summary._id  // This is important for later updating the summary
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/upload-raw', authenticateToken, checkSubscriptionLimit,async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  try{
    const { title, text, summaryText } = req.body;
    const summary = new Summary({
      originalFileName: title,
      storedFilePath: "NA",
      extractedText: text,
      summary: summaryText,
      userId: req.user.userId
    });

    await summary.save();

    res.json({
      success: true,
      extractedText: summary.extractedText,
      summary: summary.summary,
      summaryId: summary._id
    });
  }catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ success: false, error: error.message });
  }

});

router.get('/get-pdfs', async (req, res) => {
    try {
      const summaryDir = path.join(__dirname, '../summary');
      const pdfFiles = fs.readdirSync(summaryDir).filter(file => file.endsWith('.pdf'));
  
      res.json({ success: true, pdfs: pdfFiles });
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      res.status(500).json({ success: false, error: 'Error fetching PDFs' });
    }
  });

// 2. NEW: Update summary after Flask API processing
router.patch('/update-summary', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const { summaryId, summary } = req.body;

  if (!summaryId) {
    return res.status(400).json({ success: false, error: 'Summary ID is required' });
  }

  try {
    // Find and update the summary document
    const result = await Summary.findOneAndUpdate(
      { _id: summaryId, userId: req.user.userId },  // Only find docs owned by this user
      { $set: { summary: summary } },
      { new: true }  // Return the updated document
    );

    if (!result) {
      return res.status(404).json({ 
        success: false, 
        error: 'Summary not found or you do not have permission to update it' 
      });
    }

    res.json({
      success: true,
      message: 'Summary updated successfully',
      summary: result
    });
  } catch (error) {
    console.error('Error updating summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Get all summaries
router.get('/summaries', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  
  try {
    const summaries = await Summary.find({ userId: req.user.userId })
                                   .sort({ createdAt: -1 });  // Sort by latest
    
    res.json({ success: true, summaries });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. NEW: View a specific summary
router.get('/summary/:id', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  
  try {
    const summary = await Summary.findOne({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });
    
    if (!summary) {
      return res.status(404).json({ 
        success: false, 
        error: 'Summary not found or you do not have permission to view it' 
      });
    }
    
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. NEW: Delete a specific summary
router.delete('/:id', authenticateToken, async (req, res) => {
  // console.log('DELETE request received for summary ID:', req.params.id);

  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const summary = await Summary.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!summary) {
      return res.status(404).json({
        success: false,
        error: 'Summary not found or you do not have permission to delete it'
      });
    }

    res.json({ success: true, message: 'Summary deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
