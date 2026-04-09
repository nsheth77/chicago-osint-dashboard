'use client';

import { CrimeMap } from '@/components/map/CrimeMap';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { FilterPanel } from '@/components/dashboard/FilterPanel';
import { RecentCrimes } from '@/components/dashboard/RecentCrimes';
import { useCrimeData } from '@/hooks/useCrimeData';

export default function Home() {
  const { crimes, lastUpdated, isLoading, isError, error } = useCrimeData(1000, 30);

  console.log('📊 Page render - crimes:', crimes.length, 'isLoading:', isLoading);

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Data</h1>
          <p className="text-white/70">{error || 'Failed to load crime data'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-sm border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Chicago OSINT Dashboard</h1>
            <p className="text-sm text-white/60">Real-time crime monitoring system</p>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-white/70">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-sm">Loading data...</span>
            </div>
          )}

          {!isLoading && lastUpdated && (
            <div className="flex items-center gap-2 text-white/70">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm">Live • Auto-refresh every 5 minutes</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left Sidebar - Stats and Filters */}
        <div className="w-80 flex flex-col gap-4 overflow-y-auto">
          <StatsCard crimes={crimes} lastUpdated={lastUpdated} />
          <FilterPanel />
        </div>

        {/* Center - Map */}
        <div className="flex-1 rounded-lg border border-white/10" style={{ position: 'relative', minHeight: '500px' }}>
          {isLoading && crimes.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/70">Loading crime data...</p>
              </div>
            </div>
          ) : (
            <CrimeMap crimes={crimes} />
          )}
        </div>

        {/* Right Sidebar - Recent Crimes */}
        <div className="w-96 overflow-hidden">
          <RecentCrimes crimes={crimes} />
        </div>
      </div>
    </div>
  );
}
