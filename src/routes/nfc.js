const express = require('express');
const NFCTag = require('../models/NFCTag');

const router = express.Router();

// POST /api/nfc/verify - Validate scanned tag exists in DB and is active. Login not required.
router.post('/verify', async (req, res) => {
  const trimmedTagId = req.body?.tagId != null && typeof req.body.tagId === 'string'
    ? req.body.tagId.trim()
    : '';

  try {
    if (!trimmedTagId) {
      console.log('[NFC] Verify rejected: tagId missing or empty');
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'tagId is required'
      });
    }

    const tag = await NFCTag.findOne({
      tagId: trimmedTagId,
      status: 'active'
    });

    const valid = !!tag;
    // Developer-friendly logs for Render / local: know if NFC verify is working and whether tag is in DB
    console.log(`[NFC] Verify tagId="${trimmedTagId}" -> valid=${valid} (tag ${valid ? 'found in DB' : 'not in DB or inactive'})`);

    res.json({
      success: true,
      valid
    });
  } catch (err) {
    console.error('[NFC] Verify error:', err);
    res.status(500).json({
      success: false,
      valid: false,
      message: 'Failed to verify NFC tag'
    });
  }
});

module.exports = router;
