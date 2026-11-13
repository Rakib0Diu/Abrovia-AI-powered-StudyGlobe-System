import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  countriesApi,
  programsApi,
  universitiesApi,
  formatMoney,
} from '../services/api';
import {
  Badge,
  Card,
  EmptyState,
  ErrorAlert,
  FormField,
  PageHeader,
  Spinner,
} from '../components/UI';

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-300 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-white dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

const DEGREE_LEVELS = ['Bachelor', 'Master', 'PhD', 'Diploma'];

function buildSearchParamsObject(filters) {
  const params = {};
  if (filters.search && filters.search.trim()) params.search = filters.search.trim();
  if (filters.country_id) params.country_id = String(filters.country_id);
  if (filters.degree_level) params.degree_level = filters.degree_level;
  if (filters.field) params.field = filters.field;
  if (filters.min_tuition !== '' && filters.min_tuition !== null && filters.min_tuition !== undefined) {
    params.min_tuition = String(filters.min_tuition);
  }
  if (filters.max_tuition !== '' && filters.max_tuition !== null && filters.max_tuition !== undefined) {
    params.max_tuition = String(filters.max_tuition);
  }
  if (filters.sort && filters.sort !== 'name') {
    params.sort = filters.sort;
  }
  return params;
}

export default function Universities() {
  const { isAuthenticated, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Local state for text/number inputs (debounced 400 ms before updating URL)
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '');
  const [minTuitionInput, setMinTuitionInput] = useState(
    () => searchParams.get('min_tuition') || ''
  );
  const [maxTuitionInput, setMaxTuitionInput] = useState(
    () => searchParams.get('max_tuition') || ''
  );

  // Select filters read directly from URL
  const countryId = searchParams.get('country_id') || '';
  const degreeLevel = searchParams.get('degree_level') || '';
  const field = searchParams.get('field') || '';
  const sort = searchParams.get('sort') || 'name';

  const [countries, setCountries] = useState([]);
  const [fields, setFields] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Keep local text/number inputs in sync when URL searchParams change externally
  const urlSearch = searchParams.get('search') || '';
  const urlMinTuition = searchParams.get('min_tuition') || '';
  const urlMaxTuition = searchParams.get('max_tuition') || '';

  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    setMinTuitionInput(urlMinTuition);
  }, [urlMinTuition]);

  useEffect(() => {
    setMaxTuitionInput(urlMaxTuition);
  }, [urlMaxTuition]);

  // Debounce text/number inputs (400 ms) into URL searchParams
  useEffect(() => {
    const trimmedSearch = searchInput.trim();
    const trimmedMin = minTuitionInput.trim();
    const trimmedMax = maxTuitionInput.trim();

    if (
      trimmedSearch === urlSearch &&
      trimmedMin === urlMinTuition &&
      trimmedMax === urlMaxTuition
    ) {
      return undefined;
    }

    const timer = setTimeout(() => {
      const next = buildSearchParamsObject({
        search: trimmedSearch,
        country_id: countryId,
        degree_level: degreeLevel,
        field,
        min_tuition: trimmedMin,
        max_tuition: trimmedMax,
        sort,
      });
      setSearchParams(next, { replace: true });
    }, 400);

    return () => clearTimeout(timer);
  }, [
    searchInput,
    minTuitionInput,
    maxTuitionInput,
    urlSearch,
    urlMinTuition,
    urlMaxTuition,
    countryId,
    degreeLevel,
    field,
    sort,
    setSearchParams,
  ]);

  // Load filter options (countries and fields) once on mount
  useEffect(() => {
    let ignore = false;

    Promise.all([
      countriesApi.list().catch(() => ({ data: [] })),
      programsApi.fields().catch(() => ({ data: [] })),
    ]).then(([countriesRes, fieldsRes]) => {
      if (!ignore) {
        setCountries(countriesRes.data || []);
        setFields(fieldsRes.data || []);
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  // Fetch universities whenever URL query params change
  const queryKey = searchParams.toString();
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');

    const params = Object.fromEntries(new URLSearchParams(queryKey));

    universitiesApi
      .list(params)
      .then((res) => {
        if (!ignore) {
          const rows = res.data || [];
          setUniversities(rows);
          setCount(typeof res.count === 'number' ? res.count : rows.length);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load universities.');
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
  }, [queryKey]);

  const handleSelectChange = (key, value) => {
    const next = buildSearchParamsObject({
      search: searchInput,
      country_id: key === 'country_id' ? value : countryId,
      degree_level: key === 'degree_level' ? value : degreeLevel,
      field: key === 'field' ? value : field,
      min_tuition: minTuitionInput,
      max_tuition: maxTuitionInput,
      sort: key === 'sort' ? value : sort,
    });
    setSearchParams(next);
  };

  const handleUsePreferences = () => {
    if (!profile) return;
    const prefCountry =
      profile.preferred_country_id !== null && profile.preferred_country_id !== undefined
        ? String(profile.preferred_country_id)
        : '';
    const prefDegree = profile.preferred_degree_level || '';
    const prefField = profile.preferred_field || '';
    const prefBudget =
      profile.budget_max !== null && profile.budget_max !== undefined
        ? String(profile.budget_max)
        : '';

    setMaxTuitionInput(prefBudget);

    const next = buildSearchParamsObject({
      search: searchInput,
      country_id: prefCountry,
      degree_level: prefDegree,
      field: prefField,
      min_tuition: minTuitionInput,
      max_tuition: prefBudget,
      sort,
    });
    setSearchParams(next);
  };

  const handleReset = () => {
    setSearchInput('');
    setMinTuitionInput('');
    setMaxTuitionInput('');
    setSearchParams({});
  };

  const formatTuitionRange = (min, max) => {
    const hasMin = min !== null && min !== undefined && min !== '';
    const hasMax = max !== null && max !== undefined && max !== '';
    if (hasMin && hasMax) {
      return `$${Number(min).toLocaleString('en-US')} – $${Number(max).toLocaleString('en-US')} / year`;
    }
    if (hasMin) {
      return `From ${formatMoney(min)} / year`;
    }
    if (hasMax) {
      return `Up to ${formatMoney(max)} / year`;
    }
    return 'Tuition not listed';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Universities"
        subtitle="Search and filter universities by destination, degree level, field of study, and annual tuition."
      />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Filter Panel (w-72 sticky left on lg, stacks above on mobile) */}
        <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h2 className="text-base font-semibold text-slate-800 dark:text-white">Filters</h2>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                Reset
              </button>
            </div>

            {isAuthenticated && (
              <button
                type="button"
                onClick={handleUsePreferences}
                className="w-full bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 dark:hover:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 rounded-lg px-3 py-2 text-xs font-semibold transition"
              >
                ✨ Use my preferences
              </button>
            )}

            <FormField label="Search name or city" htmlFor="filter-search">
              <input
                id="filter-search"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="e.g. Oxford, Toronto…"
                className={INPUT_CLASS}
              />
            </FormField>

            <FormField label="Country" htmlFor="filter-country">
              <select
                id="filter-country"
                value={countryId}
                onChange={(e) => handleSelectChange('country_id', e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">All countries</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.flag_emoji ? `${c.flag_emoji} ` : ''}
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Degree level" htmlFor="filter-degree">
              <select
                id="filter-degree"
                value={degreeLevel}
                onChange={(e) => handleSelectChange('degree_level', e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">All degree levels</option>
                {DEGREE_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Field of study" htmlFor="filter-field">
              <select
                id="filter-field"
                value={field}
                onChange={(e) => handleSelectChange('field', e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">All fields</option>
                {fields.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Min tuition ($)" htmlFor="filter-min-tuition">
                <input
                  id="filter-min-tuition"
                  type="number"
                  min="0"
                  step="1000"
                  value={minTuitionInput}
                  onChange={(e) => setMinTuitionInput(e.target.value)}
                  placeholder="0"
                  className={INPUT_CLASS}
                />
              </FormField>

              <FormField label="Max tuition ($)" htmlFor="filter-max-tuition">
                <input
                  id="filter-max-tuition"
                  type="number"
                  min="0"
                  step="1000"
                  value={maxTuitionInput}
                  onChange={(e) => setMaxTuitionInput(e.target.value)}
                  placeholder="60000"
                  className={INPUT_CLASS}
                />
              </FormField>
            </div>

            <FormField label="Sort by" htmlFor="filter-sort">
              <select
                id="filter-sort"
                value={sort}
                onChange={(e) => handleSelectChange('sort', e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="name">Name A–Z</option>
                <option value="tuition_asc">Tuition low→high</option>
                <option value="tuition_desc">Tuition high→low</option>
                <option value="ranking">World ranking</option>
              </select>
            </FormField>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg px-3 py-2 text-sm font-medium transition"
              >
                Reset
              </button>
            </div>
          </Card>
        </aside>

        {/* Results Panel */}
        <div className="flex-1 w-full min-h-[420px]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400" aria-live="polite">
              {loading
                ? 'Loading universities…'
                : `${count} ${count === 1 ? 'university' : 'universities'} found`}
            </p>
          </div>

          {loading ? (
            <Spinner size="lg" />
          ) : error ? (
            <ErrorAlert message={error} />
          ) : universities.length === 0 ? (
            <EmptyState
              title="No matching universities"
              message="Try broadening your tuition range or resetting some filters."
              action={
                <button
                  type="button"
                  onClick={handleReset}
                  className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition"
                >
                  Reset filters
                </button>
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {universities.map((uni) => {
                const initial = (uni.name || 'U').charAt(0).toUpperCase();
                return (
                  <Card key={uni.id} className="p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {uni.logo_url ? (
                            <img
                              src={uni.logo_url}
                              alt={`${uni.name} logo`}
                              className="h-12 w-12 rounded-lg object-contain border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0"
                            />
                          ) : (
                            <div
                              aria-hidden="true"
                              className="h-12 w-12 rounded-lg bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-bold text-lg flex items-center justify-center shrink-0"
                            >
                              {initial}
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-snug">
                              {uni.name}
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {uni.country?.flag_emoji ? `${uni.country.flag_emoji} ` : ''}
                              {uni.city ? `${uni.city}, ` : ''}
                              {uni.country?.name || ''}
                            </p>
                          </div>
                        </div>

                        {uni.world_ranking && (
                          <Badge color="blue" className="shrink-0">
                            #{uni.world_ranking} world
                          </Badge>
                        )}
                      </div>

                      <div className="mt-4 text-sm font-semibold text-primary-700 dark:text-primary-400">
                        {formatTuitionRange(uni.tuition_min, uni.tuition_max)}
                      </div>

                      {uni.description && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                          {uni.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <Link
                        to={`/universities/${uni.id}`}
                        className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition"
                      >
                        View details
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
