import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  authApi,
  profileApi,
  getStoredAccessToken,
  setStoredSession,
  clearStoredSession,
} from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Verify existing token on mount
  useEffect(() => {
    let ignore = false;
    const token = getStoredAccessToken();

    if (!token) {
      setLoading(false);
      return () => {
        ignore = true;
      };
    }

    authApi
      .me()
      .then((res) => {
        if (!ignore) {
          setUser(res.user);
          setProfile(res.profile);
          setStoredSession({ user: res.user });
        }
      })
      .catch(() => {
        if (!ignore) {
          clearStoredSession();
          setUser(null);
          setProfile(null);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    setStoredSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
    });
    setUser(data.user);
    setProfile(data.profile);
    return data;
  }, []);

  const register = useCallback(async (email, password, fullName) => {
    const data = await authApi.register({
      email,
      password,
      full_name: fullName,
    });
    setStoredSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
    });
    setUser(data.user);
    setProfile(data.profile);
    return data;
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setUser(null);
    setProfile(null);
    navigate('/');
  }, [navigate]);

  const updateProfile = useCallback(async (fields) => {
    const res = await profileApi.update(fields);
    setProfile(res.data);
    return res.data;
  }, []);

  const refreshProfile = useCallback(async () => {
    const res = await profileApi.get();
    setProfile(res.data);
    return res.data;
  }, []);

  const isAuthenticated = Boolean(user);
  const isAdmin = Boolean(profile?.is_admin);

  const value = {
    user,
    profile,
    isAuthenticated,
    isAdmin,
    loading,
    login,
    register,
    logout,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

