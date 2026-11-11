import React from 'react';
import { PageHeader } from '../components/UI';

export default function Profile() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="My profile"
        subtitle="Manage your academic background and study preferences."
      />
    </div>
  );
}

