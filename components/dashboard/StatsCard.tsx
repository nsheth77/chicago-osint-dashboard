'use client';

import { Card } from '@/components/ui/card';
import { Crime } from '@/types/crime';
import { useMemo } from 'react';

interface StatsCardProps {
  crimes: Crime[];
  lastUpdated: Date | null;
}

export function StatsCard({ crimes, lastUpdated }: StatsCardProps) {
  console.log('📈 StatsCard received crimes:', crimes.length);

  const stats = useMemo(() => {
    return {
      total: crimes.length,
      s5: crimes.filter((c) => c.severity === 'S5').length,
      s4: crimes.filter((c) => c.severity === 'S4').length,
      s3: crimes.filter((c) => c.severity === 'S3').length,
      s2: crimes.filter((c) => c.severity === 'S2').length,
      s1: crimes.filter((c) => c.severity === 'S1').length,
      arrests: crimes.filter((c) => c.arrest).length,
    };
  }, [crimes]);

  return (
    <Card className="p-6 bg-black/40 backdrop-blur-sm border-white/10">
      <h3 className="text-lg font-semibold text-white mb-4">Crime Statistics</h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-white/70">Total Crimes</span>
          <span className="text-2xl font-bold text-white">{stats.total.toLocaleString()}</span>
        </div>

        <div className="h-px bg-white/10" />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-white/70">Critical (S5)</span>
            </span>
            <span className="font-semibold text-red-500">{stats.s5}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-white/70">High (S4)</span>
            </span>
            <span className="font-semibold text-orange-500">{stats.s4}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-white/70">Medium (S3)</span>
            </span>
            <span className="font-semibold text-yellow-500">{stats.s3}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-white/70">Low (S2)</span>
            </span>
            <span className="font-semibold text-blue-500">{stats.s2}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <span className="text-white/70">Very Low (S1)</span>
            </span>
            <span className="font-semibold text-gray-500">{stats.s1}</span>
          </div>
        </div>

        <div className="h-px bg-white/10" />

        <div className="flex justify-between items-center">
          <span className="text-white/70">Arrests Made</span>
          <span className="font-semibold text-green-500">{stats.arrests}</span>
        </div>

        {lastUpdated && (
          <>
            <div className="h-px bg-white/10" />
            <div className="text-xs text-white/50 text-center">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
