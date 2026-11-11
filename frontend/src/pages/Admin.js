import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  adminApi,
  countriesApi,
  universitiesApi,
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

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

const TABLES = [
  { key: 'countries', label: 'Countries' },
  { key: 'universities', label: 'Universities' },
  { key: 'programs', label: 'Programs' },
  { key: 'intakes', label: 'Intakes' },
  { key: 'language_requirements', label: 'Language Requirements' },
  { key: 'scholarships', label: 'Scholarships' },
];

export const FIELD_CONFIG = {
  countries: [
    { name: 'name', label: 'Country name', type: 'text', required: true },
    { name: 'code', label: 'ISO code (2-letter)', type: 'text', placeholder: 'e.g. US, GB, CA' },
    { name: 'capital', label: 'Capital city', type: 'text' },
    { name: 'region', label: 'Region', type: 'text', placeholder: 'e.g. Europe, Asia, North America' },
    { name: 'official_language', label: 'Official language', type: 'text' },
    { name: 'currency', label: 'Currency', type: 'text', placeholder: 'e.g. USD, GBP, EUR' },
    { name: 'flag_emoji', label: 'Flag emoji', type: 'text', placeholder: 'e.g. 🇺🇸' },
    {
      name: 'living_cost_monthly',
      label: 'Monthly living cost (USD)',
      type: 'number',
      step: '50',
    },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'visa_info', label: 'Student visa info', type: 'textarea' },
  ],
  universities: [
    { name: 'name', label: 'University name', type: 'text', required: true },
    {
      name: 'country_id',
      label: 'Country',
      type: 'select',
      fk: 'countries',
      required: true,
    },
    { name: 'city', label: 'City', type: 'text' },
    { name: 'website', label: 'Website URL', type: 'text', placeholder: 'https://...' },
    { name: 'world_ranking', label: 'World ranking', type: 'number', step: '1' },
    { name: 'tuition_min', label: 'Min tuition (USD/yr)', type: 'number', step: '500' },
    { name: 'tuition_max', label: 'Max tuition (USD/yr)', type: 'number', step: '500' },
    { name: 'student_count', label: 'Student count', type: 'number', step: '100' },
    { name: 'founded_year', label: 'Founded year', type: 'number', step: '1' },
    { name: 'logo_url', label: 'Logo URL', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
  programs: [
    { name: 'name', label: 'Program name', type: 'text', required: true },
    {
      name: 'university_id',
      label: 'University',
      type: 'select',
      fk: 'universities',
      required: true,
    },
    {
      name: 'degree_level',
      label: 'Degree level',
      type: 'select',
      options: ['Bachelor', 'Master', 'PhD', 'Diploma'],
      required: true,
    },
    {
      name: 'field',
      label: 'Field of study',
      type: 'text',
      placeholder: 'e.g. Computer Science, Business, Engineering',
    },
    { name: 'duration_months', label: 'Duration (months)', type: 'number', step: '1' },
    {
      name: 'tuition_per_year',
      label: 'Tuition per year (USD)',
      type: 'number',
      step: '500',
    },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
  intakes: [
    {
      name: 'university_id',
      label: 'University',
      type: 'select',
      fk: 'universities',
      required: true,
    },
    {
      name: 'name',
      label: 'Intake name',
      type: 'text',
      required: true,
      placeholder: 'e.g. Fall 2027',
    },
    {
      name: 'season',
      label: 'Season',
      type: 'select',
      options: ['Fall', 'Spring', 'Summer', 'Winter'],
    },
    { name: 'start_date', label: 'Start date', type: 'date' },
    { name: 'application_deadline', label: 'Application deadline', type: 'date' },
    { name: 'is_open', label: 'Open for applications', type: 'checkbox' },
  ],
  language_requirements: [
    {
      name: 'university_id',
      label: 'University',
      type: 'select',
      fk: 'universities',
      required: true,
    },
    {
      name: 'test_name',
      label: 'Test name',
      type: 'select',
      options: ['IELTS', 'TOEFL iBT', 'PTE Academic', 'Duolingo'],
      required: true,
    },
    { name: 'min_overall', label: 'Minimum overall score', type: 'number', step: '0.5' },
    { name: 'min_each_band', label: 'Minimum each band', type: 'number', step: '0.5' },
    {
      name: 'degree_level',
      label: 'Degree level (leave blank for all)',
      type: 'select',
      options: ['Bachelor', 'Master', 'PhD', 'Diploma'],
      emptyLabel: 'All levels',
    },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  scholarships: [
    { name: 'name', label: 'Scholarship name', type: 'text', required: true },
    {
      name: 'university_id',
      label: 'University (optional for country-wide)',
      type: 'select',
      fk: 'universities',
      emptyLabel: 'None (Country-wide / General)',
    },
    {
      name: 'country_id',
      label: 'Country',
      type: 'select',
      fk: 'countries',
      emptyLabel: 'Select country',
    },
    {
      name: 'coverage',
      label: 'Coverage summary',
      type: 'text',
      placeholder: 'e.g. Full tuition, 50% tuition',
    },
    { name: 'amount', label: 'Amount (USD)', type: 'number', step: '500' },
    { name: 'min_gpa', label: 'Minimum GPA (0–4.0)', type: 'number', step: '0.01' },
    { name: 'min_ielts', label: 'Minimum IELTS (0–9.0)', type: 'number', step: '0.5' },
    {
      name: 'degree_level',
      label: 'Degree level (optional)',
      type: 'select',
      options: ['Bachelor', 'Master', 'PhD', 'Diploma'],
      emptyLabel: 'Any level',
    },
    { name: 'deadline', label: 'Application deadline', type: 'date' },
    { name: 'url', label: 'Official URL', type: 'text', placeholder: 'https://...' },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
};

function createEmptyFormState(table) {
  const fields = FIELD_CONFIG[table] || [];
  const state = {};
  for (const field of fields) {
    if (field.type === 'checkbox') {
      state[field.name] = true;
    } else {
      state[field.name] = '';
    }
  }
  return state;
}

function populateFormState(table, row) {
  const fields = FIELD_CONFIG[table] || [];
  const state = {};
  for (const field of fields) {
    const val = row[field.name];
    if (field.type === 'checkbox') {
      state[field.name] = Boolean(val);
    } else if (field.type === 'date' && val) {
      state[field.name] = String(val).slice(0, 10);
    } else {
      state[field.name] = val !== null && val !== undefined ? String(val) : '';
    }
  }
  return state;
}

export default function Admin() {
  const [activeTable, setActiveTable] = useState('countries');
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const toastTimerRef = useRef(null);

  // Foreign-key reference lists
  const [countries, setCountries] = useState([]);
  const [universities, setUniversities] = useState([]);

  // Add / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [formState, setFormState] = useState({});
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((msg) => {
    setSuccessMessage(msg);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setSuccessMessage('');
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const loadReferenceData = useCallback(() => {
    Promise.all([
      countriesApi.list().catch(() => ({ data: [] })),
      universitiesApi.list().catch(() => ({ data: [] })),
    ]).then(([cRes, uRes]) => {
      setCountries(cRes.data || []);
      setUniversities(uRes.data || []);
    });
  }, []);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  const fetchTableRows = useCallback(async (table) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.list(table);
      setRows(res.data || []);
    } catch (err) {
      setError(err.message || `Failed to load ${table}.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSearch('');
    fetchTableRows(activeTable);
  }, [activeTable, fetchTableRows]);

  const countriesMap = useMemo(() => {
    const map = {};
    for (const c of countries) {
      map[c.id] = c.name;
    }
    return map;
  }, [countries]);

  const universitiesMap = useMemo(() => {
    const map = {};
    for (const u of universities) {
      map[u.id] = u.name;
    }
    return map;
  }, [universities]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const nameStr = (row.name || row.test_name || '').toLowerCase();
      const cityStr = (row.city || row.region || row.field || '').toLowerCase();
      const uniStr = (
        row.university?.name ||
        universitiesMap[row.university_id] ||
        ''
      ).toLowerCase();
      const countryStr = (
        row.country?.name ||
        countriesMap[row.country_id] ||
        ''
      ).toLowerCase();
      return (
        nameStr.includes(q) ||
        cityStr.includes(q) ||
        uniStr.includes(q) ||
        countryStr.includes(q)
      );
    });
  }, [rows, search, universitiesMap, countriesMap]);

  const openAddModal = () => {
    setEditingRow(null);
    setFormState(createEmptyFormState(activeTable));
    setModalError('');
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setEditingRow(row);
    setFormState(populateFormState(activeTable, row));
    setModalError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingRow(null);
    setModalError('');
  };

  const handleFieldChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    const fields = FIELD_CONFIG[activeTable] || [];
    const payload = {};

    for (const field of fields) {
      const val = formState[field.name];
      if (field.required && (val === '' || val === null || val === undefined)) {
        setModalError(`${field.label} is required.`);
        return;
      }

      if (field.type === 'checkbox') {
        payload[field.name] = Boolean(val);
      } else if (field.type === 'number') {
        payload[field.name] = val === '' ? null : Number(val);
      } else if (field.fk) {
        payload[field.name] = val === '' ? null : Number(val);
      } else {
        payload[field.name] = val === '' ? null : String(val).trim();
      }
    }

    setSaving(true);
    try {
      if (editingRow) {
        await adminApi.update(activeTable, editingRow.id, payload);
        showToast('Record updated successfully.');
      } else {
        await adminApi.create(activeTable, payload);
        showToast('Record created successfully.');
      }
      setModalOpen(false);
      setEditingRow(null);
      await fetchTableRows(activeTable);
      if (activeTable === 'countries' || activeTable === 'universities') {
        loadReferenceData();
      }
    } catch (err) {
      setModalError(err.message || 'Failed to save record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const label = row.name || row.test_name || `#${row.id}`;
    if (!window.confirm(`Are you sure you want to delete "${label}"?`)) {
      return;
    }

    setError('');
    try {
      await adminApi.remove(activeTable, row.id);
      showToast('Record deleted.');
      await fetchTableRows(activeTable);
      if (activeTable === 'countries' || activeTable === 'universities') {
        loadReferenceData();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete record.');
    }
  };

  const renderTableHeaders = () => {
    switch (activeTable) {
      case 'countries':
        return ['Name', 'Code', 'Region', 'Currency'];
      case 'universities':
        return ['Name', 'City', 'Country', 'World ranking', 'Tuition min', 'Tuition max'];
      case 'programs':
        return ['Name', 'University', 'Degree level', 'Field', 'Tuition / year'];
      case 'intakes':
        return ['University', 'Name', 'Season', 'Application deadline', 'Status'];
      case 'language_requirements':
        return ['University', 'Test', 'Min overall', 'Degree level'];
      case 'scholarships':
        return ['Name', 'University', 'Min GPA', 'Min IELTS', 'Deadline'];
      default:
        return ['Name'];
    }
  };

  const renderRowCells = (row) => {
    const countryName = row.country?.name || countriesMap[row.country_id] || '—';
    const uniName = row.university?.name || universitiesMap[row.university_id] || '—';

    switch (activeTable) {
      case 'countries':
        return (
          <>
            <td className="px-6 py-4 font-semibold text-slate-800">
              {row.flag_emoji ? `${row.flag_emoji} ` : ''}
              {row.name}
            </td>
            <td className="px-6 py-4 text-slate-600">{row.code || '—'}</td>
            <td className="px-6 py-4 text-slate-600">{row.region || '—'}</td>
            <td className="px-6 py-4 text-slate-600">{row.currency || '—'}</td>
          </>
        );
      case 'universities':
        return (
          <>
            <td className="px-6 py-4 font-semibold text-slate-800">{row.name}</td>
            <td className="px-6 py-4 text-slate-600">{row.city || '—'}</td>
            <td className="px-6 py-4 text-slate-600">{countryName}</td>
            <td className="px-6 py-4 text-slate-600">
              {row.world_ranking ? `#${row.world_ranking}` : '—'}
            </td>
            <td className="px-6 py-4 text-slate-600">{formatMoney(row.tuition_min)}</td>
            <td className="px-6 py-4 text-slate-600">{formatMoney(row.tuition_max)}</td>
          </>
        );
      case 'programs':
        return (
          <>
            <td className="px-6 py-4 font-semibold text-slate-800">{row.name}</td>
            <td className="px-6 py-4 text-slate-600">{uniName}</td>
            <td className="px-6 py-4">
              <Badge color="blue">{row.degree_level || '—'}</Badge>
            </td>
            <td className="px-6 py-4 text-slate-600">{row.field || '—'}</td>
            <td className="px-6 py-4 font-medium text-primary-700">
              {formatMoney(row.tuition_per_year)}
            </td>
          </>
        );
      case 'intakes':
        return (
          <>
            <td className="px-6 py-4 text-slate-600">{uniName}</td>
            <td className="px-6 py-4 font-semibold text-slate-800">{row.name}</td>
            <td className="px-6 py-4 text-slate-600">{row.season || '—'}</td>
            <td className="px-6 py-4 text-slate-600">
              {formatDate(row.application_deadline)}
            </td>
            <td className="px-6 py-4">
              <Badge color={row.is_open ? 'green' : 'slate'}>
                {row.is_open ? 'Open' : 'Closed'}
              </Badge>
            </td>
          </>
        );
      case 'language_requirements':
        return (
          <>
            <td className="px-6 py-4 text-slate-600">{uniName}</td>
            <td className="px-6 py-4 font-semibold text-slate-800">{row.test_name}</td>
            <td className="px-6 py-4 font-medium text-primary-700">
              {row.min_overall ?? '—'}
            </td>
            <td className="px-6 py-4 text-slate-600">
              {row.degree_level || 'All levels'}
            </td>
          </>
        );
      case 'scholarships':
        return (
          <>
            <td className="px-6 py-4 font-semibold text-slate-800">{row.name}</td>
            <td className="px-6 py-4 text-slate-600">
              {row.university_id ? uniName : 'Country-wide'}
            </td>
            <td className="px-6 py-4 text-slate-600">{row.min_gpa ?? '—'}</td>
            <td className="px-6 py-4 text-slate-600">{row.min_ielts ?? '—'}</td>
            <td className="px-6 py-4 text-slate-600">{formatDate(row.deadline)}</td>
          </>
        );
      default:
        return <td className="px-6 py-4">{row.name}</td>;
    }
  };

  const activeTableLabel =
    TABLES.find((t) => t.key === activeTable)?.label || activeTable;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Admin dashboard"
        subtitle="Create, update, and remove catalog records across all six study-abroad tables."
      />

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          ✓ {successMessage}
        </div>
      )}

      <ErrorAlert message={error} className="mb-6" />

      {/* Table Tab Bar */}
      <div className="border-b border-slate-200 mb-6 overflow-x-auto">
        <nav className="-mb-px flex space-x-6" aria-label="Catalog tables">
          {TABLES.map((t) => {
            const isActive = activeTable === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTable(t.key)}
                className={`whitespace-nowrap pb-3 px-1 border-b-2 text-sm font-medium transition focus:outline-none ${
                  isActive
                    ? 'border-primary-600 text-primary-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Toolbar: Search + Add Button */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="w-full sm:max-w-sm">
          <label htmlFor="admin-search" className="sr-only">
            Search {activeTableLabel}
          </label>
          <input
            id="admin-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTableLabel.toLowerCase()}…`}
            className={INPUT_CLASS}
          />
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition shrink-0"
        >
          + Add
        </button>
      </div>

      {/* Data Table */}
      <div className="min-h-[340px]">
        {loading ? (
          <Spinner size="lg" />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title={`No ${activeTableLabel.toLowerCase()} found`}
            message={
              search.trim()
                ? `No records matched "${search.trim()}".`
                : `Click "+ Add" to create the first record in ${activeTableLabel}.`
            }
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {renderTableHeaders().map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left font-semibold text-slate-700 whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-right font-semibold text-slate-700 whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      {renderRowCells(row)}
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-1 text-xs font-medium transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-lg px-3 py-1 text-xs font-medium transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-modal-title"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 id="admin-modal-title" className="text-lg font-bold text-slate-800">
                {editingRow ? `Edit ${activeTableLabel}` : `Add to ${activeTableLabel}`}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close modal"
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleModalSubmit}
              className="p-6 overflow-y-auto space-y-4"
              noValidate
            >
              <ErrorAlert message={modalError} />

              <div className="grid gap-4 sm:grid-cols-2">
                {(FIELD_CONFIG[activeTable] || []).map((field) => {
                  const inputId = `modal-field-${field.name}`;
                  const isFullWidth = field.type === 'textarea';

                  if (field.type === 'checkbox') {
                    return (
                      <div
                        key={field.name}
                        className="sm:col-span-2 flex items-center gap-2 pt-2"
                      >
                        <input
                          id={inputId}
                          type="checkbox"
                          checked={Boolean(formState[field.name])}
                          onChange={(e) =>
                            handleFieldChange(field.name, e.target.checked)
                          }
                          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label
                          htmlFor={inputId}
                          className="text-sm font-medium text-slate-700"
                        >
                          {field.label}
                        </label>
                      </div>
                    );
                  }

                  return (
                    <FormField
                      key={field.name}
                      label={field.label}
                      htmlFor={inputId}
                      required={field.required}
                      className={isFullWidth ? 'sm:col-span-2' : ''}
                    >
                      {field.type === 'textarea' ? (
                        <textarea
                          id={inputId}
                          rows={3}
                          value={formState[field.name] ?? ''}
                          onChange={(e) =>
                            handleFieldChange(field.name, e.target.value)
                          }
                          placeholder={field.placeholder || ''}
                          className={INPUT_CLASS}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          id={inputId}
                          value={formState[field.name] ?? ''}
                          onChange={(e) =>
                            handleFieldChange(field.name, e.target.value)
                          }
                          className={INPUT_CLASS}
                        >
                          <option value="">
                            {field.emptyLabel ||
                              (field.required ? 'Select an option…' : 'None')}
                          </option>
                          {field.fk === 'countries' &&
                            countries.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          {field.fk === 'universities' &&
                            universities.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          {field.options &&
                            field.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                        </select>
                      ) : (
                        <input
                          id={inputId}
                          type={field.type}
                          step={field.step}
                          value={formState[field.name] ?? ''}
                          onChange={(e) =>
                            handleFieldChange(field.name, e.target.value)
                          }
                          placeholder={field.placeholder || ''}
                          className={INPUT_CLASS}
                        />
                      )}
                    </FormField>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-5 py-2 text-sm font-medium transition disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editingRow ? 'Save changes' : 'Create record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
