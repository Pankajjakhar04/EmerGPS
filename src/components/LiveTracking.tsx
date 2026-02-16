import { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Activity, Navigation } from 'lucide-react';
import { supabase, Alert } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function LiveTracking() {
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    checkActiveAlert();
    const interval = setInterval(checkActiveAlert, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeAlert && activeAlert.tracking_enabled) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => stopLocationTracking();
  }, [activeAlert]);

  useEffect(() => {
    if (!activeAlert?.tracking_end_time) return;

    const updateTimer = () => {
      const endTime = new Date(activeAlert.tracking_end_time).getTime();
      const now = new Date().getTime();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeRemaining('Tracking ended');
        disableTracking();
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${minutes}m ${seconds}s remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeAlert]);

  const checkActiveAlert = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .eq('tracking_enabled', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const endTime = new Date(data.tracking_end_time).getTime();
        const now = new Date().getTime();

        if (endTime > now) {
          setActiveAlert(data);
        } else {
          await disableTracking();
          setActiveAlert(null);
        }
      } else {
        setActiveAlert(null);
      }
    } catch (err) {
      console.error('Error checking active alert:', err);
    }
  };

  const disableTracking = async () => {
    if (!activeAlert) return;

    try {
      await supabase
        .from('alerts')
        .update({ tracking_enabled: false })
        .eq('id', activeAlert.id);
    } catch (err) {
      console.error('Error disabling tracking:', err);
    }
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation || watchIdRef.current !== null) return;

    setIsTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        if (!activeAlert) return;

        const { latitude, longitude, accuracy, speed, heading } = position.coords;

        try {
          await supabase.from('location_tracking').insert({
            alert_id: activeAlert.id,
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
          });
        } catch (err) {
          console.error('Error saving location:', err);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
    }
  };

  if (!activeAlert) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl shadow-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Live Tracking Active</h2>
            <p className="text-red-100 text-sm">Your location is being monitored</p>
          </div>
        </div>
        {isTracking && (
          <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg backdrop-blur-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Tracking</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-red-200" />
            <span className="text-sm text-red-100">Time Remaining</span>
          </div>
          <p className="text-lg font-bold">{timeRemaining}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-red-200" />
            <span className="text-sm text-red-100">Current Location</span>
          </div>
          <p className="text-sm font-mono">
            {activeAlert.latitude.toFixed(4)}, {activeAlert.longitude.toFixed(4)}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-5 h-5 text-red-200" />
            <span className="text-sm text-red-100">Alert Status</span>
          </div>
          <p className="text-lg font-bold capitalize">{activeAlert.status}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/20">
        <p className="text-sm text-red-100">
          Location updates are being sent to your emergency contacts every few minutes. Stay safe!
        </p>
      </div>
    </div>
  );
}
