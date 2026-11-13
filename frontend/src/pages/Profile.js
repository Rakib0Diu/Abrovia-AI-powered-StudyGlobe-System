import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { countriesApi, programsApi } from '../services/api';
import { Card, ErrorAlert, FormField, PageHeader, Spinner } from '../components/UI';

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500';

const EDUCATION_LEVELS = ['High School', 'Diploma', 'Bachelor', 'Master'];
const DEGREE_LEVELS = ['Bachelor', 'Master', 'PhD', 'Diploma'];

export default function Profile() {
  const { user, profile, updateProfile } = useAuth();

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    nationality: '',
    education_level: '',
    gpa: '',
    ielts_score: '',
    preferred_country_id: '',
    preferred_degree_level: '',
    preferred_field: '',
    budget_max: '',
  });

  const [countries, setCountries] = useState([]);
  const [fields, setFields] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const timerRef = useRef(null);

  // Sync form state when profile loads or updates
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '',
        phone: profile.phone ?? '',
        nationality: profile.nationality ?? '',
        education_level: profile.education_level ?? '',
        gpa: profile.gpa !== null && profile.gpa !== undefined ? String(profile.gpa) : '',
        ielts_score:
          profile.ielts_score !== null && profile.ielts_score !== undefined
            ? String(profile.ielts_score)
            : '',
        preferred_country_id:
          profile.preferred_country_id !== null &&
          profile.preferred_country_id !== undefined
            ? String(profile.preferred_country_id)
            : '',
        preferred_degree_level: profile.preferred_degree_level ?? '',
        preferred_field: profile.preferred_field ?? '',
        budget_max:
          profile.budget_max !== null && profile.budget_max !== undefined
            ? String(profile.budget_max)
            : '',
      });
    }
  }, [profile]);

  // Load countries and program fields for preference selects
  useEffect(() => {
    let ignore = false;
    setLoadingOptions(true);

    Promise.all([
      countriesApi.list().catch(() => ({ data: [] })),
      programsApi.fields().catch(() => ({ data: [] })),
    ])
      .then(([countriesRes, fieldsRes]) => {
        if (!ignore) {
          setCountries(countriesRes.data || []);
          setFields(fieldsRes.data || []);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoadingOptions(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSavedSuccess(false);

    let gpaNum = null;
    if (form.gpa !== '') {
      gpaNum = Number(form.gpa);
      if (Number.isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4) {
        setError('GPA must be between 0 and 4.0.');
        return;
      }
    }

    let ieltsNum = null;
    if (form.ielts_score !== '') {
      ieltsNum = Number(form.ielts_score);
      if (Number.isNaN(ieltsNum) || ieltsNum < 0 || ieltsNum > 9) {
        setError('IELTS score must be between 0 and 9.0.');
        return;
      }
    }

    let budgetNum = null;
    if (form.budget_max !== '') {
      budgetNum = Number(form.budget_max);
      if (Number.isNaN(budgetNum) || budgetNum < 0) {
        setError('Max tuition budget must be 0 or greater.');
        return;
      }
    }

    const payload = {
      full_name: form.full_name.trim() || null,
      phone: form.phone.trim() || null,
      nationality: form.nationality.trim() || null,
      education_level: form.education_level || null,
      gpa: gpaNum,
      ielts_score: ieltsNum,
      preferred_country_id:
        form.preferred_country_id !== '' ? Number(form.preferred_country_id) : null,
      preferred_degree_level: form.preferred_degree_level || null,
      preferred_field: form.preferred_field || null,
      budget_max: budgetNum,
    };

    setSaving(true);
    try {
      await updateProfile(payload);
      setSavedSuccess(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  if (!profile && loadingOptions) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="My profile"
        subtitle="Manage your academic background and study-abroad preferences."
      />

      <Card className="p-6 sm:p-8 max-w-4xl">
        <ErrorAlert message={error} className="mb-6" />

        {savedSuccess && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            ✓ Profile saved
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField label="Full name" htmlFor="profile-full-name">
              <input
                id="profile-full-name"
                name="full_name"
                type="text"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Your full name"
                className={INPUT_CLASS}
              />
            </FormField>

            <FormField label="Email address" htmlFor="profile-email" hint="Read-only">
              <input
                id="profile-email"
                type="email"
                readOnly
                disabled
                value={profile?.email || user?.email || ''}
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500 cursor-not-allowed dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-400"
              />
            </FormField>

            <FormField label="Phone number" htmlFor="profile-phone">
              <input
                id="profile-phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 555 234 5678"
                className={INPUT_CLASS}
              />
            </FormField>

            <FormField label="Nationality" htmlFor="profile-nationality">
              <input
                id="profile-nationality"
                name="nationality"
                type="text"
                value={form.nationality}
                onChange={handleChange}
                placeholder="e.g. Bangladeshi, Canadian"
                className={INPUT_CLASS}
              />
            </FormField>

            <FormField
              label="Current education level"
              htmlFor="profile-education-level"
            >
              <select
                id="profile-education-level"
                name="education_level"
                value={form.education_level}
                onChange={handleChange}
                className={INPUT_CLASS}
              >
                <option value="">Select education level</option>
                {EDUCATION_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="GPA"
              htmlFor="profile-gpa"
              hint="4.0 scale (0.00 – 4.00)"
            >
              <input
                id="profile-gpa"
                name="gpa"
                type="number"
                min="0"
                max="4"
                step="0.01"
                value={form.gpa}
                onChange={handleChange}
                placeholder="e.g. 3.65"
                className={INPUT_CLASS}
              />
            </FormField>

            <FormField
              label="IELTS score"
              htmlFor="profile-ielts"
              hint="Band score (0.0 – 9.0)"
            >
              <input
                id="profile-ielts"
                name="ielts_score"
                type="number"
                min="0"
                max="9"
                step="0.5"
                value={form.ielts_score}
                onChange={handleChange}
                placeholder="e.g. 7.0"
                className={INPUT_CLASS}
              />
            </FormField>

            <FormField
              label="Preferred destination country"
              htmlFor="profile-preferred-country"
            >
              <select
                id="profile-preferred-country"
                name="preferred_country_id"
                value={form.preferred_country_id}
                onChange={handleChange}
                className={INPUT_CLASS}
              >
                <option value="">Any country</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.flag_emoji ? `${c.flag_emoji} ` : ''}
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Preferred degree level"
              htmlFor="profile-preferred-degree"
            >
              <select
                id="profile-preferred-degree"
                name="preferred_degree_level"
                value={form.preferred_degree_level}
                onChange={handleChange}
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

            <FormField
              label="Preferred field of study"
              htmlFor="profile-preferred-field"
            >
              <select
                id="profile-preferred-field"
                name="preferred_field"
                value={form.preferred_field}
                onChange={handleChange}
                className={INPUT_CLASS}
              >
                <option value="">Any field</option>
                {fields.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Max tuition per year (USD)"
              htmlFor="profile-budget-max"
              hint="Used when filtering universities with your preferences"
            >
              <input
                id="profile-budget-max"
                name="budget_max"
                type="number"
                min="0"
                step="500"
                value={form.budget_max}
                onChange={handleChange}
                placeholder="e.g. 25000"
                className={INPUT_CLASS}
              />
            </FormField>
          </div>

          <div className="pt-2 flex items-center justify-end border-t border-slate-200 dark:border-slate-700">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-6 py-2.5 font-medium transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
