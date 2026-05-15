// Geospatial utility functions
import type { Coordinates } from '@/types/location';

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in meters
 */
export function calculateDistance(
  from: Coordinates,
  to: Coordinates,
): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c * 1000; // meters
}

/**
 * Check if a point is within a geofence circle
 */
export function isWithinGeofence(
  point: Coordinates,
  center: Coordinates,
  radiusMeters: number,
): boolean {
  return calculateDistance(point, center) <= radiusMeters;
}

/**
 * Generate an OpenStreetMap link for coordinates
 */
export function generateOSMLink(coords: Coordinates): string {
  return `https://www.openstreetmap.org/?mlat=${coords.latitude}&mlon=${coords.longitude}#map=17/${coords.latitude}/${coords.longitude}`;
}

/**
 * Generate a Google Maps compatible link (still free to link to)
 */
export function generateMapsLink(coords: Coordinates): string {
  return `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coords: Coordinates): string {
  return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
}

/**
 * Determine if location has changed significantly enough to broadcast
 * Uses distance filter to avoid noise
 */
export function hasSignificantMovement(
  prev: Coordinates | null,
  next: Coordinates,
  thresholdMeters: number = 10,
): boolean {
  if (!prev) return true;
  return calculateDistance(prev, next) >= thresholdMeters;
}

/**
 * Calculate bearing between two points (degrees)
 */
export function calculateBearing(from: Coordinates, to: Coordinates): number {
  const dLng = toRadians(to.longitude - from.longitude);
  const y = Math.sin(dLng) * Math.cos(toRadians(to.latitude));
  const x =
    Math.cos(toRadians(from.latitude)) * Math.sin(toRadians(to.latitude)) -
    Math.sin(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.cos(dLng);

  return ((toDegrees(Math.atan2(y, x)) + 360) % 360);
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}
