import { Suspense } from 'react';
import HomeContent from './home-content';

export default function Page() {
  return (
    <Suspense fallback={<div className="animate-pulse">Loading filters...</div>}>
      <HomeContent />
    </Suspense>
  );
}
