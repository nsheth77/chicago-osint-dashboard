'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCrimeStore } from '@/lib/store/crime-store';
import { getAllSeverities, getSeverityColor, getSeverityLabel } from '@/lib/utils/severity';

export function FilterPanel() {
  const { selectedSeverities, toggleSeverity, clearAllFilters } = useCrimeStore();

  const severities = getAllSeverities();

  return (
    <Card className="p-6 bg-black/40 backdrop-blur-sm border-white/10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Filters</h3>
        {selectedSeverities.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs text-white/70 hover:text-white"
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-sm text-white/70 mb-2">Severity Level</div>
          <div className="flex flex-wrap gap-2">
            {severities.map((severity) => {
              const isSelected = selectedSeverities.includes(severity);
              const color = getSeverityColor(severity);
              const label = getSeverityLabel(severity);

              return (
                <Badge
                  key={severity}
                  variant={isSelected ? 'default' : 'outline'}
                  className="cursor-pointer transition-all hover:scale-105"
                  style={{
                    backgroundColor: isSelected ? color : 'transparent',
                    borderColor: color,
                    color: isSelected ? 'white' : color,
                  }}
                  onClick={() => toggleSeverity(severity)}
                >
                  <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: color }} />
                  {severity} - {label}
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="text-xs text-white/50 mt-4">
          {selectedSeverities.length === 0
            ? 'Showing all severity levels'
            : `Filtered by: ${selectedSeverities.join(', ')}`}
        </div>
      </div>
    </Card>
  );
}
