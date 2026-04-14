'use client';

import { useState, KeyboardEvent, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { geocodeZipCode } from '@/lib/utils/geocoding';

interface ZipCodeInputProps {
  onZoomToLocation: (center: [number, number]) => void;
}

export function ZipCodeInput({ onZoomToLocation }: ZipCodeInputProps) {
  const [zipCode, setZipCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Only allow digits and limit to 5 characters
    if (value === '' || /^\d{0,5}$/.test(value)) {
      setZipCode(value);

      // Clear error when user starts typing
      if (error) {
        setError(null);
      }
    }
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;

    // Prevent default form submission behavior
    e.preventDefault();

    // Don't process if already loading or empty input
    if (isLoading || !zipCode) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await geocodeZipCode(zipCode);

      if (result.success && result.center) {
        // Success - zoom to location
        onZoomToLocation(result.center);

        // Optionally clear input after successful zoom
        // setZipCode('');
      } else {
        // Show error
        setError(result.error || 'Failed to geocode zip code');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('Failed to geocode zip code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10 w-48">
      <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg p-2">
        <div className="relative">
          <Input
            type="text"
            value={zipCode}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter zip code"
            disabled={isLoading}
            aria-label="Chicago zip code"
            aria-invalid={!!error}
            aria-describedby={error ? 'zip-error' : undefined}
            className={error ? 'border-red-500 ring-2 ring-red-500/20' : ''}
          />

          {/* Loading spinner */}
          {isLoading && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div
            id="zip-error"
            className="mt-1 text-xs text-red-400"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Hint text when no error */}
        {!error && !isLoading && (
          <div className="mt-1 text-xs text-gray-500">
            Press Enter to search
          </div>
        )}
      </div>
    </div>
  );
}
