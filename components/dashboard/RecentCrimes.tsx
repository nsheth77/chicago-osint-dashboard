'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crime } from '@/types/crime';
import { useCrimeStore } from '@/lib/store/crime-store';
import { useMemo } from 'react';

interface RecentCrimesProps {
  crimes: Crime[];
}

export function RecentCrimes({ crimes }: RecentCrimesProps) {
  const { setSelectedCrime, selectedSeverities } = useCrimeStore();

  // Filter and sort crimes
  const displayCrimes = useMemo(() => {
    let filtered = crimes;

    if (selectedSeverities.length > 0) {
      filtered = filtered.filter((c) => selectedSeverities.includes(c.severity));
    }

    return filtered
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50); // Show top 50
  }, [crimes, selectedSeverities]);

  return (
    <Card className="p-6 bg-black/40 backdrop-blur-sm border-white/10 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-white mb-4">Recent Crimes</h3>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {displayCrimes.length === 0 ? (
          <div className="text-center text-white/50 py-8">
            No crimes match your filters
          </div>
        ) : (
          displayCrimes.map((crime) => (
            <div
              key={crime.id}
              onClick={() => setSelectedCrime(crime)}
              className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: crime.color }}
                  />
                  <span className="font-medium text-white text-sm">{crime.type}</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: crime.color,
                    color: crime.color,
                  }}
                >
                  {crime.severity}
                </Badge>
              </div>

              <div className="text-xs text-white/60 space-y-1">
                <div>{crime.block}</div>
                <div>{crime.location}</div>
                <div className="flex items-center gap-3">
                  <span>{new Date(crime.date).toLocaleString()}</span>
                  {crime.arrest && (
                    <Badge variant="outline" className="text-xs border-green-500 text-green-500">
                      Arrest
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-xs text-white/50 text-center mt-4 pt-4 border-t border-white/10">
        Showing {displayCrimes.length} of {crimes.length} crimes
      </div>
    </Card>
  );
}
