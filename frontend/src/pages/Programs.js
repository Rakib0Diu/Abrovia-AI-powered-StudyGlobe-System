import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  programsApi,
  universitiesApi,
  formatMoney,
  formatDuration,
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
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

const DEGREE_LEVELS = ['Bachelor', 'Master', 'PhD', 'Diploma'];

function getDegreeBadgeColor(level) {
  switch (level) {
    case 'Bachelor':
      return 'blue';
    case 'Master':
      return 'green';
    case 'PhD':
      return 'amber';
    default:
      return 'slate';
  }
}

export default function Programs() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '');
  const degreeLevel = searchParams.get('degree_level') || '';
  const field = searchParams.get('field') || '';
  const universityId = searchParams.get('university_id') || '';

  const [fields, setFields] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const urlSearch = searchParams.get('search') || '';
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Debounce search text input (400 ms)
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === urlSearch) return undefined;

    const timer = setTimeout(() => {
      const next = {};
      if (trimmed) next.search = trimmed;
      if (degreeLevel) next.degree_level = degreeLevel;
      if (field) next.field = field;
      if (universityId) next.university_id = universityId;
      setSearchParams(next, { replace: true });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, urlSearch, degreeLevel, field, universityId, setSearchParams]);

  // Load distinct fields and universities for filter dropdowns
  useEffect(() => {
    let ignore = false;

    Promise.all([
      programsApi.fields().catch(() => ({ data: [] })),
      universitiesApi.list().catch(() => ({ data: [] })),
    ]).then(([fieldsRes, uniRes]) => {
      if (!ignore) {
        setFields(fieldsRes.data || []);
        setUniversities(uniRes.data || []);
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  // Fetch programs whenever filters change
  const queryKey = searchParams.toString();
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');

    const params = Object.fromEntries(new URLSearchParams(queryKey));

    programsApi
      .list(params)
      .then((res) => {
        if (!ignore) {
          const rows = res.data || [];
          setPrograms(rows);
          setCount(typeof res.count === 'number' ? res.count : rows.length);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load programs.');
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

  const handleFilterChange = (key, value) => {
    const next = {};
    const trimmedSearch = searchInput.trim();
    if (trimmedSearch) next.search = trimmedSearch;

    const nextDegree = key === 'degree_level' ? value : degreeLevel;
    const nextField = key === 'field' ? value : field;
    const nextUni = key === 'university_id' ? value : universityId;

    if (nextDegree) next.degree_level = nextDegree;
    if (nextField) next.field = nextField;
    if (nextUni) next.university_id = nextUni;

    setSearchParams(next);
  };

  const handleReset = () => {
    setSearchInput('');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Programs"
        subtitle="Explore academic degrees by discipline, qualification level, and institution."
      />

      {/* Filter Bar */}
      <Card className="p-5 mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
          <FormField label="Search program name" htmlFor="programs-search">
            <input
              id="programs-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="e.g. Computer Science, MBA…"
              className={INPUT_CLASS}
            />
          </FormField>

          <FormField label="Degree level" htmlFor="programs-degree">
            <select
              id="programs-degree"
              value={degreeLevel}
              onChange={(e) => handleFilterChange('degree_level', e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">All levels</option>
              {DEGREE_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Field of study" htmlFor="programs-field">
            <select
              id="programs-field"
              value={field}
              onChange={(e) => handleFilterChange('field', e.target.value)}
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

          <FormField label="University" htmlFor="programs-university">
            <select
              id="programs-university"
              value={universityId}
              onChange={(e) => handleFilterChange('university_id', e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">All universities</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </FormField>

          <div>
            <button
              type="button"
              onClick={handleReset}
              className="w-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition"
            >
              Reset filters
            </button>
          </div>
        </div>
      </Card>

      {/* Results Region */}
      <div className="min-h-[360px]">
        <div className="mb-4">
          <p className="text-sm font-medium text-slate-600" aria-live="polite">
            {loading
              ? 'Loading programs…'
              : `${count} ${count === 1 ? 'program' : 'programs'} found`}
          </p>
        </div>

        {loading ? (
          <Spinner size="lg" />
        ) : error ? (
          <ErrorAlert message={error} />
        ) : programs.length === 0 ? (
          <EmptyState
            title="No programs found"
            message="Try adjusting your search or filter selections."
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((prog) => (
              <Card key={prog.id} className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Badge color={getDegreeBadgeColor(prog.degree_level)}>
                      {prog.degree_level || 'Program'}
                    </Badge>
                    {prog.field && (
                      <span className="text-xs font-medium text-slate-500">{prog.field}</span>
                    )}
                  </div>

                  <h2 className="mt-3 text-lg font-bold text-slate-800 leading-snug">
                    {prog.name}
                  </h2>

                  {prog.university && (
                    <p className="mt-1 text-sm">
                      <Link
                        to={`/universities/${prog.university.id || prog.university_id}`}
                        className="font-medium text-primary-600 hover:text-primary-700"
                      >
                        {prog.university.name}
                      </Link>
                      {prog.university.city ? (
                        <span className="text-xs text-slate-500">
                          {' '}
                          · {prog.university.city}
                        </span>
                      ) : null}
                    </p>
                  )}

                  {prog.description && (
                    <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                      {prog.description}
                    </p>
                  )}
                </div>

                <dl className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <dt className="text-slate-500">Duration</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">
                      {formatDuration(prog.duration_months)}
                    </dd>
                  </div>
                  <div className="text-right">
                    <dt className="text-slate-500">Tuition / year</dt>
                    <dd className="font-semibold text-primary-700 mt-0.5">
                      {formatMoney(prog.tuition_per_year)}
                    </dd>
                  </div>
                </dl>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
