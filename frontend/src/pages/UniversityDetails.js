import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  universitiesApi,
  programsApi,
  intakesApi,
  languageApi,
  scholarshipsApi,
  formatMoney,
  formatDate,
  formatDuration,
} from '../services/api';
import {
  Badge,
  Card,
  EmptyState,
  ErrorAlert,
  FormField,
  Spinner,
} from '../components/UI';

const TABS = ['Overview', 'Programs', 'Intakes', 'Language', 'Scholarships'];
const DEGREE_LEVELS = ['Bachelor', 'Master', 'PhD', 'Diploma'];

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

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

export default function UniversityDetails() {
  const { id } = useParams();
  const { profile } = useAuth();

  const [university, setUniversity] = useState(null);
  const [loadingUni, setLoadingUni] = useState(true);
  const [uniError, setUniError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const [activeTab, setActiveTab] = useState('Overview');

  // Lazy-loaded tab caches
  const [tabData, setTabData] = useState({
    Programs: null,
    Intakes: null,
    Language: null,
    Scholarships: null,
  });
  const [tabLoading, setTabLoading] = useState({
    Programs: false,
    Intakes: false,
    Language: false,
    Scholarships: false,
  });
  const [tabError, setTabError] = useState({
    Programs: '',
    Intakes: '',
    Language: '',
    Scholarships: '',
  });

  // Scholarship eligibility checker state
  const [assessGpa, setAssessGpa] = useState('');
  const [assessIelts, setAssessIelts] = useState('');
  const [assessDegree, setAssessDegree] = useState('');
  const [assessing, setAssessing] = useState(false);
  const [assessError, setAssessError] = useState('');
  const [assessResult, setAssessResult] = useState(null);

  // Pre-fill eligibility checker from profile when logged in
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

  // Fetch university header details when :id changes
  useEffect(() => {
    let ignore = false;
    setLoadingUni(true);
    setUniError('');
    setNotFound(false);
    setUniversity(null);
    setActiveTab('Overview');
    setTabData({
      Programs: null,
      Intakes: null,
      Language: null,
      Scholarships: null,
    });
    setTabLoading({
      Programs: false,
      Intakes: false,
      Language: false,
      Scholarships: false,
    });
    setTabError({
      Programs: '',
      Intakes: '',
      Language: '',
      Scholarships: '',
    });
    setAssessResult(null);
    setAssessError('');

    universitiesApi
      .get(id)
      .then((res) => {
        if (!ignore) {
          setUniversity(res.data);
        }
      })
      .catch((err) => {
        if (!ignore) {
          if (err.status === 404) {
            setNotFound(true);
          } else {
            setUniError(err.message || 'Failed to load university details.');
          }
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoadingUni(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  // Lazy load active tab data on first open and cache in state
  useEffect(() => {
    if (!university || activeTab === 'Overview') return undefined;
    if (tabData[activeTab] !== null) return undefined;

    let ignore = false;
    setTabLoading((prev) => ({ ...prev, [activeTab]: true }));
    setTabError((prev) => ({ ...prev, [activeTab]: '' }));

    const fetcherMap = {
      Programs: () => programsApi.byUniversity(id),
      Intakes: () => intakesApi.byUniversity(id),
      Language: () => languageApi.byUniversity(id),
      Scholarships: () => scholarshipsApi.byUniversity(id),
    };

    const fetcher = fetcherMap[activeTab];
    if (!fetcher) return undefined;

    fetcher()
      .then((res) => {
        if (!ignore) {
          setTabData((prev) => ({ ...prev, [activeTab]: res.data || [] }));
        }
      })
      .catch((err) => {
        if (!ignore) {
          setTabError((prev) => ({
            ...prev,
            [activeTab]: err.message || `Failed to load ${activeTab.toLowerCase()}.`,
          }));
        }
      })
      .finally(() => {
        if (!ignore) {
          setTabLoading((prev) => ({ ...prev, [activeTab]: false }));
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeTab, university, id, tabData]);

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
        university_id: Number(id),
      });
      setAssessResult(res.data);
    } catch (err) {
      setAssessError(err.message || 'Failed to assess scholarship eligibility.');
    } finally {
      setAssessing(false);
    }
  };

  if (loadingUni) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EmptyState
          title="University not found"
          message="The university you are looking for does not exist or may have been removed."
          action={
            <Link
              to="/universities"
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition"
            >
              Back to Universities
            </Link>
          }
        />
      </div>
    );
  }

  if (uniError || !university) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ErrorAlert message={uniError || 'Unable to load university.'} />
      </div>
    );
  }

  const initial = (university.name || 'U').charAt(0).toUpperCase();
  const tuitionText =
    university.tuition_min !== null &&
    university.tuition_min !== undefined &&
    university.tuition_max !== null &&
    university.tuition_max !== undefined
      ? `${formatMoney(university.tuition_min)} – ${formatMoney(university.tuition_max)} / year`
      : formatMoney(university.tuition_min ?? university.tuition_max);

  const isDeadlinePassed = (dateStr) => {
    if (!dateStr) return false;
    const deadlineDate = new Date(dateStr);
    if (Number.isNaN(deadlineDate.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadlineDate < today;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <Link
          to="/universities"
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          ← Back to universities
        </Link>
      </div>

      {/* Header Card */}
      <Card className="p-6 sm:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            {university.logo_url ? (
              <img
                src={university.logo_url}
                alt={`${university.name} logo`}
                className="h-16 w-16 rounded-xl object-contain border border-slate-200 bg-white shrink-0"
              />
            ) : (
              <div
                aria-hidden="true"
                className="h-16 w-16 rounded-xl bg-primary-100 text-primary-700 font-bold text-2xl flex items-center justify-center shrink-0"
              >
                {initial}
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                  {university.name}
                </h1>
                {university.world_ranking && (
                  <Badge color="blue">#{university.world_ranking} world</Badge>
                )}
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {university.country?.flag_emoji ? `${university.country.flag_emoji} ` : ''}
                {university.city ? `${university.city}, ` : ''}
                {university.country?.name || ''}
              </p>

              {university.description && (
                <p className="mt-4 text-slate-600 text-sm sm:text-base max-w-3xl leading-relaxed">
                  {university.description}
                </p>
              )}
            </div>
          </div>

          {university.website && (
            <div className="shrink-0">
              <a
                href={university.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition"
              >
                Visit website ↗
              </a>
            </div>
          )}
        </div>

        {/* Summary Metrics Bar */}
        <dl className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Tuition range</dt>
            <dd className="mt-0.5 font-semibold text-primary-700">{tuitionText}</dd>
          </div>
          <div>
            <dt className="text-slate-500">World ranking</dt>
            <dd className="mt-0.5 font-semibold text-slate-800">
              {university.world_ranking ? `#${university.world_ranking}` : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Students</dt>
            <dd className="mt-0.5 font-semibold text-slate-800">
              {university.student_count
                ? Number(university.student_count).toLocaleString('en-US')
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Founded</dt>
            <dd className="mt-0.5 font-semibold text-slate-800">
              {university.founded_year || '—'}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Tab Bar */}
      <div className="border-b border-slate-200 mb-6 overflow-x-auto">
        <nav className="-mb-px flex space-x-6" aria-label="University sections">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap pb-3 px-1 border-b-2 text-sm font-medium transition focus:outline-none ${
                  isActive
                    ? 'border-primary-600 text-primary-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content Region */}
      <div className="min-h-[320px]">
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-slate-800">About {university.name}</h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {university.description || 'No overview description available.'}
              </p>

              {university.country?.visa_info && (
                <div className="pt-4 border-t border-slate-200">
                  <h3 className="text-base font-semibold text-slate-800">
                    Student Visa Information ({university.country.name})
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    {university.country.visa_info}
                  </p>
                </div>
              )}
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Key Facts</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500">Country</dt>
                  <dd className="font-medium text-slate-800">
                    {university.country?.flag_emoji ? `${university.country.flag_emoji} ` : ''}
                    {university.country?.name || '—'}
                  </dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500">City</dt>
                  <dd className="font-medium text-slate-800">{university.city || '—'}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500">Official language</dt>
                  <dd className="font-medium text-slate-800">
                    {university.country?.official_language || '—'}
                  </dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500">Currency</dt>
                  <dd className="font-medium text-slate-800">
                    {university.country?.currency || '—'}
                  </dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500">Est. living cost</dt>
                  <dd className="font-medium text-slate-800">
                    {university.country?.living_cost_monthly
                      ? `${formatMoney(university.country.living_cost_monthly)} / month`
                      : '—'}
                  </dd>
                </div>
                <div className="flex justify-between py-1.5">
                  <dt className="text-slate-500">Founded year</dt>
                  <dd className="font-medium text-slate-800">
                    {university.founded_year || '—'}
                  </dd>
                </div>
              </dl>
            </Card>
          </div>
        )}

        {/* 2. PROGRAMS TAB */}
        {activeTab === 'Programs' && (
          <div>
            {tabLoading.Programs ? (
              <Spinner />
            ) : tabError.Programs ? (
              <ErrorAlert message={tabError.Programs} />
            ) : !tabData.Programs || tabData.Programs.length === 0 ? (
              <EmptyState
                title="No programs found"
                message="No academic programs are currently listed for this university."
              />
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">
                          Level
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">
                          Field
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">
                          Tuition / year
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {tabData.Programs.map((prog) => (
                        <tr key={prog.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{prog.name}</div>
                            {prog.description && (
                              <div className="text-xs text-slate-500 mt-0.5">
                                {prog.description}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge color={getDegreeBadgeColor(prog.degree_level)}>
                              {prog.degree_level || '—'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                            {prog.field || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                            {formatDuration(prog.duration_months)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-semibold text-primary-700">
                            {formatMoney(prog.tuition_per_year)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* 3. INTAKES TAB */}
        {activeTab === 'Intakes' && (
          <div>
            {tabLoading.Intakes ? (
              <Spinner />
            ) : tabError.Intakes ? (
              <ErrorAlert message={tabError.Intakes} />
            ) : !tabData.Intakes || tabData.Intakes.length === 0 ? (
              <EmptyState
                title="No intakes found"
                message="No upcoming intake schedules are currently listed for this university."
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {tabData.Intakes.map((intake) => {
                  const passed = isDeadlinePassed(intake.application_deadline);
                  return (
                    <Card key={intake.id} className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">{intake.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Season: {intake.season || '—'}
                          </p>
                        </div>
                        <Badge color={intake.is_open ? 'green' : 'slate'}>
                          {intake.is_open ? 'Open' : 'Closed'}
                        </Badge>
                      </div>

                      <dl className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <dt className="text-slate-500 text-xs">Start date</dt>
                          <dd className="font-medium text-slate-800 mt-0.5">
                            {formatDate(intake.start_date)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500 text-xs">Application deadline</dt>
                          <dd className="font-medium text-slate-800 mt-0.5">
                            {formatDate(intake.application_deadline)}
                          </dd>
                          {passed && (
                            <p className="mt-1 text-xs font-medium text-red-600">
                              Deadline passed
                            </p>
                          )}
                        </div>
                      </dl>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. LANGUAGE TAB */}
        {activeTab === 'Language' && (
          <div>
            {tabLoading.Language ? (
              <Spinner />
            ) : tabError.Language ? (
              <ErrorAlert message={tabError.Language} />
            ) : !tabData.Language || tabData.Language.length === 0 ? (
              <EmptyState
                title="No language requirements listed"
                message="No standardized English test scores are currently listed for this university."
              />
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">
                          Test
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">
                          Overall
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">
                          Each band
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">
                          Level
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {tabData.Language.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-800">
                            {req.test_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-semibold text-primary-700">
                            {req.min_overall ?? '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                            {req.min_each_band ?? '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge color="slate">{req.degree_level || 'All levels'}</Badge>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{req.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* 5. SCHOLARSHIPS TAB */}
        {activeTab === 'Scholarships' && (
          <div className="space-y-8">
            {/* (b) Eligibility Checker Card above the list */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Scholarship Eligibility Checker
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Assessment assumes a 4.0 GPA scale
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
                    Checked <strong>{assessResult.summary?.total || 0}</strong> scholarships — you
                    qualify for{' '}
                    <strong className="text-emerald-700">
                      {assessResult.summary?.eligible_count || 0}
                    </strong>
                    .
                  </p>

                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Group 1: You may qualify */}
                    <div>
                      <h3 className="text-sm font-bold text-emerald-700 mb-3">
                        ✓ You may qualify ({assessResult.eligible?.length || 0})
                      </h3>
                      {!assessResult.eligible || assessResult.eligible.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          No scholarships matched all requirements for the scores entered.
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

                    {/* Group 2: Not eligible yet */}
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

            {/* (a) Full Scholarships List */}
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-4">
                Available Scholarships (University &amp; Country-Wide)
              </h2>

              {tabLoading.Scholarships ? (
                <Spinner />
              ) : tabError.Scholarships ? (
                <ErrorAlert message={tabError.Scholarships} />
              ) : !tabData.Scholarships || tabData.Scholarships.length === 0 ? (
                <EmptyState
                  title="No scholarships listed"
                  message="No scholarships are currently listed for this university or country."
                />
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {tabData.Scholarships.map((sch) => (
                    <Card key={sch.id} className="p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-base font-bold text-slate-800">{sch.name}</h3>
                          <Badge color={sch.university_id ? 'blue' : 'amber'}>
                            {sch.university_id ? 'University' : 'Country-wide'}
                          </Badge>
                        </div>

                        {sch.description && (
                          <p className="mt-2 text-sm text-slate-600">{sch.description}</p>
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
        )}
      </div>
    </div>
  );
}
