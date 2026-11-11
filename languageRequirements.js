const express = require('express');
const { supabase } = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const { parsePositiveInt, mapDatabaseError } = require('../utils/validate');

const router = express.Router();

// GET /api/language-requirements/university/:id
router.get(
  '/university/:id',
  asyncHandler(async (req, res, next) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const { data, error } = await supabase
      .from('language_requirements')
      .select('*')
      .eq('university_id', id)
      .order('test_name', { ascending: true });

    if (error) {
      return next(mapDatabaseError(error));
    }

    const rows = data || [];
    return res.status(200).json({
      data: rows,
      count: rows.length,
    });
  })
);

module.exports = router;

