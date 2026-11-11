const express = require('express');
const { supabase } = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const { parsePositiveInt, mapDatabaseError } = require('../utils/validate');

const router = express.Router();

// GET /api/programs
router.get(
  '/',
  asyncHandler(async (req, res, next) => {
    const degreeLevel =
      typeof req.query.degree_level === 'string' ? req.query.degree_level.trim() : '';
    const field = typeof req.query.field === 'string' ? req.query.field.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    let universityId = null;
    if (req.query.university_id !== undefined && String(req.query.university_id).trim() !== '') {
      universityId = parsePositiveInt(req.query.university_id);
      if (!universityId) {
        return res.status(400).json({ error: 'Invalid university_id' });
      }
    }

    let limit = 100;
    if (req.query.limit !== undefined && String(req.query.limit).trim() !== '') {
      const parsedLimit = parsePositiveInt(req.query.limit);
      if (!parsedLimit) {
        return res.status(400).json({ error: 'Invalid limit' });
      }
      limit = Math.min(parsedLimit, 500);
    }

    let query = supabase
      .from('programs')
      .select('*, university:universities(id, name, city, country_id)')
      .order('name', { ascending: true })
      .limit(limit);

    if (universityId !== null) {
      query = query.eq('university_id', universityId);
    }

    if (degreeLevel) {
      query = query.eq('degree_level', degreeLevel);
    }

    if (field) {
      query = query.ilike('field', `%${field}%`);
    }

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

// GET /api/programs/fields (registered before /:id)
router.get(
  '/fields',
  asyncHandler(async (req, res, next) => {
    const { data, error } = await supabase
      .from('programs')
      .select('field')
      .not('field', 'is', null);

    if (error) {
      return next(mapDatabaseError(error));
    }

    const distinctFields = [
      ...new Set(
        (data || [])
          .map((row) => (typeof row.field === 'string' ? row.field.trim() : ''))
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));

    return res.status(200).json({ data: distinctFields });
  })
);

// GET /api/programs/university/:id (registered before /:id)
router.get(
  '/university/:id',
  asyncHandler(async (req, res, next) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('university_id', id)
      .order('degree_level', { ascending: true })
      .order('name', { ascending: true });

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

// GET /api/programs/:id
router.get(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const { data, error } = await supabase
      .from('programs')
      .select('*, university:universities(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return next(mapDatabaseError(error));
    }

    if (!data) {
      return res.status(404).json({ error: 'Program not found' });
    }

    return res.status(200).json({ data });
  })
);

module.exports = router;

