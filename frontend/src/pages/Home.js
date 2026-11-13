import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { countriesApi } from '../services/api';
import { Card, EmptyState, ErrorAlert, Spinner } from '../components/UI';

const FEATURES = [
  {
    icon: '🌍',
    title: 'Countries',
    text: 'Compare study destinations, monthly living costs, official languages, and student visa guidelines.',
    path: '/countries',
  },
  {
    icon: '🏛️',
    title: 'Universities',
    text: 'Filter top-ranked institutions by country, tuition range, degree level, and academic discipline.',
    path: '/universities',
  },
  {
    icon: '🎓',
    title: 'Programs',
    text: 'Explore Bachelor, Master, PhD, and Diploma programs across STEM, business, health, and arts.',
    path: '/programs',
  },
  {
    icon: '📅',
    title: 'Intakes',
    text: 'Track upcoming semester start dates, application deadlines, and open admission windows.',
    path: '/universities',
  },
  {
    icon: '🗣️',
    title: 'Language requirements',
    text: 'Inspect minimum IELTS, TOEFL iBT, PTE Academic, and Duolingo scores required for entry.',
    path: '/universities',
  },
  {
    icon: '💡',
    title: 'Scholarships',
    text: 'Run instant eligibility assessments based on your GPA and IELTS score to find funding.',
    path: '/scholarships',
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');

    countriesApi
      .list()
      .then((res) => {
        if (!ignore) {
          setCountries(res.data || []);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load popular destinations.');
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/universities?search=${encodeURIComponent(q)}`);
    } else {
      navigate('/universities');
    }
  };

  const popularDestinations = countries.slice(0, 6);

  return (
    <div>
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden text-white py-20 sm:py-28">
        {/* Background image — authentic university campus */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=2000&q=85')",
          }}
          aria-hidden="true"
        />
        {/* Directional gradient overlay — darker navy at top/center, transparent at bottom */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(15,23,42,0.78) 0%, rgba(15,23,42,0.72) 45%, rgba(15,23,42,0.45) 100%)',
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
          >
            Plan your study-abroad journey
          </h1>
          <p
            className="mt-4 mx-auto text-lg font-medium"
            style={{
              color: '#F8FAFC',
              maxWidth: '680px',
              lineHeight: 1.6,
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            Discover world-class universities, compare tuition and intake deadlines, check
            language requirements, and assess your scholarship eligibility in one place.
          </p>

          {/* Unified floating search bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-10 mx-auto max-w-xl w-full flex flex-col sm:flex-row items-center bg-white dark:bg-slate-800"
            style={{
              padding: '6px',
              borderRadius: '14px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.25), 0 8px 10px -6px rgba(0,0,0,0.2)',
            }}
          >
            <label htmlFor="hero-university-search" className="sr-only">
              Search universities by name or city
            </label>
            <div className="relative flex-1 w-full">
              {/* Magnifying glass icon */}
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center">
                <svg
                  className="h-5 w-5 text-slate-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                id="hero-university-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search universities by name or city…"
                className="w-full bg-transparent pl-11 pr-4 py-3 text-slate-800 dark:text-white placeholder-slate-400 border-0 focus:outline-none focus:ring-0 text-sm sm:text-base"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto shrink-0 bg-primary-600 hover:bg-primary-500 text-white font-semibold px-7 py-3 shadow-md hover:shadow-lg transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              style={{ borderRadius: '10px' }}
            >
              Search
            </button>
          </form>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/countries"
              className="bg-white text-primary-700 hover:bg-slate-50 font-semibold rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition duration-200"
            >
              Explore countries
            </Link>
            {!isAuthenticated && (
              <Link
                to="/register"
                className="text-white font-semibold rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition duration-200"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
              >
                Create free account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 2. Six Feature Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
            Everything you need to prepare for studying abroad
          </h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Structured catalog tools to help you research, shortlist, and qualify for global
            universities.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feat) => (
            <Link
              key={feat.title}
              to={feat.path}
              className="group block h-full focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-xl"
            >
              <Card className="p-6 h-full hover:border-primary-300 dark:hover:border-primary-500 transition flex flex-col justify-between">
                <div>
                  <div className="text-3xl mb-3" aria-hidden="true">
                    {feat.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {feat.text}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center text-xs font-semibold text-primary-600 dark:text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-300">
                  Explore {feat.title.toLowerCase()} →
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Popular Destinations */}
      <section className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 py-16 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
                Popular destinations
              </h2>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Browse universities in top study-abroad countries
              </p>
            </div>
            <Link
              to="/countries"
              className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              View all countries →
            </Link>
          </div>

          <div className="min-h-[160px]">
            {loading ? (
              <Spinner />
            ) : error ? (
              <ErrorAlert message={error} />
            ) : popularDestinations.length === 0 ? (
              <EmptyState
                title="No destinations available"
                message="Countries will appear here once the catalog is seeded."
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {popularDestinations.map((country) => (
                  <Link
                    key={country.id}
                    to={`/universities?country_id=${country.id}`}
                    className="group block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-500 transition"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl" aria-hidden="true">
                        {country.flag_emoji || '🌍'}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">
                          {country.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {country.region || 'Global destination'}
                          {country.capital ? ` · ${country.capital}` : ''}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Closing CTA Band */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-2xl bg-primary-900 text-white px-6 py-12 sm:px-12 text-center shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Ready to find your ideal university and scholarship match?
          </h2>
          <p className="mt-3 max-w-xl mx-auto text-primary-100">
            Save your GPA, IELTS score, and budget preferences in your profile to filter
            universities and check scholarship eligibility with a single click.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              to="/universities"
              className="bg-white text-primary-700 hover:bg-primary-50 font-semibold rounded-lg px-6 py-3 transition"
            >
              Browse universities
            </Link>
            {isAuthenticated ? (
              <Link
                to="/profile"
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg px-6 py-3 transition"
              >
                Update my preferences
              </Link>
            ) : (
              <Link
                to="/register"
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg px-6 py-3 transition"
              >
                Get started for free
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
