const express = require('express');
const NFCTag = require('../models/NFCTag');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const adminSecret = process.env.ADMIN_SECRET;

// POST /api/nfc/admin/add - Add a tag to DB (pre-save). Requires Admin-Secret header. User does not register tags.
router.post('/admin/add', async (req, res) => {
  const secret = req.headers['admin-secret'];
  if (!adminSecret || secret !== adminSecret) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  try {
    const { tagId } = req.body;
    if (!tagId || typeof tagId !== 'string' || !tagId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'tagId is required and must be a non-empty string'
      });
    }
    const trimmedTagId = tagId.trim();
    const existing = await NFCTag.findOne({ tagId: trimmedTagId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This tag already exists in DB'
      });
    }
    const tag = await NFCTag.create({ tagId: trimmedTagId, status: 'active' });
    res.status(201).json({
      success: true,
      message: 'NFC tag added to DB',
      tagId: tag.tagId
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Tag already exists' });
    }
    console.error('NFC admin add error:', err);
    res.status(500).json({ success: false, message: 'Failed to add tag' });
  }
});

// POST /api/nfc/verify - User is logged in; validate scanned tag exists in DB and is active. If match, proceed.
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { tagId } = req.body;

    if (!tagId || typeof tagId !== 'string' || !tagId.trim()) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'tagId is required'
      });
    }

    const tag = await NFCTag.findOne({
      tagId: tagId.trim(),
      status: 'active'
    });

    res.json({
      success: true,
      valid: !!tag
    });
  } catch (err) {
    console.error('NFC verify error:', err);
    res.status(500).json({
      success: false,
      valid: false,
      message: 'Failed to verify NFC tag'
    });
  }
});

module.exports = router;
