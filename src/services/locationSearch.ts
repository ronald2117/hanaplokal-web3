export interface PhilippineLocationResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

const FALLBACK_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

function sanitizeDisplayName(displayName: string): string {
  return displayName.replace(/\s+/g, ' ').trim();
}

export async function searchPhilippineLocations(query: string): Promise<PhilippineLocationResult[]> {
  if (query.trim().length < 2) return [];

  const baseUrl = import.meta.env.VITE_LOCATION_SEARCH_API_URL || FALLBACK_SEARCH_URL;
  const endpoint = new URL(baseUrl);
  endpoint.searchParams.set('q', query);
  endpoint.searchParams.set('format', 'jsonv2');
  endpoint.searchParams.set('addressdetails', '1');
  endpoint.searchParams.set('countrycodes', 'ph');
  endpoint.searchParams.set('limit', '8');

  const response = await fetch(endpoint.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch locations');
  }

  const payload = (await response.json()) as Array<Record<string, string>>;

  return payload
    .map(item => {
      const displayName = sanitizeDisplayName(String(item.display_name || ''));
      return {
        id: String(item.place_id || `${item.lat}-${item.lon}`),
        name: displayName.split(',')[0] || 'Pinned location',
        address: displayName,
        lat: Number(item.lat),
        lng: Number(item.lon),
      };
    })
    .filter(item => Number.isFinite(item.lat) && Number.isFinite(item.lng));
}
