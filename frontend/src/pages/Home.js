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
      <section className="bg-gradient-to-br from-primary-600 to-primary-900 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Plan your study-abroad journey
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-primary-100">
            Discover world-class universities, compare tuition and intake deadlines, check
            language requirements, and assess your scholarship eligibility in one place.
          </p>

          {/* Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 max-w-xl mx-auto flex flex-col sm:flex-row gap-3"
          >
            <label htmlFor="hero-university-search" className="sr-only">
              Search universities by name or city
            </label>
            <input
              id="hero-university-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search universities by name or city (e.g. Oxford, Toronto, Munich)…"
              className="flex-1 rounded-lg border-0 px-4 py-3 text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <button
              type="submit"
              className="bg-primary-500 hover:bg-primary-700 text-white font-semibold rounded-lg px-6 py-3 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-white"
            >
              Search
            </button>
          </form>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/countries"
              className="bg-white text-primary-700 hover:bg-primary-50 font-semibold rounded-lg px-6 py-3 shadow-sm transition"
            >
              Explore countries
            </Link>
            {!isAuthenticated && (
              <Link
                to="/register"
                className="bg-primary-700 hover:bg-primary-500 border border-primary-400 text-white font-semibold rounded-lg px-6 py-3 transition"
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
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Everything you need to prepare for studying abroad
          </h2>
          <p className="mt-2 text-slate-500">
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
              <Card className="p-6 h-full hover:border-primary-300 transition flex flex-col justify-between">
                <div>
                  <div className="text-3xl mb-3" aria-hidden="true">
                    {feat.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 group-hover:text-primary-600 transition">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{feat.text}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-primary-600 group-hover:text-primary-700">
                  Explore {feat.title.toLowerCase()} →
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Popular Destinations */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                Popular destinations
              </h2>
              <p className="mt-1 text-slate-500">
                Browse universities in top study-abroad countries
              </p>
            </div>
            <Link
              to="/countries"
              className="text-sm font-semibold text-primary-600 hover:text-primary-700"
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
                    className="group block bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-primary-300 transition"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl" aria-hidden="true">
                        {country.flag_emoji || '🌍'}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 group-hover:text-primary-600 transition">
                          {country.name}
                        </h3>
                        <p className="text-xs text-slate-500">
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
