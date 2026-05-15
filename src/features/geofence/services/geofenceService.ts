// Geofence service
import { supabase } from '@/config/supabase';
import { isWithinGeofence } from '@/utils/geo';
import type { Geofence, GeofenceInsert } from '@/types/database';
import type { Coordinates, GeofenceRegion } from '@/types/location';

export const GeofenceService = {
  /**
   * Create a geofence
   */
  async createGeofence(data: GeofenceInsert): Promise<Geofence | null> {
    const { data: result, error } = await supabase
      .from('geofences')
      .insert(data)
      .select()
      .single();

    if (error) return null;
    return result as Geofence;
  },

  /**
   * Get user's geofences
   */
  async getUserGeofences(userId: string): Promise<Geofence[]> {
    const { data } = await supabase
      .from('geofences')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    return (data ?? []) as Geofence[];
  },

  /**
   * Delete a geofence
   */
  async deleteGeofence(geofenceId: string): Promise<void> {
    await supabase.from('geofences').delete().eq('id', geofenceId);
  },

  /**
   * Check if a location triggers any geofence events
   */
  checkGeofences(
    location: Coordinates,
    geofences: GeofenceRegion[],
    previouslyInside: Set<string>,
  ): { entered: GeofenceRegion[]; exited: GeofenceRegion[] } {
    const entered: GeofenceRegion[] = [];
    const exited: GeofenceRegion[] = [];
    const currentlyInside = new Set<string>();

    for (const fence of geofences) {
      const inside = isWithinGeofence(
        location,
        { latitude: fence.latitude, longitude: fence.longitude },
        fence.radius,
      );

      if (inside) {
        currentlyInside.add(fence.id);
        if (!previouslyInside.has(fence.id) && fence.notifyOnEnter) {
          entered.push(fence);
        }
      } else {
        if (previouslyInside.has(fence.id) && fence.notifyOnExit) {
          exited.push(fence);
        }
      }
    }

    return { entered, exited };
  },
};

export default GeofenceService;
