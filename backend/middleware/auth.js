const { supabase } = require('../config/supabase');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData || !authData.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const authUser = authData.user;

    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileError) {
      return next(profileError);
    }

    // Defensive fallback if the profile row was not yet created by the trigger
    if (!profile) {
      const { data: createdProfile, error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || '',
          },
          { onConflict: 'id' }
        )
        .select('*')
        .single();

      if (upsertError) {
        return next(upsertError);
      }
      profile = createdProfile;
    }

    req.user = {
      id: authUser.id,
      email: authUser.email,
    };
    req.profile = profile;
    return next();
  } catch (err) {
    return next(err);
  }
}

function requireAdmin(req, res, next) {
  if (!req.profile || !req.profile.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
}

module.exports = {
  requireAuth,
  requireAdmin,
};

