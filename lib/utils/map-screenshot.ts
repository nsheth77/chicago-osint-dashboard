import type mapboxgl from 'mapbox-gl';

/**
 * Captures the current Mapbox map as a base64-encoded PNG image
 * @param map - Mapbox map instance
 * @returns Base64 data URL (data:image/png;base64,...)
 */
export function captureMapScreenshot(map: mapboxgl.Map): string | null {
  try {
    const canvas = map.getCanvas();

    if (!canvas) {
      console.error('Map canvas not available');
      return null;
    }

    // Export canvas as PNG data URL
    // Using 'image/png' for better quality than JPEG
    const dataUrl = canvas.toDataURL('image/png');

    console.log('📸 Map screenshot captured:', {
      size: `${canvas.width}x${canvas.height}`,
      dataUrlLength: dataUrl.length,
    });

    return dataUrl;
  } catch (error) {
    console.error('Error capturing map screenshot:', error);
    return null;
  }
}

/**
 * Converts base64 data URL to File object for upload
 * @param dataUrl - Base64 data URL from canvas.toDataURL()
 * @param filename - Name for the file (e.g., 'map-snapshot.png')
 * @returns File object ready for form upload
 */
export function dataUrlToFile(dataUrl: string, filename: string): File | null {
  try {
    // Extract base64 data from data URL
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
      console.error('Invalid data URL format');
      return null;
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Decode base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create Blob and File
    const blob = new Blob([bytes], { type: mimeType });
    const file = new File([blob], filename, { type: mimeType });

    return file;
  } catch (error) {
    console.error('Error converting data URL to file:', error);
    return null;
  }
}

/**
 * Validates that map is ready for screenshot
 * @param map - Mapbox map instance
 * @returns true if map is loaded and ready
 */
export function isMapReadyForScreenshot(map: mapboxgl.Map | null): boolean {
  if (!map) return false;

  // Check if map is loaded
  if (!map.loaded()) {
    console.warn('Map not fully loaded yet');
    return false;
  }

  return true;
}
