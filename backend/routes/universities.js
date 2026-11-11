const express = require('express');
const { supabase } = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const { parsePositiveInt, mapDatabaseError } = require('../utils/validate');

const router = express.Router();

async function queryUniversities(req, res, next, forcedCountryId = null) {
  const rawCountryId =
    forcedCountryId !== null
      ? forcedCountryId
      : req.query.country_id !== undefined && req.query.country_id !== ''
      ? req.query.country_id
      : null;

  let countryId = null;
  if (rawCountryId !== null) {
    countryId = parsePositiveInt(rawCountryId);
    if (!countryId) {
      return res.status(400).json({ error: forcedCountryId !== null ? 'Invalid id' : 'Invalid country_id' });
    }
  }

  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const degreeLevel =
    typeof req.query.degree_level === 'string' ? req.query.degree_level.trim() : '';
  const field = typeof req.query.field === 'string' ? req.query.field.trim() : '';
  const sort = typeof req.query.sort === 'string' ? req.query.sort.trim() : 'name';

  let minTuition = null;
  if (req.query.min_tuition !== undefined && String(req.query.min_tuition).trim() !== '') {
    minTuition = Number(req.query.min_tuition);
    if (Number.isNaN(minTuition) || !Number.isFinite(minTuition) || minTuition < 0) {
      return res.status(400).json({ error: 'Invalid min_tuition' });
    }
  }

  let maxTuition = null;
  if (req.query.max_tuition !== undefined && String(req.query.max_tuition).trim() !== '') {
    maxTuition = Number(req.query.max_tuition);
    if (Number.isNaN(maxTuition) || !Number.isFinite(maxTuition) || maxTuition < 0) {
      return res.status(400).json({ error: 'Invalid max_tuition' });
    }
  }

  // If filtering by program degree_level or field, resolve matching university_ids first
  let matchingUniversityIds = null;
  if (degreeLevel || field) {
    let progQuery = supabase.from('programs').select('university_id');
    if (degreeLevel) {
      progQuery = progQuery.eq('degree_level', degreeLevel);
    }
    if (field) {
      progQuery = progQuery.ilike('field', `%${field}%`);
    }

    const { data: progRows, error: progError } = await progQuery;
    if (progError) {
      return next(mapDatabaseError(progError));
    }

    matchingUniversityIds = [...new Set((progRows || []).map((row) => row.university_id))];
    if (matchingUniversityIds.length === 0) {
      return res.status(200).json({ data: [], count: 0 });
    }
  }

  let query = supabase
    .from('universities')
    .select('*, country:countries(id, name, code, flag_emoji)');

  if (countryId !== null) {
    query = query.eq('country_id', countryId);
  }

  if (matchingUniversityIds !== null) {
    query = query.in('id', matchingUniversityIds);
  }

  if (search) {
    const cleanSearch = search.replace(/[,()]/g, ' ').trim();
    if (cleanSearch) {
      query = query.or(`name.ilike.%${cleanSearch}%,city.ilike.%${cleanSearch}%`);
    }
  }

  // Range overlap: tuition_max >= min_tuition AND tuition_min <= max_tuition
  if (minTuition !== null) {
    query = query.gte('tuition_max', minTuition);
  }

  if (maxTuition !== null) {
    query = query.lte('tuition_min', maxTuition);
  }

  if (sort === 'tuition_asc') {
    query = query
      .order('tuition_min', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });
  } else if (sort === 'tuition_desc') {
    query = query
      .order('tuition_max', { ascending: false, nullsFirst: false })
      .order('name', { ascending: true });
  } else if (sort === 'ranking') {
    query = query
      .order('world_ranking', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });
  } else {
    query = query.order('name', { ascending: true });
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
}

// GET /api/universities
router.get(
  '/',
  asyncHandler(async (req, res, next) => {
    return queryUniversities(req, res, next, null);
  })
);

// GET /api/universities/country/:countryId (registered before /:id)
router.get(
  '/country/:countryId',
  asyncHandler(async (req, res, next) => {
    return queryUniversities(req, res, next, req.params.countryId);
  })
);

// GET /api/universities/:id
router.get(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const { data, error } = await supabase
      .from('universities')
      .select('*, country:countries(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return next(mapDatabaseError(error));
    }

    if (!data) {
      return res.status(404).json({ error: 'University not found' });
    }

    return res.status(200).json({ data });
  })
);

module.exports = router;

