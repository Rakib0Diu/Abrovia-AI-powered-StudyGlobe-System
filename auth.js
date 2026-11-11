const express = require('express');
const { supabase, createAuthClient } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { isEmail } = require('../utils/validate');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const fullName = typeof req.body?.full_name === 'string' ? req.body.full_name.trim() : '';

    const details = [];
    if (!isEmail(rawEmail)) {
      details.push('email: must be a valid email address');
    }
    if (!password || password.length < 6) {
      details.push('password: must be at least 6 characters');
    }
    if (!fullName) {
      details.push('full_name: is required');
    }

    if (details.length > 0) {
      return res.status(400).json({
        error: details[0],
        details,
      });
    }

    const { data: createdData, error: createError } = await supabase.auth.admin.createUser({
      email: rawEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      const msg = (createError.message || '').toLowerCase();
      if (
        createError.status === 422 ||
        createError.code === 'email_exists' ||
        createError.code === 'user_already_exists' ||
        msg.includes('already') ||
        msg.includes('exists') ||
        msg.includes('registered')
      ) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      return res.status(400).json({ error: createError.message || 'Registration failed' });
    }

    const createdUser = createdData.user;

    // Upsert profile row so it exists even if the DB trigger is not installed
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: createdUser.id,
          email: createdUser.email,
          full_name: fullName,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (profileError) {
      if (profileError.code === '23505') {
        return res.status(409).json({ error: 'Email already registered' });
      }
      throw profileError;
    }

    const authClient = createAuthClient();
    const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
      email: rawEmail,
      password,
    });

    if (signInError || !signInData?.session) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(201).json({
      user: {
        id: createdUser.id,
        email: createdUser.email,
      },
      profile,
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
      expires_at: signInData.session.expires_at,
    });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const authClient = createAuthClient();
    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.session || !data?.user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile) {
      const { data: upsertedProfile, error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || '',
          },
          { onConflict: 'id' }
        )
        .select('*')
        .single();

      if (upsertError) {
        throw upsertError;
      }
      profile = upsertedProfile;
    }

    return res.status(200).json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      profile,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    });
  })
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken =
      typeof req.body?.refresh_token === 'string' ? req.body.refresh_token.trim() : '';

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const authClient = createAuthClient();
    const { data, error } = await authClient.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data?.session) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    return res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    });
  })
);

// GET /api/auth/me
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    return res.status(200).json({
      user: req.user,
      profile: req.profile,
    });
  })
);

module.exports = router;

