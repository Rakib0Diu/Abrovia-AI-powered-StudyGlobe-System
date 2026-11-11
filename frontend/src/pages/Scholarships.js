import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  scholarshipsApi,
  formatMoney,
  formatDate,
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

const DEGREE_LEVELS = ['Bachelor', 'Master', 'PhD', 'Diploma'];

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

export default function Scholarships() {
  const { profile } = useAuth();

  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Eligibility assessment state
  const [assessGpa, setAssessGpa] = useState('');
  const [assessIelts, setAssessIelts] = useState('');
  const [assessDegree, setAssessDegree] = useState('');
  const [assessing, setAssessing] = useState(false);
  const [assessError, setAssessError] = useState('');
  const [assessResult, setAssessResult] = useState(null);

  // Pre-fill eligibility checker from user profile
  useEffect(() => {
    if (profile) {
      setAssessGpa((prev) =>
        prev === '' && profile.gpa !== null && profile.gpa !== undefined
          ? String(profile.gpa)
          : prev
      );
      setAssessIelts((prev) =>
        prev === '' &&
        profile.ielts_score !== null &&
        profile.ielts_score !== undefined
          ? String(profile.ielts_score)
          : prev
      );
      setAssessDegree((prev) =>
        prev === '' && profile.preferred_degree_level
          ? profile.preferred_degree_level
          : prev
      );
    }
  }, [profile]);

  // Load all scholarships on mount
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');

    scholarshipsApi
      .list()
      .then((res) => {
        if (!ignore) {
          setScholarships(res.data || []);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load scholarships.');
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

  const handleAssessSubmit = async (e) => {
    e.preventDefault();
    setAssessError('');

    if (assessGpa === '' || assessGpa === null) {
      setAssessError('Please enter your GPA (0.0 – 4.0) to check eligibility.');
      return;
    }

    const gpaNum = Number(assessGpa);
    if (Number.isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4) {
      setAssessError('GPA must be between 0 and 4.0.');
      return;
    }

    let ieltsNum = undefined;
    if (assessIelts !== '') {
      ieltsNum = Number(assessIelts);
      if (Number.isNaN(ieltsNum) || ieltsNum < 0 || ieltsNum > 9) {
        setAssessError('IELTS score must be between 0 and 9.0.');
        return;
      }
    }

    setAssessing(true);
    try {
      const res = await scholarshipsApi.assess({
        gpa: gpaNum,
        ielts: ieltsNum,
        degree_level: assessDegree || undefined,
      });
      setAssessResult(res.data);
    } catch (err) {
      setAssessError(err.message || 'Failed to assess scholarship eligibility.');
    } finally {
      setAssessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        title="Scholarships &amp; Grants"
        subtitle="Explore global scholarships, institutional bursaries, and assess your qualification eligibility in real time."
      />

      {/* 1. Eligibility Checker Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Scholarship Eligibility Checker
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Assessment assumes a 4.0 GPA scale across all candidate scholarships
            </p>
          </div>
        </div>

        <ErrorAlert message={assessError} className="mb-4" />

        <form
          onSubmit={handleAssessSubmit}
          className="grid gap-4 sm:grid-cols-4 items-end"
          noValidate
        >
          <FormField label="GPA (0–4)" htmlFor="assess-gpa" required>
            <input
              id="assess-gpa"
              type="number"
              min="0"
              max="4"
              step="0.01"
              value={assessGpa}
              onChange={(e) => setAssessGpa(e.target.value)}
              placeholder="e.g. 3.5"
              className={INPUT_CLASS}
            />
          </FormField>

          <FormField label="IELTS (0–9)" htmlFor="assess-ielts">
            <input
              id="assess-ielts"
              type="number"
              min="0"
              max="9"
              step="0.5"
              value={assessIelts}
              onChange={(e) => setAssessIelts(e.target.value)}
              placeholder="e.g. 6.5"
              className={INPUT_CLASS}
            />
          </FormField>

          <FormField label="Degree level" htmlFor="assess-degree">
            <select
              id="assess-degree"
              value={assessDegree}
              onChange={(e) => setAssessDegree(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Any degree level</option>
              {DEGREE_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </FormField>

          <div>
            <button
              type="submit"
              disabled={assessing}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50"
            >
              {assessing ? 'Checking…' : 'Check eligibility'}
            </button>
          </div>
        </form>

        {/* Assessment Results */}
        {assessResult && (
          <div className="mt-6 pt-6 border-t border-slate-200 space-y-6">
            <p className="text-sm text-slate-600">
              Evaluated <strong>{assessResult.summary?.total || 0}</strong> scholarships — you
              qualify for{' '}
              <strong className="text-emerald-700">
                {assessResult.summary?.eligible_count || 0}
              </strong>
              .
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Group 1: Eligible */}
              <div>
                <h3 className="text-sm font-bold text-emerald-700 mb-3">
                  ✓ You may qualify ({assessResult.eligible?.length || 0})
                </h3>
                {!assessResult.eligible || assessResult.eligible.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No scholarships matched all criteria for the scores entered.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {assessResult.eligible.map((sch) => (
                      <div
                        key={sch.id}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-emerald-900 text-sm">
                            ✓ {sch.name}
                          </span>
                          {sch.coverage && (
                            <Badge color="green">{sch.coverage}</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-emerald-800">
                          {sch.amount ? `Amount: ${formatMoney(sch.amount)} · ` : ''}
                          Deadline: {formatDate(sch.deadline)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Group 2: Not eligible */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3">
                  Not eligible yet ({assessResult.not_eligible?.length || 0})
                </h3>
                {!assessResult.not_eligible ||
                assessResult.not_eligible.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    You meet the criteria for all listed scholarships!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {assessResult.not_eligible.map((sch) => (
                      <div
                        key={sch.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="font-semibold text-slate-800 text-sm">
                          {sch.name}
                        </div>
                        <ul className="mt-2 space-y-1 list-disc list-inside">
                          {(sch.reasons || []).map((reason, idx) => (
                            <li key={idx} className="text-xs text-red-600">
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 2. All Scholarships List */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          All Available Scholarships
        </h2>

        {loading ? (
          <Spinner size="lg" />
        ) : error ? (
          <ErrorAlert message={error} />
        ) : scholarships.length === 0 ? (
          <EmptyState
            title="No scholarships listed"
            message="No scholarships are currently listed in the database."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {scholarships.map((sch) => (
              <Card key={sch.id} className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-slate-800">{sch.name}</h3>
                    <Badge color={sch.university_id ? 'blue' : 'amber'}>
                      {sch.university_id ? 'University' : 'Country-wide'}
                    </Badge>
                  </div>

                  {sch.university && (
                    <p className="mt-1 text-xs">
                      <Link
                        to={`/universities/${sch.university.id}`}
                        className="font-medium text-primary-600 hover:text-primary-700"
                      >
                        {sch.university.name}
                      </Link>
                    </p>
                  )}

                  {sch.description && (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                      {sch.description}
                    </p>
                  )}

                  <dl className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-slate-500">Coverage / Amount</dt>
                      <dd className="font-semibold text-primary-700 mt-0.5">
                        {sch.coverage || formatMoney(sch.amount)}
                        {sch.coverage && sch.amount
                          ? ` (${formatMoney(sch.amount)})`
                          : ''}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Deadline</dt>
                      <dd className="font-medium text-slate-800 mt-0.5">
                        {formatDate(sch.deadline)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Minimum requirements</dt>
                      <dd className="font-medium text-slate-800 mt-0.5">
                        GPA: {sch.min_gpa ?? '—'} · IELTS: {sch.min_ielts ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Degree level</dt>
                      <dd className="font-medium text-slate-800 mt-0.5">
                        {sch.degree_level || 'Any level'}
                      </dd>
                    </div>
                  </dl>
                </div>

                {sch.url && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <a
                      href={sch.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                    >
                      Official scholarship page ↗
                    </a>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

