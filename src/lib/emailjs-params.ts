import { formatGeoForEmail } from "./geolocation";
import type { GeoLocation, RegionInfo } from "./user-session";

export function buildLocationParams(location: GeoLocation | undefined, region: RegionInfo) {
  const geo = formatGeoForEmail(location);

  return {
    latitude: geo.latitude,
    longitude: geo.longitude,
    location_maps_url: geo.location_maps_url,
    location_accuracy: geo.location_accuracy,
    location_status: geo.location_status,
    country: region.countryName,
    country_code: region.countryCode,
    currency_code: region.currencyCode,
  };
}
