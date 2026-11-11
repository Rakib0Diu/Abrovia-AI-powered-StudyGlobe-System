const express = require('express');
const { supabase } = require('../config/supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { parsePositiveInt, pick, mapDatabaseError } = require('../utils/validate');

const router = express.Router();

// Protect all admin routes with requireAuth then requireAdmin
router.use(requireAuth, requireAdmin);

const COLUMNS = {
  countries: [
    'name',
    'code',
    'capital',
    'region',
    'official_language',
    'currency',
    'flag_emoji',
    'description',
    'living_cost_monthly',
    'visa_info',
  ],
  universities: [
    'country_id',
    'name',
    'city',
    'description',
    'website',
    'world_ranking',
    'tuition_min',
    'tuition_max',
    'student_count',
    'founded_year',
    'logo_url',
  ],
  programs: [
    'university_id',
    'name',
    'degree_level',
    'field',
    'duration_months',
    'tuition_per_year',
    'description',
  ],
  intakes: [
    'university_id',
    'name',
    'season',
    'start_date',
    'application_deadline',
    'is_open',
  ],
  language_requirements: [
    'university_id',
    'test_name',
    'min_overall',
    'min_each_band',
    'degree_level',
    'notes',
  ],
  scholarships: [
    'university_id',
    'country_id',
    'name',
    'description',
    'amount',
    'coverage',
    'min_gpa',
    'min_ielts',
    'degree_level',
    'deadline',
    'url',
  ],
};

const REQUIRED_COLUMNS = {
  countries: ['name'],
  universities: ['name', 'country_id'],
  programs: ['name', 'university_id'],
  intakes: ['name', 'university_id'],
  language_requirements: ['test_name', 'university_id'],
  scholarships: ['name'],
};

const NUMERIC_COLUMNS = new Set([
  'country_id',
  'university_id',
  'living_cost_monthly',
  'world_ranking',
  'tuition_min',
  'tuition_max',
  'student_count',
  'founded_year',
  'duration_months',
  'tuition_per_year',
  'min_overall',
  'min_each_band',
  'amount',
  'min_gpa',
  'min_ielts',
]);

const DATE_COLUMNS = new Set(['start_date', 'application_deadline', 'deadline']);
const BOOLEAN_COLUMNS = new Set(['is_open']);

const SELECT_EXPRESSIONS = {
  countries: '*',
  universities: '*, country:countries(id, name)',
  programs: '*, university:universities(id, name)',
  intakes: '*, university:universities(id, name)',
  language_requirements: '*, university:universities(id, name)',
  scholarships: '*, university:universities(id, name), country:countries(id, name)',
};

function validateTableMiddleware(req, res, next) {
  const { table } = req.params;
  if (!Object.prototype.hasOwnProperty.call(COLUMNS, table)) {
    return res.status(404).json({ error: 'Unknown table' });
  }
  return next();
}

function sanitizePayload(table, body, isCreate) {
  const allowed = COLUMNS[table];
  const raw = pick(body, allowed);
  const payload = {};
  const details = [];

  for (const [key, value] of Object.entries(raw)) {
    if (BOOLEAN_COLUMNS.has(key)) {
      if (value === '' || value === null || value === undefined) {
        continue;
      }
      payload[key] = value === true || value === 'true';
      continue;
    }

    if (NUMERIC_COLUMNS.has(key)) {
      if (value === '' || value === null) {
        payload[key] = null;
      } else {
        const num = Number(value);
        if (Number.isNaN(num) || !Number.isFinite(num)) {
          details.push(`${key}: must be a valid number`);
        } else {
          payload[key] = num;
        }
      }
      continue;
    }

    if (DATE_COLUMNS.has(key)) {
      payload[key] = value === '' || value === null ? null : String(value).trim();
      continue;
    }

    // Nullable degree_level or optional text fields
    if (value === '' || value === null) {
      payload[key] = null;
    } else {
      payload[key] = typeof value === 'string' ? value.trim() : String(value);
    }
  }

  const requiredCols = REQUIRED_COLUMNS[table] || [];
  for (const reqCol of requiredCols) {
    if (isCreate) {
      if (
        payload[reqCol] === undefined ||
        payload[reqCol] === null ||
        payload[reqCol] === ''
      ) {
        details.push(`${reqCol}: is required`);
      }
    } else if (
      Object.prototype.hasOwnProperty.call(payload, reqCol) &&
      (payload[reqCol] === null || payload[reqCol] === '')
    ) {
      details.push(`${reqCol}: cannot be empty`);
    }
  }

  return { payload, details };
}

// GET /api/admin/:table
router.get(
  '/:table',
  validateTableMiddleware,
  asyncHandler(async (req, res, next) => {
    const { table } = req.params;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    let limit = 200;
    if (req.query.limit !== undefined && String(req.query.limit).trim() !== '') {
      const parsedLimit = parsePositiveInt(req.query.limit);
      if (!parsedLimit) {
        return res.status(400).json({ error: 'Invalid limit' });
      }
      limit = Math.min(parsedLimit, 1000);
    }

    let query = supabase
      .from(table)
      .select(SELECT_EXPRESSIONS[table] || '*')
      .limit(limit);

    if (search) {
      if (COLUMNS[table].includes('name')) {
        query = query.ilike('name', `%${search}%`);
      } else if (COLUMNS[table].includes('test_name')) {
        query = query.ilike('test_name', `%${search}%`);
      }
    }

    if (COLUMNS[table].includes('name')) {
      query = query.order('name', { ascending: true });
    } else {
      query = query.order('id', { ascending: true });
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

// GET /api/admin/:table/:id
router.get(
  '/:table/:id',
  validateTableMiddleware,
  asyncHandler(async (req, res, next) => {
    const { table } = req.params;
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const { data, error } = await supabase
      .from(table)
      .select(SELECT_EXPRESSIONS[table] || '*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return next(mapDatabaseError(error));
    }

    if (!data) {
      return res.status(404).json({ error: 'Record not found' });
    }

    return res.status(200).json({ data });
  })
);

// POST /api/admin/:table
router.post(
  '/:table',
  validateTableMiddleware,
  asyncHandler(async (req, res, next) => {
    const { table } = req.params;
    const { payload, details } = sanitizePayload(table, req.body, true);

    if (details.length > 0) {
      return res.status(400).json({
        error: details[0],
        details,
      });
    }

    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select(SELECT_EXPRESSIONS[table] || '*')
      .single();

    if (error) {
      return next(mapDatabaseError(error));
    }

    return res.status(201).json({ data });
  })
);

// PUT /api/admin/:table/:id
router.put(
  '/:table/:id',
  validateTableMiddleware,
  asyncHandler(async (req, res, next) => {
    const { table } = req.params;
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const { payload, details } = sanitizePayload(table, req.body, false);

    if (details.length > 0) {
      return res.status(400).json({
        error: details[0],
        details,
      });
    }

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq('id', id)
      .select(SELECT_EXPRESSIONS[table] || '*')
      .maybeSingle();

    if (error) {
      return next(mapDatabaseError(error));
    }

    if (!data) {
      return res.status(404).json({ error: 'Record not found' });
    }

    return res.status(200).json({ data });
  })
);

// DELETE /api/admin/:table/:id
router.delete(
  '/:table/:id',
  validateTableMiddleware,
  asyncHandler(async (req, res, next) => {
    const { table } = req.params;
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      return next(mapDatabaseError(error));
    }

    if (!data) {
      return res.status(404).json({ error: 'Record not found' });
    }

    return res.status(200).json({ message: 'Deleted' });
  })
);

module.exports = router;

