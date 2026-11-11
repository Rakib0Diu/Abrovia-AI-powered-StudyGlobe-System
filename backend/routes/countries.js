const express = require('express');
const { supabase } = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const { parsePositiveInt, mapDatabaseError } = require('../utils/validate');

const router = express.Router();

// GET /api/countries
router.get(
  '/',
  asyncHandler(async (req, res, next) => {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    let query = supabase.from('countries').select('*').order('name', { ascending: true });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;
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

// GET /api/countries/:id
router.get(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return next(mapDatabaseError(error));
    }

    if (!data) {
      return res.status(404).json({ error: 'Country not found' });
    }

    return res.status(200).json({ data });
  })
);

module.exports = router;

