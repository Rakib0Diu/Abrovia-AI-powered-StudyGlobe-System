const express = require('express');
const { supabase } = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const {
  isNumberInRange,
  parsePositiveInt,
  mapDatabaseError,
} = require('../utils/validate');

const router = express.Router();

// Helper to fetch scholarships for a specific university (plus country-wide general scholarships)
async function getScholarshipsForUniversity(universityId) {
  const { data: uni, error: uniError } = await supabase
    .from('universities')
    .select('id, country_id')
    .eq('id', universityId)
    .maybeSingle();

  if (uniError) {
    throw uniError;
  }

  if (!uni) {
    return [];
  }

  let query = supabase
    .from('scholarships')
    .select('*, university:universities(id, name)')
    .order('deadline', { ascending: true, nullsFirst: false });

  if (uni.country_id) {
    query = query.or(
      `university_id.eq.${universityId},and(university_id.is.null,country_id.eq.${uni.country_id})`
    );
  } else {
    query = query.eq('university_id', universityId);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return data || [];
}

// GET /api/scholarships
router.get(
  '/',
  asyncHandler(async (req, res, next) => {
    const { data, error } = await supabase
      .from('scholarships')
      .select('*, university:universities(id, name)')
      .order('deadline', { ascending: true, nullsFirst: false });

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

// GET /api/scholarships/university/:id
router.get(
  '/university/:id',
  asyncHandler(async (req, res, next) => {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    try {
      const rows = await getScholarshipsForUniversity(id);
      return res.status(200).json({
        data: rows,
        count: rows.length,
      });
    } catch (error) {
      return next(mapDatabaseError(error));
    }
  })
);

// POST /api/scholarships/assess
router.post(
  '/assess',
  asyncHandler(async (req, res, next) => {
    const rawGpa = req.body?.gpa;
    if (rawGpa === undefined || rawGpa === null || String(rawGpa).trim() === '') {
      return res.status(400).json({ error: 'GPA is required and must be between 0 and 4' });
    }

    const gpa = Number(rawGpa);
    if (!isNumberInRange(gpa, 0, 4)) {
      return res.status(400).json({ error: 'GPA must be between 0 and 4' });
    }

    let ielts = null;
    const rawIelts = req.body?.ielts;
    if (rawIelts !== undefined && rawIelts !== null && String(rawIelts).trim() !== '') {
      ielts = Number(rawIelts);
      if (!isNumberInRange(ielts, 0, 9)) {
        return res.status(400).json({ error: 'IELTS score must be between 0 and 9' });
      }
    }

    const degreeLevel =
      typeof req.body?.degree_level === 'string' && req.body.degree_level.trim()
        ? req.body.degree_level.trim()
        : null;

    let universityId = null;
    if (
      req.body?.university_id !== undefined &&
      req.body?.university_id !== null &&
      String(req.body.university_id).trim() !== ''
    ) {
      universityId = parsePositiveInt(req.body.university_id);
      if (!universityId) {
        return res.status(400).json({ error: 'Invalid university_id' });
      }
    }

    let countryId = null;
    if (
      req.body?.country_id !== undefined &&
      req.body?.country_id !== null &&
      String(req.body.country_id).trim() !== ''
    ) {
      countryId = parsePositiveInt(req.body.country_id);
      if (!countryId) {
        return res.status(400).json({ error: 'Invalid country_id' });
      }
    }

    let candidates = [];
    try {
      if (universityId !== null) {
        candidates = await getScholarshipsForUniversity(universityId);
      } else {
        let query = supabase
          .from('scholarships')
          .select('*, university:universities(id, name)')
          .order('deadline', { ascending: true, nullsFirst: false });

        if (countryId !== null) {
          query = query.eq('country_id', countryId);
        }

        const { data, error } = await query;
        if (error) {
          throw error;
        }
        candidates = data || [];
      }
    } catch (error) {
      return next(mapDatabaseError(error));
    }

    const eligible = [];
    const notEligible = [];

    for (const scholarship of candidates) {
      const reasons = [];

      if (
        scholarship.min_gpa !== null &&
        scholarship.min_gpa !== undefined &&
        gpa < Number(scholarship.min_gpa)
      ) {
        reasons.push(`GPA below required ${scholarship.min_gpa}`);
      }

      if (scholarship.min_ielts !== null && scholarship.min_ielts !== undefined) {
        if (ielts === null) {
          reasons.push(`IELTS score required (${scholarship.min_ielts})`);
        } else if (ielts < Number(scholarship.min_ielts)) {
          reasons.push(`IELTS below required ${scholarship.min_ielts}`);
        }
      }

      if (
        scholarship.degree_level &&
        degreeLevel &&
        scholarship.degree_level.toLowerCase() !== degreeLevel.toLowerCase()
      ) {
        reasons.push(`Only for ${scholarship.degree_level} students`);
      }

      if (reasons.length === 0) {
        eligible.push(scholarship);
      } else {
        notEligible.push({
          ...scholarship,
          reasons,
        });
      }
    }

    return res.status(200).json({
      data: {
        eligible,
        not_eligible: notEligible,
        summary: {
          total: candidates.length,
          eligible_count: eligible.length,
        },
      },
    });
  })
);

module.exports = router;

