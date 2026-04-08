import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { distanceInKm, type Coordinates } from '../utils/geo';

interface LocationContextType {
  userLocation: Coordinates;
  locationReady: boolean;
  radiusKm: number;
  setRadiusKm: (radiusKm: number) => void;
  refreshUserLocation: () => void;
  isWithinRadius: (coords: Coordinates) => boolean;
  getDistanceFromUser: (coords: Coordinates) => number;
}

const DEFAULT_LOCATION: Coordinates = { lat: 14.0863, lng: 121.1486 };
const DEFAULT_RADIUS_KM = 5;

const LocationContext = createContext<LocationContextType | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [userLocation, setUserLocation] = useState<Coordinates>(DEFAULT_LOCATION);
  const [locationReady, setLocationReady] = useState(false);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);

  const refreshUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationReady(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationReady(true);
      },
      () => {
        setLocationReady(true);
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  }, []);

  useEffect(() => {
    refreshUserLocation();
  }, [refreshUserLocation]);

  const getDistanceFromUser = useCallback((coords: Coordinates) => {
    return distanceInKm(userLocation, coords);
  }, [userLocation]);

  const isWithinRadius = useCallback((coords: Coordinates) => {
    return getDistanceFromUser(coords) <= radiusKm;
  }, [getDistanceFromUser, radiusKm]);

  const value = useMemo(
    () => ({
      userLocation,
      locationReady,
      radiusKm,
      setRadiusKm,
      refreshUserLocation,
      isWithinRadius,
      getDistanceFromUser,
    }),
    [getDistanceFromUser, isWithinRadius, locationReady, radiusKm, refreshUserLocation, userLocation]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
