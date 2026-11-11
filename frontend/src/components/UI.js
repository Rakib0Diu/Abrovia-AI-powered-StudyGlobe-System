import React from 'react';
import { formatMoney, formatDate, formatDuration } from '../services/api';

export { formatMoney, formatDate, formatDuration };

export function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-9 w-9 border-4',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div
      className={`flex items-center justify-center py-12 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`animate-spin rounded-full border-slate-200 border-t-primary-600 ${
          sizeClasses[size] || sizeClasses.md
        }`}
      />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function ErrorAlert({ message, className = '' }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 ${className}`}
    >
      {message}
    </div>
  );
}

export function EmptyState({ title = 'No results found', message, action, className = '' }) {
  return (
    <div
      className={`rounded-xl border-2 border-dashed border-slate-300 bg-white px-6 py-12 text-center ${className}`}
    >
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {message && <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">{message}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action, className = '' }) {
  return (
    <div
      className={`mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div>
        <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Badge({ color = 'slate', children, className = '' }) {
  const colorMap = {
    blue: 'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200',
    green: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    red: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
    slate: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
        colorMap[color] || colorMap.slate
      } ${className}`}
    >
      {children}
    </span>
  );
}

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  className = '',
  children,
}) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          {label}
          {required && <span className="text-red-600 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

