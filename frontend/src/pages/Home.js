import React from 'react';
import { PageHeader } from '../components/UI';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Plan your study-abroad journey"
        subtitle="Explore countries, universities, programs, and scholarships with StudyGlobe."
      />
    </div>
  );
}

