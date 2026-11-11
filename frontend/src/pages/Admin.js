import React from 'react';
import { PageHeader } from '../components/UI';

export default function Admin() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Admin dashboard"
        subtitle="Manage catalog records across countries, universities, programs, intakes, language requirements, and scholarships."
      />
    </div>
  );
}

