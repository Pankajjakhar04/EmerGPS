import { useState, useEffect } from 'react';
import { AlertCircle, MapPin, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PanicButtonProps {
  onAlertCreated: () => void;
}

export default function PanicButton({ onAlertCreated }: PanicButtonProps) {
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<PermissionState | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state);
        result.addEventListener('change', () => {
          setLocationPermission(result.state);
        });
      });
    }
  }, []);

  const getLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Location permission denied. Please enable location access.'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Location information is unavailable'));
              break;
            case error.TIMEOUT:
              reject(new Error('Location request timed out'));
              break;
            default:
              reject(new Error('An unknown error occurred'));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const handlePanicButton = async () => {
    setError(null);
    setIsActivating(true);

    try {
      const position = await getLocation();
      const { latitude, longitude, accuracy } = position.coords;

      const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

      const trackingEndTime = new Date();
      trackingEndTime.setMinutes(trackingEndTime.getMinutes() + 30);

      const { data: alert, error: alertError } = await supabase
        .from('alerts')
        .insert({
          user_id: user?.id,
          latitude,
          longitude,
          accuracy,
          maps_link: mapsLink,
          status: 'active',
          tracking_enabled: true,
          tracking_end_time: trackingEndTime.toISOString(),
        })
        .select()
        .single();

      if (alertError) throw alertError;

      await supabase.from('location_tracking').insert({
        alert_id: alert.id,
        latitude,
        longitude,
        accuracy,
        speed: position.coords.speed,
        heading: position.coords.heading,
      });

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-alert-notifications`;
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId: alert.id,
          latitude,
          longitude,
          mapsLink,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send notifications');
      }

      onAlertCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Emergency Panic Button</h2>
        <p className="text-gray-600">
          Press the button below to send your location to emergency contacts
        </p>
      </div>

      {locationPermission === 'denied' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-1">Location Access Required</h3>
              <p className="text-sm text-yellow-700">
                Please enable location permissions in your browser settings to use the panic button.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3 mb-3">
          <MapPin className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Live Location Tracking</h3>
            <p className="text-sm text-gray-600">
              Your location will be captured and sent immediately
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">30-Minute Tracking</h3>
            <p className="text-sm text-gray-600">
              Continuous location updates for 30 minutes after activation
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <button
        onClick={handlePanicButton}
        disabled={isActivating || locationPermission === 'denied'}
        className="w-full bg-red-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg"
      >
        {isActivating ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Activating Emergency Alert...
          </span>
        ) : (
          '🚨 ACTIVATE EMERGENCY ALERT'
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        By activating, you consent to sharing your location with your emergency contacts
      </p>
    </div>
  );
}
