import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, profile, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const firstName = (
    profile?.full_name?.trim() ||
    user?.email?.split('@')[0] ||
    'Student'
  ).split(/\s+/)[0];

  const navLinkClass = ({ isActive }) =>
    `text-sm transition ${
      isActive
        ? 'text-primary-600 font-semibold'
        : 'text-slate-600 hover:text-primary-600 font-medium'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block rounded-lg px-3 py-2 text-base transition ${
      isActive
        ? 'bg-primary-50 text-primary-600 font-semibold'
        : 'text-slate-700 hover:bg-slate-50 font-medium'
    }`;

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    closeMobile();
    logout();
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <nav
        aria-label="Main navigation"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="flex h-16 items-center justify-between">
          {/* Brand + Desktop Links */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              onClick={closeMobile}
              className="text-xl font-bold text-primary-700 tracking-tight focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md"
            >
              🌍 StudyGlobe
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <NavLink to="/" end className={navLinkClass}>
                Home
              </NavLink>
              <NavLink to="/countries" className={navLinkClass}>
                Countries
              </NavLink>
              <NavLink to="/universities" className={navLinkClass}>
                Universities
              </NavLink>
              <NavLink to="/programs" className={navLinkClass}>
                Programs
              </NavLink>
              {isAuthenticated && (
                <NavLink to="/profile" className={navLinkClass}>
                  Profile
                </NavLink>
              )}
              {isAuthenticated && isAdmin && (
                <NavLink to="/admin" className={navLinkClass}>
                  Admin
                </NavLink>
              )}
            </div>
          </div>

          {/* Desktop Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-600 mr-1">
                  Hi, <strong className="font-semibold text-slate-800">{firstName}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-label="Toggle navigation menu"
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {mobileOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Stacked Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 py-3 space-y-1">
            <NavLink to="/" end onClick={closeMobile} className={mobileNavLinkClass}>
              Home
            </NavLink>
            <NavLink
              to="/countries"
              onClick={closeMobile}
              className={mobileNavLinkClass}
            >
              Countries
            </NavLink>
            <NavLink
              to="/universities"
              onClick={closeMobile}
              className={mobileNavLinkClass}
            >
              Universities
            </NavLink>
            <NavLink
              to="/programs"
              onClick={closeMobile}
              className={mobileNavLinkClass}
            >
              Programs
            </NavLink>
            {isAuthenticated && (
              <NavLink
                to="/profile"
                onClick={closeMobile}
                className={mobileNavLinkClass}
              >
                Profile
              </NavLink>
            )}
            {isAuthenticated && isAdmin && (
              <NavLink
                to="/admin"
                onClick={closeMobile}
                className={mobileNavLinkClass}
              >
                Admin
              </NavLink>
            )}

            <div className="pt-3 mt-2 border-t border-slate-200 flex flex-col gap-2 px-2">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-slate-600 px-1">
                    Signed in as <strong className="font-semibold text-slate-800">{firstName}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeMobile}
                    className="w-full text-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobile}
                    className="w-full text-center bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

