const express = require('express');
const { supabase } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const {
  isNumberInRange,
  parsePositiveInt,
  pick,
  mapDatabaseError,
} = require('../utils/validate');

const router = express.Router();

const ALLOWED_PROFILE_FIELDS = [
  'full_name',
  'phone',
  'nationality',
  'education_level',
  'gpa',
  'ielts_score',
  'preferred_country_id',
  'preferred_degree_level',
  'preferred_field',
  'budget_max',
];

// GET /api/profile
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    return res.status(200).json({ data: req.profile });
  })
);

// PUT /api/profile
router.put(
  '/',
  requireAuth,
  asyncHandler(async (req, res, next) => {
    const rawUpdates = pick(req.body, ALLOWED_PROFILE_FIELDS);
    const updates = {};
    const details = [];

    for (const [key, rawValue] of Object.entries(rawUpdates)) {
      if (rawValue === '' || rawValue === null) {
        updates[key] = null;
        continue;
      }

      if (key === 'gpa') {
        const num = Number(rawValue);
        if (!isNumberInRange(num, 0, 4)) {
          details.push('gpa: must be a number between 0 and 4');
        } else {
          updates.gpa = num;
        }
      } else if (key === 'ielts_score') {
        const num = Number(rawValue);
        if (!isNumberInRange(num, 0, 9)) {
          details.push('ielts_score: must be a number between 0 and 9');
        } else {
          updates.ielts_score = num;
        }
      } else if (key === 'budget_max') {
        const num = Number(rawValue);
        if (typeof num !== 'number' || Number.isNaN(num) || !Number.isFinite(num) || num < 0) {
          details.push('budget_max: must be a number >= 0');
        } else {
          updates.budget_max = num;
        }
      } else if (key === 'preferred_country_id') {
        const id = parsePositiveInt(rawValue);
        if (!id) {
          details.push('preferred_country_id: must be a positive integer');
        } else {
          updates.preferred_country_id = id;
        }
      } else {
        updates[key] = typeof rawValue === 'string' ? rawValue.trim() : String(rawValue);
      }
    }

    if (details.length > 0) {
      return res.status(400).json({
        error: details[0],
        details,
      });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select('*')
      .single();

    if (error) {
      return next(mapDatabaseError(error));
    }

    return res.status(200).json({ data });
  })
);

module.exports = router;

