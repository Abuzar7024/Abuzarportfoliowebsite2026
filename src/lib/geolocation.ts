import type { GeoLocation, GeoLocationStatus } from "./user-session";

const DEFAULT_GEO: GeoLocation = {
  latitude: null,
  longitude: null,
  accuracy: null,
  capturedAt: null,
  status: "not_captured",
};

export function requestUserGeolocation(): Promise<GeoLocation> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({ ...DEFAULT_GEO, status: "unavailable" });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: Date.now(),
          status: "granted",
        });
      },
      () => {
        resolve({ ...DEFAULT_GEO, status: "denied", capturedAt: Date.now() });
      },
      {
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 300000,
      }
    );
  });
}

export function formatGeoForEmail(location: GeoLocation | undefined) {
  const lat = location?.latitude;
  const lng = location?.longitude;
  const hasCoords = lat != null && lng != null;

  return {
    latitude: hasCoords ? lat.toFixed(6) : "Not provided",
    longitude: hasCoords ? lng.toFixed(6) : "Not provided",
    location_maps_url: hasCoords ? `https://www.google.com/maps?q=${lat},${lng}` : "N/A",
    location_accuracy: location?.accuracy != null ? `${Math.round(location.accuracy)}m` : "N/A",
    location_status: (location?.status ?? "not_captured") as GeoLocationStatus,
  };
}
