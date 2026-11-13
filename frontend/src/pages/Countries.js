import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { countriesApi, formatMoney } from '../services/api';
import {
  Badge,
  Card,
  EmptyState,
  ErrorAlert,
  PageHeader,
  Spinner,
} from '../components/UI';

export default function Countries() {
  const [countries, setCountries] = useState([]);
  const [search, setSearch] = useState('');
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
          setError(err.message || 'Failed to load countries.');
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

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => {
      const nameMatch = (c.name || '').toLowerCase().includes(q);
      const regionMatch = (c.region || '').toLowerCase().includes(q);
      return nameMatch || regionMatch;
    });
  }, [countries, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Study destinations"
        subtitle="Explore countries, monthly living costs, languages, and visa requirements."
      />

      {/* Client-side search bar */}
      <div className="mb-8 max-w-md">
        <label htmlFor="country-search" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Search destinations
        </label>
        <input
          id="country-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by country name or region (e.g. Europe, Asia)…"
          className="w-full rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 py-2 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div className="min-h-[320px]">
        {loading ? (
          <Spinner size="lg" />
        ) : error ? (
          <ErrorAlert message={error} />
        ) : filteredCountries.length === 0 ? (
          <EmptyState
            title="No countries found"
            message={
              search.trim()
                ? `No destinations matched "${search.trim()}". Try clearing your search.`
                : 'No study destinations are currently listed in the catalog.'
            }
            action={
              search.trim() ? (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg px-4 py-2 text-sm font-medium transition"
                >
                  Clear search
                </button>
              ) : null
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCountries.map((country) => (
              <Card key={country.id} className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl" aria-hidden="true">
                        {country.flag_emoji || '🌍'}
                      </span>
                      <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{country.name}</h2>
                        {country.code && (
                          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                            ISO: {country.code}
                          </span>
                        )}
                      </div>
                    </div>
                    {country.region && <Badge color="blue">{country.region}</Badge>}
                  </div>

                  {country.description && (
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                      {country.description}
                    </p>
                  )}

                  <dl className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">Capital</dt>
                      <dd className="font-medium text-slate-800 dark:text-slate-200">{country.capital || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">Language</dt>
                      <dd className="font-medium text-slate-800 dark:text-slate-200">
                        {country.official_language || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">Currency</dt>
                      <dd className="font-medium text-slate-800 dark:text-slate-200">{country.currency || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">Living cost / mo</dt>
                      <dd className="font-semibold text-primary-700 dark:text-primary-400">
                        {formatMoney(country.living_cost_monthly)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-6">
                  <Link
                    to={`/universities?country_id=${country.id}`}
                    className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition"
                  >
                    View universities
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
